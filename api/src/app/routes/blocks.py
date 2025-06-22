import logging

from fastapi import APIRouter, Depends, HTTPException

from ..utils.supabase_client import supabase_client as supabase
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter(tags=["blocks"])

logger = logging.getLogger("uvicorn.error")


@router.get("/baskets/{basket_id}/blocks")
def list_blocks(basket_id: str, user: dict = Depends(verify_jwt)):
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        resp = (
            supabase.table("blocks")
            .select("id,type,content,order,meta_tags,origin,state")
            .eq("basket_id", basket_id)
            .eq("workspace_id", workspace_id)
            .order("order")
            .execute()
        )
        return resp.data  # type: ignore[attr-defined]
    except Exception as err:
        logger.exception("list_blocks failed")
        raise HTTPException(status_code=500, detail="internal error") from err
