"""
/api/baskets/{basket_id}/blocks  –  list live blocks for a basket
"""

from fastapi import APIRouter

from app.utils.supabase_client import supabase

router = APIRouter(prefix="/api", tags=["blocks"])


@router.get("/baskets/{basket_id}/blocks")
def list_blocks(basket_id: str):
    resp = (
        supabase.table("context_blocks")
        .select("id,label,type,updated_at,commit_id")
        .eq("basket_id", basket_id)
        .eq("is_draft", False)
        .eq("is_superseded", False)
        .order("updated_at", desc=True)
        .execute()
    )
    return resp.data  # type: ignore[attr-defined]

