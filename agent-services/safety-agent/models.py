"""Request and verdict models for the Validation & Safety Agent."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

Verdict = Literal["approve", "needs_human", "block"]
Role = Literal["Resident", "ApartmentAdmin", "SuperAdmin", "GateSecurity"]


class Requester(BaseModel):
    userId: int
    role: str  # validated against Role in policy.py so bad values become a schema failure
    tenantId: int
    residentId: Optional[int] = None


class ProposedActionTarget(BaseModel):
    type: str  # validated against ALLOWED_ACTIONS in policy.py
    targetTenantId: int
    targetResourceId: str = ""
    amountLkr: Optional[float] = None


class ProposedAction(BaseModel):
    workflowId: str
    tenantId: int
    proposedBy: str
    requester: Requester
    action: ProposedActionTarget
    freeText: Optional[str] = Field(default=None, max_length=4000)


class CheckResult(BaseModel):
    name: str
    passed: bool
    detail: str = ""


class SafetyVerdict(BaseModel):
    verdict: Verdict
    approvalRequired: bool
    reason: str
    checks: list[CheckResult]
    traceId: str
