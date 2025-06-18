from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel

class Basket(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    raw_dump_id: Optional[UUID] = None
    state: Optional[str] = None
    created_at: Optional[datetime] = None
