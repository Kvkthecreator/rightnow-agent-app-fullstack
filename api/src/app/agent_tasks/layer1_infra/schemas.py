# api/src/app/agent_tasks/layer1_infra/schemas.py

from pydantic import BaseModel
from typing import List
from datetime import datetime

class DuplicateLabel(BaseModel):
    label: str
    block_ids: List[str]

class AuditReport(BaseModel):
    ok: bool
    duplicate_labels: List[DuplicateLabel]
    generated_at: str  # ISO ts

class UsageReport(BaseModel):
    stale_ids: List[str]
    unused_ids: List[str]
    generated_at: datetime