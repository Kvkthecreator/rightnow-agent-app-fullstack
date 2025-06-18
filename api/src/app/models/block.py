from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel

class Block(BaseModel):
    id: UUID
    basket_id: Optional[UUID] = None
    parent_block_id: Optional[UUID] = None
    semantic_type: str
    content: Optional[str] = None
    version: int
    state: str
    scope: Optional[str] = None
    canonical_value: Optional[str] = None
    origin_ref: Optional[UUID] = None
    created_at: datetime
