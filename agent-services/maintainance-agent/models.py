"""
Pydantic schemas for the Maintenance Triage AI Agent.

Input  : TriageRequest  (sent by ASP.NET Core)
Output : TriageResponse (returned to ASP.NET Core)
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

# â”€â”€â”€ Allowed enum values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALLOWED_CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Cleaning", "Security", "Elevator", "Building", "General", "Carpentry", "Appliance", "Pest Control", "Landscaping"]
ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Urgent"]
ALLOWED_SLA_RISKS  = ["Low", "Medium", "High", "Urgent"]


# â”€â”€â”€ Request models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ComplaintInput(BaseModel):
    id: int
    title: str
    description: str
    priority: Optional[str] = None
    category: Optional[str] = None
    sla_due_date: Optional[str] = None

    @field_validator("title", "description")
    @classmethod
    def validate_complaint_text(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned or len(cleaned) > 2000:
            raise ValueError("Complaint text must be between 1 and 2000 characters.")
        if any(ord(character) < 32 for character in cleaned):
            raise ValueError("Complaint text contains control characters.")
        return cleaned


class TechnicianInput(BaseModel):
    id: int
    name: str
    skills: List[str]       # ["Plumbing"] or ["Plumbing, Electrical"] - both handled
    availability: str       # "Available" | "Busy" | "Offline"
    active_jobs: int = 0

    @field_validator("active_jobs")
    @classmethod
    def validate_active_jobs(cls, value: int) -> int:
        if value < 0 or value > 1000:
            raise ValueError("active_jobs must be between 0 and 1000")
        return value


class SlaInput(BaseModel):
    risk: str               # "Low" | "Medium" | "High"
    reason: str

    @field_validator("risk")
    @classmethod
    def validate_sla_risk_input(cls, value: str) -> str:
        if value not in ALLOWED_SLA_RISKS:
            raise ValueError("Unsupported SLA risk")
        return value


class TriageRequest(BaseModel):
    complaint: ComplaintInput
    technicians: List[TechnicianInput]
    sla: SlaInput
    manager_feedback: Optional[str] = None


# â”€â”€â”€ Response models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class AgentStep(BaseModel):
    """A visible, auditable unit of work; no hidden reasoning is retained."""
    sequence: int
    agentRole: str
    action: str
    status: str
    toolName: str = ""
    inputSummary: str = ""
    outputSummary: str = ""
    validationResult: str = ""
    durationMilliseconds: int = 0


class TriageRecommendation(BaseModel):
    """Structured AI recommendation - validated before returning to ASP.NET."""
    category: str
    priority: str
    reason: str
    recommendedTechnicianId: Optional[int] = None
    technicianReason: str
    slaRisk: str
    slaReason: str
    
    # Workflow Audit Fields
    plan: Optional[List[str]] = None
    completedSteps: Optional[List[str]] = None
    toolResults: Optional[str] = None
    validationResults: Optional[str] = None
    errors: Optional[str] = None
    agentSteps: List[AgentStep] = Field(default_factory=list)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in ALLOWED_CATEGORIES:
            raise ValueError("Unsupported category")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in ALLOWED_PRIORITIES:
            raise ValueError("Unsupported priority")
        return v

    @field_validator("slaRisk")
    @classmethod
    def validate_sla_risk(cls, v: str) -> str:
        if v not in ALLOWED_SLA_RISKS:
            raise ValueError("Unsupported SLA risk")
        return v


class TriageResponse(BaseModel):
    """Outer envelope returned by POST /triage."""
    success: bool
    recommendation: Optional[TriageRecommendation] = None
    error: Optional[str] = None



