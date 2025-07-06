from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
import uuid
import datetime


class ContextItem(BaseModel):
    id: uuid.UUID
    basket_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    type: str
    content: str
    status: str
    created_at: datetime.datetime


class ContextItemCreate(BaseModel):
    document_id: Optional[uuid.UUID] = None
    type: str = Field(example="guideline")
    content: str = Field(..., min_length=3)


class ContextItemUpdate(BaseModel):
    content: Optional[str]
    status: Optional[str]
