"""Print a readable table of the safety agent's verdicts for the 20 agreed cases.

Run from this folder:  python demo.py
No server or database needed.
"""

from test_safety import CASES
import validator


def main():
    print(f"{'#':>3}  {'Expected':<12} {'Got':<12} {'Result':<6}  Reason")
    print("-" * 100)
    passed = 0
    for case_id, proposal, expected, _ in CASES:
        result = validator.validate(proposal)
        ok = result.verdict == expected
        passed += ok
        mark = "PASS" if ok else "FAIL"
        print(f"{case_id:>3}  {expected:<12} {result.verdict:<12} {mark:<6}  {result.reason[:60]}")
    print("-" * 100)
    print(f"{passed}/{len(CASES)} cases match the expected verdict")


if __name__ == "__main__":
    main()
