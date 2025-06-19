import logging

from fastapi import APIRouter, HTTPException

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(tags=["change-queue"])

logger = logging.getLogger("uvicorn.error")


@router.get("/baskets/{basket_id}/change-queue")
def pending_change_count(basket_id: str, status: str | None = None) -> dict:
    """Return count of block changes for a basket filtered by status."""
    try:
        blocks_resp = (
            supabase.table("blocks")
            .select("id")
            .eq("basket_id", basket_id)
            .execute()
        )
        block_ids = [b["id"] for b in (blocks_resp.data or [])]
        if not block_ids:
            return {"count": 0}
        query = (
            supabase.table("block_change_queue")
            .select("id", count="exact")
            .in_("block_id", block_ids)
        )
        if status:
            query = query.eq("status", status)
        resp = query.execute()
        return {"count": resp.count or 0}
    except Exception as err:
        logger.exception("pending_change_count failed")
        raise HTTPException(status_code=500, detail="internal error") from err
