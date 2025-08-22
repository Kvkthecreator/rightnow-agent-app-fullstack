# ruff: noqa
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..memory.blocks import BlockLifecycleService, StateTransitionError
from ..utils.errors import raise_on_supabase_error
from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
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


class BlockUpdateRequest(BaseModel):
    content: str | None = None
    semantic_type: str | None = None
    scope: str | None = None
    canonical_value: str | None = None


@router.put("/blocks/{block_id}")
async def update_block(
    block_id: str,
    request: BlockUpdateRequest,
    user: dict = Depends(verify_jwt),
):
    """Update a block with lifecycle enforcement."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])

        # Get current block to check state and permissions
        current_resp = (
            supabase.table("blocks")
            .select("id,state,version,workspace_id,basket_id")
            .eq("id", block_id)
            .eq("workspace_id", workspace_id)
            .maybe_single()
            .execute()
        )

        if not current_resp.data:
            raise HTTPException(404, "Block not found")

        current_block = current_resp.data
        current_state = current_block["state"]

        # Check if content modification is allowed in current state
        if request.content is not None:
            if not BlockLifecycleService.can_modify_content(current_state, "user"):
                raise HTTPException(
                    400,
                    f"Cannot modify content in state '{current_state}'. "
                    f"Block is {'locked' if current_state in {'LOCKED', 'CONSTANT'} else 'finalized'}."
                )

        # Prepare update data (only non-None fields)
        update_data = {}
        if request.content is not None:
            update_data["content"] = request.content
        if request.semantic_type is not None:
            update_data["semantic_type"] = request.semantic_type
        if request.scope is not None:
            update_data["scope"] = request.scope
        if request.canonical_value is not None:
            update_data["canonical_value"] = request.canonical_value

        if not update_data:
            raise HTTPException(400, "No valid fields to update")

        # Increment version for content changes
        if "content" in update_data:
            update_data["version"] = current_block["version"] + 1

            # Create revision record for content changes
            from datetime import datetime
            diff_json = {
                "content": {"to": request.content},
                "timestamp": datetime.utcnow().isoformat(),
            }
            supabase.rpc('fn_block_revision_create', {
                "p_basket_id": current_block["basket_id"],
                "p_block_id": block_id,
                "p_workspace_id": workspace_id,
                "p_summary": "Content updated by user",
                "p_diff_json": diff_json,
            }).execute()

        # Perform the update
        resp = (
            supabase.table("blocks")
            .update(update_data)
            .eq("id", block_id)
            .eq("workspace_id", workspace_id)
            .execute()
        )

        raise_on_supabase_error(resp)
        return resp.data[0] if resp.data else {}

    except HTTPException:
        raise
    except StateTransitionError as e:
        raise HTTPException(400, str(e))
    except Exception as err:
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
