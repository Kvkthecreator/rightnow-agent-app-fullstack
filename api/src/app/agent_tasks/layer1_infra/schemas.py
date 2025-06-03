# api/src/app/agent_tasks/layer1_infra/schemas.py

from pydantic import BaseModel
from typing import List

class DuplicateLabel(BaseModel):
    label: str
    block_ids: List[str]

class AuditReport(BaseModel):
    ok: bool
    duplicate_labels: List[DuplicateLabel]
    generated_at: str  # ISO ts
