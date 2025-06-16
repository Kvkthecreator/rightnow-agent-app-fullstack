import logging
from os import getenv

from fastapi import APIRouter, HTTPException

from supabase import create_client

supabase = create_client(
    getenv("NEXT_PUBLIC_SUPABASE_URL"), getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)
router = APIRouter(prefix="/debug", tags=["debug"])

logger = logging.getLogger("uvicorn.error")


@router.get("/{basket_id}")
async def get_trace(basket_id: str):
    try:
        resp = (
            supabase.table("agent_events")
            .select("*")
            .eq("basket_id", basket_id)
            .order("created_at")
            .execute()
        )
        return resp.data
    except Exception:
        logger.exception("get_trace failed")
        raise HTTPException(status_code=500, detail="internal error")

