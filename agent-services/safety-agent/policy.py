"""Deterministic policy rules. These decide the outcome; the LLM never does."""

from models import CheckResult, ProposedAction

ALLOWED_ACTIONS = {
    "approve_repair",
    "book_amenity",
    "send_notice",
    "view_resident_data",
    "update_vehicle",
    "checkout_order",
}

ALLOWED_ROLES = {"Resident", "ApartmentAdmin", "SuperAdmin", "GateSecurity"}

# Role -> action types it may propose. SuperAdmin is handled separately (all actions, any tenant).
ROLE_PERMISSIONS = {
    "Resident": {"book_amenity", "view_resident_data", "update_vehicle", "checkout_order"},
    "ApartmentAdmin": {"approve_repair", "book_amenity", "send_notice", "view_resident_data", "update_vehicle", "checkout_order"},
    "GateSecurity": set(),
}

# Spec: anything above this needs manager approval (spec section 3, Human-in-the-Loop).
SPEND_LIMIT_LKR = 25_000


def schema_check(p: ProposedAction) -> CheckResult:
    problems = []
    if p.action.type not in ALLOWED_ACTIONS:
        problems.append(f"unknown action type '{p.action.type}'")
    if p.requester.role not in ALLOWED_ROLES:
        problems.append(f"unknown role '{p.requester.role}'")
    if p.action.type == "approve_repair" and p.action.amountLkr is None:
        problems.append("approve_repair requires amountLkr")
    if p.action.amountLkr is not None and p.action.amountLkr < 0:
        problems.append("amountLkr must not be negative")
    if problems:
        return CheckResult(name="schema", passed=False, detail="; ".join(problems))
    return CheckResult(name="schema", passed=True)


def tenant_check(p: ProposedAction) -> CheckResult:
    if p.requester.role == "SuperAdmin":
        return CheckResult(name="tenant_isolation", passed=True, detail="SuperAdmin is cross-tenant (logged)")
    if p.requester.tenantId != p.tenantId or p.requester.tenantId != p.action.targetTenantId:
        return CheckResult(
            name="tenant_isolation", passed=False,
            detail=f"requester tenant {p.requester.tenantId}, proposal tenant {p.tenantId}, target tenant {p.action.targetTenantId}",
        )
    return CheckResult(name="tenant_isolation", passed=True, detail=f"tenant {p.tenantId} matches")


def role_check(p: ProposedAction) -> CheckResult:
    role = p.requester.role
    if role == "SuperAdmin":
        return CheckResult(name="role_permission", passed=True)
    if p.action.type not in ROLE_PERMISSIONS.get(role, set()):
        return CheckResult(name="role_permission", passed=False, detail=f"{role} may not {p.action.type}")
    # Residents may only view their own record.
    if role == "Resident" and p.action.type == "view_resident_data":
        if p.requester.residentId is None or p.action.targetResourceId != f"resident:{p.requester.residentId}":
            return CheckResult(name="role_permission", passed=False, detail="residents may only view their own record")
    return CheckResult(name="role_permission", passed=True)


def spend_check(p: ProposedAction) -> CheckResult:
    amount = p.action.amountLkr
    if p.action.type == "approve_repair" and amount is not None and amount > SPEND_LIMIT_LKR:
        return CheckResult(name="spend_limit", passed=False, detail=f"{amount:,.0f} is above the LKR {SPEND_LIMIT_LKR:,} auto-approval limit")
    return CheckResult(name="spend_limit", passed=True)
