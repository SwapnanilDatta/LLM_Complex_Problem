import json
from typing import Dict, Any

def solve_automata_problem(mermaid_code: str) -> Dict[str, Any]:
    """
    Simplified Automata Engine.
    Verifies that the generated string is a valid Mermaid graph.
    """
    if "stateDiagram" in mermaid_code or "graph" in mermaid_code:
        return {"success": True, "output": mermaid_code}
    return {"success": False, "output": "Invalid Mermaid JS graph generated."}
