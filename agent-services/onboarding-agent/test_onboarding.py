"""Tests for the Resident Onboarding Assistant. They run without a Gemini key (rules extractor)."""

import pytest
from fastapi.testclient import TestClient

import extraction
import main
from models import OnboardingRequest, UnitInfo
from validation import validate

GOOD_TEXT = """Name: Kamal Perera
Email: kamal.p@example.com
Phone: +94 77 123 4567
NIC: 199012345678
Unit: a-101
Plate: cab-1234
Monthly income: 350000
Emergency contact: Nimali Perera - +94 71 000 1111
Move in: 2026-10-01
"""

UNITS = [
    UnitInfo(id=1, unitNumber="A-101", status="Available"),
    UnitInfo(id=2, unitNumber="A-102", status="Occupied"),
]


def run(text: str, **overrides):
    req = OnboardingRequest(tenantId=1, text=text, units=UNITS, existingEmails=[], existingNationalIds=[], **overrides)
    draft = extraction.extract_with_rules(text)
    return draft, validate(draft, req)


def errors(issues):
    return {i.field for i in issues if i.severity == "error"}


def test_rules_extract_all_fields():
    d = extraction.extract_with_rules(GOOD_TEXT)
    assert d.fullName == "Kamal Perera"
    assert d.email == "kamal.p@example.com"
    assert d.nationalId == "199012345678"
    assert d.unitNumber == "A-101"
    assert d.plateNumber == "CAB-1234"
    assert d.monthlyIncome == 350000
    assert d.moveInDate == "2026-10-01"


def test_good_text_is_ready():
    draft, issues = run(GOOD_TEXT)
    assert errors(issues) == set()


def test_missing_name_is_an_error():
    _, issues = run("Email: a@b.com\nUnit: A-101")
    assert "fullName" in errors(issues)


def test_bad_email_is_an_error():
    _, issues = run("Name: X Y\nEmail: not-an-email\nUnit: A-101")
    assert "email" in errors(issues)


def test_duplicate_email_is_an_error():
    req = OnboardingRequest(tenantId=1, text=GOOD_TEXT, units=UNITS, existingEmails=["KAMAL.P@example.com"], existingNationalIds=[])
    issues = validate(extraction.extract_with_rules(GOOD_TEXT), req)
    assert "email" in errors(issues)


def test_bad_nic_is_an_error():
    _, issues = run("Name: X Y\nNIC: 12345\nUnit: A-101")
    assert "nationalId" in errors(issues)


def test_old_format_nic_is_accepted():
    _, issues = run("Name: X Y\nNIC: 912345678V\nUnit: A-101")
    assert "nationalId" not in errors(issues)


def test_duplicate_nic_is_an_error():
    req = OnboardingRequest(tenantId=1, text=GOOD_TEXT, units=UNITS, existingEmails=[], existingNationalIds=["199012345678"])
    issues = validate(extraction.extract_with_rules(GOOD_TEXT), req)
    assert "nationalId" in errors(issues)


def test_occupied_unit_is_an_error():
    _, issues = run("Name: X Y\nUnit: A-102")
    assert "unitNumber" in errors(issues)


def test_unknown_unit_is_a_warning_not_an_error():
    _, issues = run("Name: X Y\nUnit: Z-999")
    assert "unitNumber" not in errors(issues)
    assert any(i.field == "unitNumber" and i.severity == "warning" for i in issues)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("AGENT_SHARED_SECRET", raising=False)
    return TestClient(main.app)


def test_endpoint_returns_draft_and_ready_flag(client):
    body = {"tenantId": 1, "text": GOOD_TEXT, "units": [u.model_dump() for u in UNITS], "existingEmails": [], "existingNationalIds": []}
    res = client.post("/onboarding/draft", json=body)
    assert res.status_code == 200
    data = res.json()
    assert data["ready"] is True
    assert data["extractedBy"] == "rules"
    assert data["draft"]["fullName"] == "Kamal Perera"


def test_endpoint_not_ready_when_name_missing(client):
    body = {"tenantId": 1, "text": "Email: a@b.com", "units": [], "existingEmails": [], "existingNationalIds": []}
    data = client.post("/onboarding/draft", json=body).json()
    assert data["ready"] is False


def test_health_reports_llm_configured(client):
    assert client.get("/health").json()["llm_configured"] is False
