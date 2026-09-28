from typing import Any, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    resident_id: int = Field(gt=0)
    token: Optional[str] = None
    local_time: Optional[str] = None


class AgentAction(BaseModel):
    type: str
    invoice_id: Optional[int] = None
    payment_id: Optional[int] = None
    label: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    action: Optional[AgentAction] = None
    data: Optional[Any] = None