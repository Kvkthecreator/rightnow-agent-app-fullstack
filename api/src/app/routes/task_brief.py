"""
API routes for TaskBrief CRUD operations.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

from ..agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase


router = APIRouter(prefix="/task-brief", tags=["task-brief"])

class MediaItem(BaseModel):
    image_url: str
    description: str

class ProfileCoreData(BaseModel):
    display_name: Optional[str]
    brand_or_company: Optional[str]
    sns_links: Optional[Dict[str, str]]
    tone_preferences: Optional[str]
    logo_url: Optional[str]
    locale: Optional[str]

class TaskBrief(BaseModel):
    id: Optional[str]
    user_id: str
    intent: str
    sub_instructions: Optional[str]
    media: Optional[List[MediaItem]]
    core_profile_data: Optional[ProfileCoreData]
    created_at: Optional[datetime]

@router.post("/", response_model=TaskBrief, status_code=201)
async def create_task_brief(task_brief: TaskBrief):
    """Create a new TaskBrief entry in Supabase and return it."""
    supabase = get_supabase()
    payload = task_brief.model_dump(exclude_unset=True, exclude={"id", "created_at"})
    resp = supabase.table("task_briefs").insert(payload).execute()
    if resp.error or not resp.data:
        detail = resp.error.message if resp.error else "Failed to insert task_brief"
        raise HTTPException(status_code=500, detail=detail)
    return resp.data[0]

@router.get("/{brief_id}", response_model=TaskBrief)
async def get_task_brief(brief_id: str):
    """Fetch a TaskBrief by ID."""
    supabase = get_supabase()
    resp = supabase.table("task_briefs").select("*").eq("id", brief_id).single().execute()
    if resp.error or not resp.data:
        raise HTTPException(status_code=404, detail="TaskBrief not found")
    return resp.data