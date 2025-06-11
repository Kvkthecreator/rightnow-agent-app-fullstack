from os import getenv

from fastapi import APIRouter

from supabase import create_client

supabase = create_client(getenv("SUPABASE_URL"), getenv("SUPABASE_ANON_KEY"))
router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/{basket_id}")
async def get_trace(basket_id: str):
    resp = (
        supabase.table("agent_events")
        .select("*")
        .eq("basket_id", basket_id)
        .order("created_at")
        .execute()
    )
    return resp.data

