from typing import Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)
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