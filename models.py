from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class WeatherTimeRequest(BaseModel):
    query: str

class WeatherTimeResponse(BaseModel):
    original_query: str
    response: str
    status: str

# Modelos para o endpoint /run_sse
class MessagePart(BaseModel):
    text: str

class NewMessage(BaseModel):
    role: str
    parts: List[MessagePart]

class RunSSERequest(BaseModel):
    appName: str
    userId: str
    sessionId: str
    newMessage: NewMessage
    streaming: bool
    stateDelta: Optional[Dict[str, Any]] = None
    locale: Optional[str] = None

class ContentPart(BaseModel):
    text: str

class Content(BaseModel):
    parts: List[ContentPart]
    role: str

class TokensDetails(BaseModel):
    modality: str
    tokenCount: int

class UsageMetadata(BaseModel):
    candidatesTokenCount: int
    candidatesTokensDetails: List[TokensDetails]
    promptTokenCount: int
    promptTokensDetails: List[TokensDetails]
    totalTokenCount: int

class Actions(BaseModel):
    stateDelta: Dict[str, Any]
    artifactDelta: Dict[str, Any]
    requestedAuthConfigs: Dict[str, Any]

class RunSSEResponse(BaseModel):
    content: Content
    usageMetadata: UsageMetadata
    invocationId: str
    author: str
    actions: Actions
    id: str
    timestamp: float