import logging
from fastapi import APIRouter, HTTPException

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/api", tags=["blocks"])

logger = logging.getLogger("uvicorn.error")


@router.get("/baskets/{basket_id}/blocks")
def list_blocks(basket_id: str):
    try:
        resp = (
            supabase.table("context_blocks")
            .select("id,label,type,created_at as updated_at,commit_id")
            .eq("basket_id", basket_id)
            .eq("is_draft", False)
            .eq("is_superseded", False)
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data  # type: ignore[attr-defined]
    except Exception:
        logger.exception("list_blocks failed")
        raise HTTPException(status_code=500, detail="internal error")
