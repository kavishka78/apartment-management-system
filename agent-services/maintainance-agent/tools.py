"""Allow-listed, typed, read-only tools available to maintenance agents."""
from __future__ import annotations

from typing import Dict, List

from models import ALLOWED_SLA_RISKS, SlaInput, TechnicianInput


def evaluate_sla_risk(sla: SlaInput) -> Dict[str, str]:
    """Return the backend-calculated SLA risk after validating the tool input."""
    if sla.risk not in ALLOWED_SLA_RISKS:
        raise ValueError("Unsupported SLA risk supplied to evaluate_sla_risk")
    return {"risk": sla.risk, "reason": " ".join(sla.reason.split())[:500] or "Risk calculated by the ASP.NET Core SLA policy."}


def lookup_eligible_technicians(technicians: List[TechnicianInput], category: str) -> List[Dict[str, int | str]]:
    """Return only eligible candidates, ordered deterministically by workload then ID."""
    if not category or len(category) > 100:
        raise ValueError("Invalid category supplied to lookup_eligible_technicians")
    candidates: List[Dict[str, int | str]] = []
    for technician in technicians:
        skills = [part.strip() for skill in technician.skills for part in skill.split(",") if part.strip()]
        if technician.availability.lower() == "available" and any(category.lower() == skill.lower() for skill in skills):
            candidates.append({"id": technician.id, "name": technician.name, "active_jobs": technician.active_jobs})
    return sorted(candidates, key=lambda item: (int(item["active_jobs"]), int(item["id"])))
