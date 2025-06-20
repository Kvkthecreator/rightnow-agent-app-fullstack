import logging

from fastapi import APIRouter, HTTPException

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(tags=["blocks"])

logger = logging.getLogger("uvicorn.error")


@router.get("/baskets/{basket_id}/blocks")
def list_blocks(basket_id: str):
    try:
        resp = (
            supabase.table("blocks")
            .select("id,type,content,order,meta_tags,origin,state")
            .eq("basket_id", basket_id)
            .order("order")
            .execute()
        )
        return resp.data  # type: ignore[attr-defined]
    except Exception as err:
        logger.exception("list_blocks failed")
        raise HTTPException(status_code=500, detail="internal error") from err
