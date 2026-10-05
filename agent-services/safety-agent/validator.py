"""Combines the individual checks into one verdict.

Order of precedence: block > needs_human > approve. Every check runs even after
one fails, so the audit trail shows the full picture.
"""

import uuid

import injection
import policy
from models import CheckResult, ProposedAction, SafetyVerdict

HARD_BLOCK_CHECKS = {"schema", "tenant_isolation", "role_permission"}


def validate(p: ProposedAction) -> SafetyVerdict:
    checks: list[CheckResult] = [
        policy.schema_check(p),
        policy.tenant_check(p),
        policy.role_check(p),
        policy.spend_check(p),
        injection.scan(p.freeText),
    ]
    failed = {c.name: c for c in checks if not c.passed}

    if any(name in failed for name in HARD_BLOCK_CHECKS):
        verdict, reason = "block", _reason(failed, HARD_BLOCK_CHECKS)
    elif "injection_scan" in failed and p.requester.role == "Resident":
        # A resident's free text tries to override rules or reach other data: stop it outright.
        verdict, reason = "block", _reason(failed, {"injection_scan"})
    elif failed:
        # Spend limit, or an injection flag from a staff member: a human decides.
        verdict, reason = "needs_human", _reason(failed, set(failed))
    else:
        verdict, reason = "approve", "All checks passed."

    return SafetyVerdict(
        verdict=verdict,
        approvalRequired=verdict == "needs_human",
        reason=reason,
        checks=checks,
        traceId=f"trace_{uuid.uuid4().hex[:12]}",
    )


def _reason(failed: dict[str, CheckResult], names: set[str]) -> str:
    return " ".join(f"{failed[n].name}: {failed[n].detail}." for n in sorted(names) if n in failed)
