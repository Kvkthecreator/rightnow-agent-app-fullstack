from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid
import datetime


class ContextItemType(str, Enum):
    guideline = "guideline"


class ContextItemStatus(str, Enum):
    active = "active"
    archived = "archived"


class ContextItem(BaseModel):
    id: uuid.UUID
    basket_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    type: ContextItemType
    content: str
    status: ContextItemStatus
    created_at: datetime.datetime


class ContextItemCreate(BaseModel):
    document_id: Optional[uuid.UUID] = None
    type: ContextItemType = Field(example="guideline")
    content: str = Field(..., min_length=3)


class ContextItemUpdate(BaseModel):
    content: Optional[str]
    status: Optional[ContextItemStatus]
