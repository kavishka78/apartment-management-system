"""
Pydantic schemas for the Maintenance Triage AI Agent.

Input  : TriageRequest  (sent by ASP.NET Core)
Output : TriageResponse (returned to ASP.NET Core)
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, field_validator

# ─── Allowed enum values ────────────────────────────────────────────────────
ALLOWED_CATEGORIES = ["Plumbing", "Electrical", "Air Conditioning", "Cleaning", "Security", "Other"]
ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Urgent"]
ALLOWED_SLA_RISKS  = ["Low", "Medium", "High"]


# ─── Request models ─────────────────────────────────────────────────────────

class ComplaintInput(BaseModel):
    id: int
    title: str
    description: str
    priority: Optional[str] = None
    category: Optional[str] = None
    sla_due_date: Optional[str] = None


class TechnicianInput(BaseModel):
    id: int
    name: str
    skills: List[str]       # ["Plumbing"] or ["Plumbing, Electrical"] — both handled
    availability: str       # "Available" | "Busy" | "Offline"
    active_jobs: int = 0


class SlaInput(BaseModel):
    risk: str               # "Low" | "Medium" | "High"
    reason: str


class TriageRequest(BaseModel):
    complaint: ComplaintInput
    technicians: List[TechnicianInput]
    sla: SlaInput


# ─── Response models ─────────────────────────────────────────────────────────

class TriageRecommendation(BaseModel):
    """Structured AI recommendation — validated before returning to ASP.NET."""
    category: str
    priority: str
    reason: str
    recommendedTechnicianId: Optional[int] = None
    technicianReason: str
    slaRisk: str
    slaReason: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        return v if v in ALLOWED_CATEGORIES else "Other"

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        return v if v in ALLOWED_PRIORITIES else "Medium"

    @field_validator("slaRisk")
    @classmethod
    def validate_sla_risk(cls, v: str) -> str:
        return v if v in ALLOWED_SLA_RISKS else "Low"


class TriageResponse(BaseModel):
    """Outer envelope returned by POST /triage."""
    success: bool
    recommendation: Optional[TriageRecommendation] = None
    error: Optional[str] = None
