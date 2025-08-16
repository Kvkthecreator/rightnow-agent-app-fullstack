from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

# Work Mode Types
WorkMode = Literal["init_build", "evolve_turn"]

class SourceRawDump(BaseModel):
    type: Literal["raw_dump"]
    id: str

class SourceText(BaseModel):
    type: Literal["text"]
    text: str

Source = Union[SourceRawDump, SourceText]

class WorkPolicy(BaseModel):
    allow_structural_changes: bool = True
    preserve_blocks: list[str] = []
    update_document_ids: list[str] = []
    strict_link_provenance: bool = True

class WorkOptions(BaseModel):
    fast: bool = False
    max_tokens: int = 8000
    trace_req_id: Optional[str] = None

class BasketWorkRequest(BaseModel):
    mode: WorkMode
    sources: list[Source] = Field(default_factory=list)
    policy: WorkPolicy = WorkPolicy()
    options: WorkOptions = WorkOptions()

class CreateBasketReq(BaseModel):
    """DTO matching the CreateBasketReq contract."""

    workspace_id: str
    idempotency_key: str
    name: Optional[str] = "Untitled Basket"
