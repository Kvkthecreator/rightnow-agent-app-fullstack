#api/src/app/agent_tasks/layer2_tasks/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ComposeRequest(BaseModel):
    user_id: str
    user_intent: str
    sub_instructions: Optional[str] = ""
    file_urls: List[str] = Field(default_factory=list)
    block_ids: List[str] = Field(default_factory=list)   # optional manual override

class BriefBlockRef(BaseModel):
    id: str
    label: str
    type: str
    importance: str = "medium"

class TaskBriefDraft(BaseModel):
    brief_id: str
    user_id: str
    user_intent: str
    sub_instructions: str
    file_urls: List[str]
    block_ids: List[str]
    outline: str
    created_at: datetime

class TaskBriefEdited(TaskBriefDraft):
    edits_log: List[str] = Field(default_factory=list)

class TaskBriefValidation(BaseModel):
    brief_id: str
    ok: bool
    errors: List[str] = []
    checked_at: datetime
