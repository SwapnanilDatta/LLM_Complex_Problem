import asyncio
import sys
from io import StringIO
from typing import Tuple, Dict, Any

import matplotlib
matplotlib.use('Agg')

def _execute_code_sandboxed(code: str) -> Tuple[bool, str]:
    """Execute sympy/math code in a restricted environment."""
    old_stdout = sys.stdout
    sys.stdout = mystdout = StringIO()
    
    preamble = """
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

def _custom_show():
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    print(f'\\n![Generated Plot](data:image/png;base64,{img_str})\\n')
    plt.clf()

plt.show = _custom_show
"""
    
    full_code = preamble + code
    
    try:
        # A basic sandbox for MVP
        restricted_globals = {"__builtins__": __builtins__}
        exec(full_code, restricted_globals)
        output = mystdout.getvalue()
        return True, output.strip()
    except Exception as e:
        output = mystdout.getvalue()
        return False, f"{output}\nError: {str(e)}".strip()
    finally:
        sys.stdout = old_stdout

async def solve_math_problem(code_snippet: str) -> Dict[str, Any]:
    """Runs the provided Python code using asyncio."""
    loop = asyncio.get_event_loop()
    try:
        success, output = await asyncio.wait_for(
            loop.run_in_executor(None, _execute_code_sandboxed, code_snippet),
            timeout=15.0
        )
        return {"success": success, "output": output}
    except asyncio.TimeoutError:
        return {"success": False, "output": "Error: Execution timed out after 15 seconds."}
