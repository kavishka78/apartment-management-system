"""Injection and scope scan on free text.

This is a deterministic pattern scan. It runs without any API key, so the agent
works offline and its tests are repeatable. An LLM classifier can be added later
as a second opinion, but it never overrides a deterministic block.
"""

import re

from models import CheckResult

_PATTERNS = [
    # Instruction overrides
    r"ignore (all |any |your |the )?(previous |prior |above )?(instructions|rules|policies)",
    r"disregard (all |your |the )?(instructions|rules|policies)",
    r"you are now\b",
    r"system prompt",
    r"approve (everything|all|anything)",
    # Requests for data outside the requester's scope
    r"\b(other|another) (unit|tenant|complex|building)s?\b",
    r"\bunit \d+[a-z]?'?s? (residents?|tenants?|data|vehicles?)\b",
    r"all (residents|tenants|units)'? (data|details|records|phone)",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in _PATTERNS]


def scan(free_text: str | None) -> CheckResult:
    if not free_text:
        return CheckResult(name="injection_scan", passed=True, detail="no free text")
    for rx in _COMPILED:
        m = rx.search(free_text)
        if m:
            return CheckResult(name="injection_scan", passed=False, detail=f"matched '{m.group(0)}'")
    return CheckResult(name="injection_scan", passed=True, detail="no override or scope request found")
