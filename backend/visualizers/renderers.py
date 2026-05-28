import re
import json
from typing import Optional, Dict, Any

def extract_plot_data(text: str) -> Optional[Dict[str, Any]]:
    """Extracts JSON plot data from a <plot> tag."""
    m = re.search(r"<plot>(.*?)</plot>", text, re.DOTALL | re.IGNORECASE)
    if m:
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
            return {"type": "scatter", "points": data}
        except Exception:
            return None
    return None

def extract_automata_graph(text: str) -> Optional[str]:
    """Extracts Mermaid graph definition from <mermaid> tag."""
    m = re.search(r"<mermaid>(.*?)</mermaid>", text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return None
