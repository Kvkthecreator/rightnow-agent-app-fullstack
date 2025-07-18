from pydantic import BaseModel, Field
from typing import List, Optional

class BasketCreateRequest(BaseModel):
    text_dump: str = Field(default="")  # Allow empty canvas
    file_urls: List[str] = Field(default_factory=list)
    template_slug: Optional[str] = None  # ✅ Now valid
