from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel

class Block(BaseModel):
    id: Optional[UUID] = None
    basket_id: Optional[UUID] = None
    parent_block_id: Optional[UUID] = None
    semantic_type: Optional[str] = None
    content: Optional[str] = None
    version: Optional[int] = None
    state: Optional[str] = None
    scope: Optional[str] = None
    canonical_value: Optional[str] = None
    origin_ref: Optional[UUID] = None
    created_at: Optional[datetime] = None
