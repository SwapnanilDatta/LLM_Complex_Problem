from typing import Dict, Any
import asyncio
from engines.maths import _execute_code_sandboxed

async def solve_ml_problem(code_snippet: str) -> Dict[str, Any]:
    """
    Runs the restricted sklearn Python code.
    Reuses the sandboxed executor from maths.py for now.
    """
    loop = asyncio.get_event_loop()
    try:
        success, output = await asyncio.wait_for(
            loop.run_in_executor(None, _execute_code_sandboxed, code_snippet),
            timeout=60.0
        )
        return {"success": success, "output": output}
    except asyncio.TimeoutError:
        return {"success": False, "output": "Error: ML Execution timed out after 20 seconds."}
