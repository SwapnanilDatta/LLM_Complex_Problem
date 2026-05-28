from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class StepOutput(BaseModel):
    title: str
    content: str
    is_verified: bool = False

class ResponseMetadata(BaseModel):
    execution_time_ms: int = 0
    engine_used: str

class UniversalResponse(BaseModel):
    domain: str
    steps: List[StepOutput]
    final_answer: str
    verified: bool
    visualization: Optional[Any] = None
    metadata: ResponseMetadata
