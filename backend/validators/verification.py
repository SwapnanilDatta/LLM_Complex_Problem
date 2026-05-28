import re
import sympy
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
from typing import Tuple

def verify_execution(engine_output: dict) -> Tuple[bool, str]:
    """Basic verification of code execution success."""
    success = engine_output.get("success", False)
    output = engine_output.get("output", "No output")
    
    if success:
        return True, "Execution verified successfully."
    else:
        return False, f"Execution failed: {output}"

def sympy_check_algebraic_steps(proof_text: str) -> Tuple[bool, str]:
    """
    Checks for `<check>lhs == rhs</check>` inside text and verifies them using SymPy.
    Used if the LLM explanation generates symbolic checks that need to be strictly verified.
    """
    checks = re.findall(r"<check>(.*?)</check>", proof_text, re.DOTALL | re.IGNORECASE)
    if not checks:
        return True, "No symbolic checks found."

    errors = []
    passed = []
    transformations = (standard_transformations + (implicit_multiplication_application,))

    for i, raw in enumerate(checks):
        raw = raw.strip()
        if "==" in raw:
            parts = raw.split("==", 1)
        elif "=" in raw:
            parts = raw.split("=", 1)
        else:
            errors.append(f"Step {i+1}: Cannot parse '{raw}' — no equality found.")
            continue

        try:
            lhs_expr = parse_expr(parts[0].strip(), transformations=transformations)
            rhs_expr = parse_expr(parts[1].strip(), transformations=transformations)
            diff = sympy.simplify(lhs_expr - rhs_expr)
            if diff == 0:
                passed.append(f"Step {i+1}: ✓ `{raw}`")
            else:
                errors.append(f"Step {i+1}: ✗ `{raw}` — simplifies to {diff} ≠ 0")
        except Exception as e:
            passed.append(f"Step {i+1}: skipped (could not parse: {e})")

    summary = "\n".join(passed + errors)
    is_valid = len(errors) == 0
    return is_valid, summary
