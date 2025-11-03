from uuid import UUID

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel

# Phase 4/5: Legacy Canon v2.1 removed - stub for backward compatibility
async def get_canonical_queue_health():
    return {"status": "migrated_to_claude_sdk", "queue_health": "n/a"}

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentRunPayload(BaseModel):
    basket_id: UUID


@router.post("/{name}/run")
async def run_agent(name: str, payload: AgentRunPayload):
    res = (
        supabase.table("baskets")
        .select("id")
        .eq("id", str(payload.basket_id))
        .execute()
    )
    if not res.data:  # type: ignore[attr-defined]
        raise HTTPException(status_code=404, detail="basket not found")

    # Legacy agent runner removed - use canonical queue processor
    try:
        if name == "canonical_queue":
            result = await get_canonical_queue_health()
        else:
            raise HTTPException(status_code=404, detail="Agent not found. Use 'canonical_queue' for health check.")
    except APIError as err:
        raise HTTPException(status_code=500, detail=str(err)) from err
    return result
