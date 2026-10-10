"""Deterministic checks on a draft. The LLM only proposes values; these rules decide what is valid."""

import re

from models import Draft, Issue, OnboardingRequest

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?\d[\d\s-]{8,14}\d$")
# Sri Lankan NIC: old format 9 digits + V/X, new format 12 digits.
NIC_OLD_RE = re.compile(r"^\d{9}[VvXx]$")
NIC_NEW_RE = re.compile(r"^\d{12}$")
PLATE_RE = re.compile(r"^[A-Z]{2,3}-?\d{4}$")


def validate(draft: Draft, req: OnboardingRequest) -> list[Issue]:
    issues: list[Issue] = []

    if not draft.fullName.strip():
        issues.append(Issue(field="fullName", severity="error", message="Full name is required."))

    if not draft.email:
        issues.append(Issue(field="email", severity="warning", message="No email found."))
    elif not EMAIL_RE.match(draft.email):
        issues.append(Issue(field="email", severity="error", message="Email format is not valid."))
    elif draft.email.lower() in {e.lower() for e in req.existingEmails}:
        issues.append(Issue(field="email", severity="error", message="A resident with this email already exists."))

    if draft.phoneNumber and not PHONE_RE.match(draft.phoneNumber):
        issues.append(Issue(field="phoneNumber", severity="warning", message="Phone number looks unusual; please check."))

    if not draft.nationalId:
        issues.append(Issue(field="nationalId", severity="warning", message="No NIC found."))
    elif not (NIC_OLD_RE.match(draft.nationalId) or NIC_NEW_RE.match(draft.nationalId)):
        issues.append(Issue(field="nationalId", severity="error", message="NIC must be 9 digits + V/X or 12 digits."))
    elif draft.nationalId.upper() in {n.upper() for n in req.existingNationalIds}:
        issues.append(Issue(field="nationalId", severity="error", message="A resident with this NIC already exists."))

    if not draft.unitNumber:
        issues.append(Issue(field="unitNumber", severity="warning", message="No unit found; the manager must choose one."))
    else:
        unit = next((u for u in req.units if u.unitNumber.upper() == draft.unitNumber.upper()), None)
        if unit is None:
            issues.append(Issue(field="unitNumber", severity="warning", message=f"Unit {draft.unitNumber} does not exist yet and would be created."))
        elif unit.status != "Available":
            issues.append(Issue(field="unitNumber", severity="error", message=f"Unit {unit.unitNumber} is {unit.status}, not available."))

    if draft.plateNumber and not PLATE_RE.match(draft.plateNumber.replace(" ", "")):
        issues.append(Issue(field="plateNumber", severity="warning", message="Vehicle plate format is unusual; please check."))

    return issues
