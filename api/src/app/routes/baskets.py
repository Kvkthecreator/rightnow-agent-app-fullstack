"""API routes for Basket management."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import uuid

from ..agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase
from ..supabase_helpers import publish_event

router = APIRouter(prefix="/baskets", tags=["baskets"])

class BasketCreate(BaseModel):
    intent: str
    details: Optional[str] = None
    file_ids: Optional[List[str]] = None

class BasketUpdate(BaseModel):
    input_text: Optional[str] = None
    intent_summary: Optional[str] = None

@router.post("/", status_code=201)
async def create_basket(payload: BasketCreate):
    """Create a new basket and emit compose request."""
    supabase = get_supabase()
    basket_id = str(uuid.uuid4())
    resp = supabase.table("baskets").insert(
        {
            "id": basket_id,
            "intent_summary": payload.intent,
            "details": payload.details,
            "file_ids": payload.file_ids or [],
            "status": "draft",
        }
    ).execute()
    if resp.error:
        raise HTTPException(status_code=500, detail=resp.error.message)
    if payload.details:
        supabase.table("basket_threads").insert(
            {"basket_id": basket_id, "content": payload.details, "source": "user_dump"}
        ).execute()
    await publish_event(
        "basket.compose_request",
        {
            "basket_id": basket_id,
            "intent": payload.intent,
            "details": payload.details,
            "file_ids": payload.file_ids or [],
        },
    )
    return {"id": basket_id}


@router.get("/{basket_id}")
async def get_basket(basket_id: str):
    """Fetch a basket with its blocks and configs."""
    supabase = get_supabase()
    row = supabase.table("baskets").select("*").eq("id", basket_id).single().execute()
    if row.error or not row.data:
        raise HTTPException(status_code=404, detail="Basket not found")
    links = (
        supabase.from_("block_brief_link")
        .select("context_blocks(id,label,type)")
        .eq("task_brief_id", basket_id)
        .execute()
    )
    blocks = [r["context_blocks"] for r in (links.data or [])]
    cfgs = (
        supabase.table("basket_configs").select("*").eq("basket_id", basket_id).execute()
    )
    return {
        "id": basket_id,
        "status": row.data.get("status"),
        "intent_summary": row.data.get("intent_summary"),
        "blocks": blocks,
        "configs": cfgs.data or [],
    }


@router.post("/{basket_id}/work", status_code=202)
async def update_basket(basket_id: str, payload: BasketUpdate):
    """Add new context to an existing basket and trigger composer."""
    supabase = get_supabase()
    if payload.input_text:
        supabase.table("basket_threads").insert(
            {"basket_id": basket_id, "content": payload.input_text, "source": "user_dump"}
        ).execute()
    await publish_event(
        "basket.compose_request",
        {
            "basket_id": basket_id,
            "intent": payload.intent_summary or "",
            "details": payload.input_text,
            "file_ids": [],
        },
    )
    return {"id": basket_id}
