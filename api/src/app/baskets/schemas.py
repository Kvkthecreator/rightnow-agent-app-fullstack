from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Union

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
    preserve_blocks: List[str] = []
    update_document_ids: List[str] = []
    strict_link_provenance: bool = True

class WorkOptions(BaseModel):
    fast: bool = False
    max_tokens: int = 8000
    trace_req_id: Optional[str] = None

class BasketWorkRequest(BaseModel):
    mode: WorkMode
    sources: List[Source] = Field(default_factory=list)
    policy: WorkPolicy = WorkPolicy()
    options: WorkOptions = WorkOptions()

class BasketCreateRequest(BaseModel):
    """Payload for `/api/baskets/new`."""

    # Optional metadata for the basket itself
    name: Optional[str] = "Untitled Basket"
    status: Optional[str] = "active"
    tags: Optional[List[str]] = Field(default_factory=list)

    # Legacy creation fields for bootstrapping from text/file uploads
    text_dump: Optional[str] = None
    file_urls: List[str] = Field(default_factory=list)
    template_slug: Optional[str] = None  # ✅ Now valid
