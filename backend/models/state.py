import operator
from typing import TypedDict, Annotated, Optional, Dict, Any

class PipelineState(TypedDict):
    # Base Input
    query: str
    force_mode: str
    
    # Processed Data
    domain: str  # "maths", "automata", "ml"
    structured_problem: str
    
    # Solver outputs
    solver_output: Any
    
    # Verification
    verified: bool
    verified_output: Any
    verification_feedback: str
    
    # Presentation
    explanation: str
    visualization: Optional[Any]
    
    # Final state
    final_answer: str
    status: str
    attachments: list
    
    # Metadata and LangGraph stream requirements
    history: Annotated[list, operator.add]
