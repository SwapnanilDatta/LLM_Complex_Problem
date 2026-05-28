from typing import List, Optional

from pydantic import BaseModel

class Attachment(BaseModel):
    name: str
    type: str
    data: Optional[str] = None
    mime_type: Optional[str] = None

class SolveRequest(BaseModel):
    problem: str
    force_mode: str = "auto"
    attachments: Optional[List[Attachment]] = None
