"""Request and response models for the Resident Onboarding Assistant."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class UnitInfo(BaseModel):
    id: int
    unitNumber: str
    status: str


class OnboardingRequest(BaseModel):
    tenantId: int
    text: str = Field(min_length=1, max_length=4000)
    # Data the backend already allows this manager to see. The agent cannot query anything itself.
    units: list[UnitInfo] = []
    existingEmails: list[str] = []
    existingNationalIds: list[str] = []


class HouseholdMember(BaseModel):
    name: str = ""
    relation: str = ""
    age: str = ""


class Draft(BaseModel):
    fullName: str = ""
    email: str = ""
    phoneNumber: str = ""
    nationalId: str = ""
    unitNumber: str = ""
    plateNumber: str = ""
    monthlyIncome: Optional[float] = None
    emergencyContact: str = ""
    moveInDate: str = ""
    householdMembers: list[HouseholdMember] = []


class Issue(BaseModel):
    field: str
    severity: Literal["error", "warning"]
    message: str


class OnboardingDraftResponse(BaseModel):
    draft: Draft
    issues: list[Issue]
    ready: bool
    extractedBy: Literal["gemini", "rules"]
