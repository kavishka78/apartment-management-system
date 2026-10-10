from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

import main
from models import TriageRecommendation


def _payload():
    return {
        "complaint": {
            "id": 51,
            "title": "Kitchen sink leak",
            "description": "Water is leaking below the kitchen sink.",
        },
        "technicians": [
            {
                "id": 8,
                "name": "On-call plumber",
                "skills": ["Plumbing"],
                "availability": "Available",
                "active_jobs": 0,
            }
        ],
        "sla": {"risk": "High", "reason": "Response is due soon."},
    }


def _recommendation():
    return TriageRecommendation(
        category="Plumbing",
        priority="High",
        reason="A water leak needs prompt attention.",
        recommendedTechnicianId=8,
        technicianReason="The available plumber has the lowest workload.",
        slaRisk="High",
        slaReason="Response is due soon.",
        plan=["ApprovalGate: wait for manager approval."],
        toolResults='{"selectedId":8}',
        validationResults="Recommendation passed deterministic checks.",
    )


def test_triage_requires_the_internal_agent_key(monkeypatch):
    monkeypatch.setattr(main, "AGENT_SHARED_SECRET", "test-agent-key")
    triage_mock = AsyncMock(return_value=_recommendation())
    monkeypatch.setattr(main, "triage_complaint", triage_mock)

    with TestClient(main.app) as client:
        response = client.post("/triage", json=_payload())

    assert response.status_code == 401
    triage_mock.assert_not_awaited()


def test_triage_returns_structured_advice_without_assigning_a_ticket(monkeypatch):
    monkeypatch.setattr(main, "AGENT_SHARED_SECRET", "test-agent-key")
    triage_mock = AsyncMock(return_value=_recommendation())
    monkeypatch.setattr(main, "triage_complaint", triage_mock)

    with TestClient(main.app) as client:
        response = client.post(
            "/triage",
            json=_payload(),
            headers={"X-Agent-Key": "test-agent-key"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["recommendation"]["recommendedTechnicianId"] == 8
    assert body["recommendation"]["category"] == "Plumbing"
    assert triage_mock.await_count == 1


def test_triage_rejects_invalid_request_before_running_agents(monkeypatch):
    monkeypatch.setattr(main, "AGENT_SHARED_SECRET", "test-agent-key")
    triage_mock = AsyncMock(return_value=_recommendation())
    monkeypatch.setattr(main, "triage_complaint", triage_mock)
    invalid_payload = _payload()
    invalid_payload["complaint"]["title"] = ""

    with TestClient(main.app) as client:
        response = client.post(
            "/triage",
            json=invalid_payload,
            headers={"X-Agent-Key": "test-agent-key"},
        )

    assert response.status_code == 422
    triage_mock.assert_not_awaited()


def test_triage_reports_agent_failure_as_a_structured_safe_error(monkeypatch):
    monkeypatch.setattr(main, "AGENT_SHARED_SECRET", "test-agent-key")
    triage_mock = AsyncMock(side_effect=RuntimeError("triage unavailable"))
    monkeypatch.setattr(main, "triage_complaint", triage_mock)

    with TestClient(main.app) as client:
        response = client.post(
            "/triage",
            json=_payload(),
            headers={"X-Agent-Key": "test-agent-key"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "success": False,
        "recommendation": None,
        "error": "triage unavailable",
    }
