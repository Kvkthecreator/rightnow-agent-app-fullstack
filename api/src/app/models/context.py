from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid
import datetime


class ContextItemType(str, Enum):
    guideline = "guideline"
    theme = "theme"
    category = "category"
    relationship = "relationship"
    audience = "audience"
    goal = "goal"
    topic = "topic"
    insight = "insight"
    reference = "reference"
    constraint = "constraint"


class ContextItemStatus(str, Enum):
    active = "active"
    archived = "archived"


class ContextItem(BaseModel):
    id: uuid.UUID
    basket_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    block_id: Optional[uuid.UUID] = None
    type: ContextItemType
    content: str
    status: ContextItemStatus
    confidence: Optional[float] = None  # Agent confidence score
    created_by: Optional[str] = None    # User ID or agent ID
    created_by_type: Optional[str] = None  # 'user' or 'agent'
    meta_notes: Optional[str] = None    # Agent reasoning/notes
    created_at: datetime.datetime


class ContextItemCreate(BaseModel):
    document_id: Optional[uuid.UUID] = None
    block_id: Optional[uuid.UUID] = None
    type: ContextItemType = Field(example="guideline")
    content: str = Field(..., min_length=3)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    meta_notes: Optional[str] = None


class ContextItemUpdate(BaseModel):
    content: Optional[str]
    status: Optional[ContextItemStatus]
