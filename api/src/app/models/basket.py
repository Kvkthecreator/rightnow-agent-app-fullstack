from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class Basket(BaseModel):
    id: UUID
    name: Optional[str] = None
    raw_dump_id: Optional[UUID] = None
    state: str
    created_at: datetime
