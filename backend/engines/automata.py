import json
from typing import Dict, Any

def solve_automata_problem(mermaid_code: str) -> Dict[str, Any]:
    """
    Simplified Automata Engine.
    Verifies that the generated string is a valid Mermaid graph.
    """
    if any(keyword in mermaid_code for keyword in ["stateDiagram", "graph", "flowchart"]):
        return {"success": True, "output": mermaid_code}
    return {"success": False, "output": "Invalid Mermaid JS graph generated."}
