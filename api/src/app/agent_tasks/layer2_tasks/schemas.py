#api/src/app/agent_tasks/layer2_tasks/schemas.py

from datetime import datetime
from typing import List, Optional

from pydantic import Field
from schemas.base import BaseSchema


class ComposeRequest(BaseSchema):
    user_id: str
    user_intent: str
    sub_instructions: Optional[str] = ""
    file_urls: List[str] = Field(default_factory=list)
    compilation_mode: Optional[str] = None

class BriefBlockRef(BaseSchema):
    id: str
    label: str
    type: str
    importance: str = "medium"

class TaskBriefDraft(BaseSchema):
    brief_id: str
    user_id: str
    user_intent: str
    sub_instructions: str
    file_urls: List[str]
    block_ids: List[str]
    compilation_mode: Optional[str] = None
    core_context_snapshot: Optional[dict] = None
    outline: str
    created_at: datetime

class TaskBriefEdited(TaskBriefDraft):
    edits_log: List[str] = Field(default_factory=list)

class TaskBriefValidation(BaseSchema):
    brief_id: str
    ok: bool
    errors: List[str] = []
    checked_at: datetime
