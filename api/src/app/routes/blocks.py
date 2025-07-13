import logging

from fastapi import APIRouter, Depends, HTTPException, Body

from ..utils.supabase_client import supabase_client as supabase
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace
from ..utils.errors import raise_on_supabase_error

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


@router.put("/blocks/{block_id}")
def update_block(
    block_id: str,
    body: dict = Body(...),
    user: dict = Depends(verify_jwt),
):
    """Update a block if it belongs to the caller's workspace."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        resp = (
            supabase.table("blocks")
            .update(body)
            .eq("id", block_id)
            .eq("workspace_id", workspace_id)
            .execute()
        )
        raise_on_supabase_error(resp)
        data = resp.data[0] if hasattr(resp, "data") else resp.json()[0]
        return data
    except Exception as err:  # pragma: no cover - network failure
        logger.exception("update_block failed")
        raise HTTPException(status_code=500, detail="internal error") from err


@router.delete("/blocks/{block_id}", status_code=204)
def delete_block(block_id: str, user: dict = Depends(verify_jwt)):
    """Delete a block if it belongs to the caller's workspace."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        resp = (
            supabase.table("blocks")
            .delete()
            .eq("id", block_id)
            .eq("workspace_id", workspace_id)
            .execute()
        )
        raise_on_supabase_error(resp)
        return
    except Exception as err:  # pragma: no cover - network failure
        logger.exception("delete_block failed")
        raise HTTPException(status_code=500, detail="internal error") from err
