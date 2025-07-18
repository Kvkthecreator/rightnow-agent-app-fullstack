from pydantic import BaseModel, Field
from typing import List

class BasketCreateRequest(BaseModel):
    text_dump: str = Field(default="")  # Allow empty canvas on creation
    file_urls: List[str] = Field(default_factory=list)
