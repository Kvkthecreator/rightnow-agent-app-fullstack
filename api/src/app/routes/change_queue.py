from fastapi import APIRouter

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/api", tags=["change-queue"])


@router.get("/baskets/{basket_id}/change-queue")
def pending_change_count(basket_id: str, status: str | None = None) -> dict:
    """Return count of block changes for a basket filtered by status."""
    blocks_resp = (
        supabase.table("context_blocks")
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
