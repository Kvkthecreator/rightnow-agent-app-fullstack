from pydantic import BaseModel, Field
from typing import List, Optional

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
