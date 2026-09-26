"""
Maintenance Triage Agent — core logic.

Responsibilities:
  1. Parse and normalise the incoming TriageRequest
  2. Build a rich prompt from complaint + technician + SLA data
  3. Call the Gemini service
  4. Validate the structured response with Pydantic
  5. Enforce the business rule: technician IDs must come from the supplied list
  6. Fall back gracefully to keyword heuristics if Gemini is unavailable

The agent is ADVISORY ONLY — it never writes to the database.
"""

from __future__ import annotations
import re
from typing import List, Optional

from models import (
    TriageRequest,
    TriageRecommendation,
    ALLOWED_CATEGORIES,
    ALLOWED_PRIORITIES,
    ALLOWED_SLA_RISKS,
)
from services.gemini_service import call_gemini


# ─── Helpers ────────────────────────────────────────────────────────────────

def _normalise_skills(raw_skills: List[str]) -> List[str]:
    """
    ASP.NET sends skills as ["Plumbing, Electrical"] (single CSV element).
    Split and strip so we get ["Plumbing", "Electrical"].
    """
    result = []
    for s in raw_skills:
        for part in s.split(","):
            clean = part.strip()
            if clean:
                result.append(clean)
    return result


def _build_prompt(req: TriageRequest) -> str:
    """Construct a clear, structured prompt from the request data."""
    techs_block = ""
    for t in req.technicians:
        skills_str = ", ".join(_normalise_skills(t.skills)) or "None"
        techs_block += (
            f"  • ID {t.id} | {t.name} | Skills: {skills_str} | "
            f"Availability: {t.availability} | Active Jobs: {t.active_jobs}\n"
        )
    if not techs_block:
        techs_block = "  No technicians supplied.\n"

    return f"""Analyze the following maintenance complaint and return a JSON recommendation.

=== COMPLAINT ===
ID          : {req.complaint.id}
Title       : {req.complaint.title}
Description : {req.complaint.description}
SLA Due Date: {req.complaint.sla_due_date or "Not set"}

=== SLA CONTEXT (calculated by the backend) ===
Risk   : {req.sla.risk}
Reason : {req.sla.reason}

=== AVAILABLE TECHNICIANS ===
{techs_block}
=== INSTRUCTIONS ===
1. Identify the correct category from: {", ".join(ALLOWED_CATEGORIES)}
2. Suggest the correct priority from: {", ".join(ALLOWED_PRIORITIES)}
3. Match technician skills to the complaint category.
4. Prefer available technicians. Consider active workload (fewer is better).
5. Recommend the best technician by ID, or null if none qualifies.
6. Assess SLA risk using the backend context. Choose from: {", ".join(ALLOWED_SLA_RISKS)}
7. Return ONLY the JSON object — no extra text."""


# ─── Heuristic fallback ──────────────────────────────────────────────────────

def _keyword_category(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["water", "leak", "pipe", "drain", "toilet", "faucet", "plumb"]):
        return "Plumbing"
    if any(w in t for w in ["electric", "power", "socket", "wiring", "light", "switch", "burn", "spark"]):
        return "Electrical"
    if any(w in t for w in ["ac", "air", "cool", "hvac", "condition", "ventilat"]):
        return "Air Conditioning"
    if any(w in t for w in ["clean", "dirt", "garbage", "trash", "sweep", "mop", "dust"]):
        return "Cleaning"
    if any(w in t for w in ["secur", "lock", "door", "cctv", "camera", "alarm", "guard", "theft"]):
        return "Security"
    return "Other"


def _keyword_priority(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["heavy", "burst", "emergency", "flood", "spark", "fire", "urgent", "severe"]):
        return "Urgent"
    if any(w in t for w in ["leak", "damage", "broken", "not work", "smell", "burn"]):
        return "High"
    if any(w in t for w in ["minor", "slow", "small", "normal"]):
        return "Low"
    return "Medium"


def _heuristic_fallback(req: TriageRequest, reason: str) -> TriageRecommendation:
    """Return a rule-based recommendation when Gemini is unavailable."""
    combined = req.complaint.title + " " + req.complaint.description
    category = _keyword_category(combined)
    priority = _keyword_priority(combined)

    recommended_id: Optional[int] = None
    tech_reason = "No technician with matching skills is currently available."
    best_score = -999

    for t in req.technicians:
        if t.availability.lower() != "available":
            continue
        skills = _normalise_skills(t.skills)
        match = any(category.lower() in s.lower() for s in skills)
        score = (10 if match else 0) - t.active_jobs
        if score > best_score:
            best_score = score
            recommended_id = t.id
            tech_reason = (
                f"{t.name} {'has matching ' + category + ' skills and' if match else 'is'} "
                f"available with {t.active_jobs} active job(s). "
                f"[Heuristic fallback — Gemini unavailable: {reason[:80]}]"
            )

    sla_risk = req.sla.risk if req.sla.risk in ALLOWED_SLA_RISKS else "Medium"

    return TriageRecommendation(
        category=category,
        priority=priority,
        reason=f"Heuristic analysis (Gemini unavailable): {reason[:120]}",
        recommendedTechnicianId=recommended_id,
        technicianReason=tech_reason,
        slaRisk=sla_risk,
        slaReason=req.sla.reason,
    )


# ─── Main entry point ────────────────────────────────────────────────────────

async def triage_complaint(req: TriageRequest) -> TriageRecommendation:
    """
    Analyze a maintenance complaint and return a structured recommendation.

    Flow:
      1. Build prompt
      2. Call Gemini (structured JSON output)
      3. Validate with Pydantic
      4. Enforce: recommendedTechnicianId must be in supplied list
      5. Return recommendation (or heuristic fallback on failure)
    """
    prompt = _build_prompt(req)
    valid_tech_ids = {t.id for t in req.technicians}

    try:
        parsed = await call_gemini(prompt)

        # Safety: reject hallucinated technician IDs
        rec_id = parsed.get("recommendedTechnicianId")
        if rec_id is not None and rec_id not in valid_tech_ids:
            parsed["recommendedTechnicianId"] = None
            parsed["technicianReason"] = (
                parsed.get("technicianReason", "") +
                f" (Technician ID {rec_id} not in supplied list — cleared.)"
            )

        return TriageRecommendation(**parsed)

    except Exception as exc:
        print(f"[Agent] Gemini triage failed: {exc}. Using heuristic fallback.")
        return _heuristic_fallback(req, str(exc))
