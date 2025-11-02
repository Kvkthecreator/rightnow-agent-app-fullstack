# ruff: noqa
import logging

from fastapi import APIRouter, Depends, HTTPException

from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
from ..utils.workspace import get_or_create_workspace

router = APIRouter(tags=["blocks"])

logger = logging.getLogger("uvicorn.error")

# Canon v2.2 Compliance Note:
# This module now only provides READ-ONLY block operations.
# All block mutations (create/update/delete) must flow through the Universal Work
# Orchestration system (/api/work) in the Next.js backend to ensure governance compliance.


@router.get("/baskets/{basket_id}/blocks")
def list_blocks(basket_id: str, user: dict = Depends(verify_jwt)):
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        # Canon: use canonical fields only
        resp = (
            supabase.table("blocks")
            .select("id,title,content,semantic_type,confidence_score,state,created_at,updated_at")
            .eq("basket_id", basket_id)
            .eq("workspace_id", workspace_id)
            .order("created_at", desc=True)  # Canon: order by creation time
            .execute()
        )
        return resp.data  # type: ignore[attr-defined]
    except Exception as err:
        logger.exception("list_blocks failed")
        raise HTTPException(status_code=500, detail="internal error") from err



# REMOVED: PUT /blocks/{block_id} and DELETE /blocks/{block_id} endpoints
# 
# These endpoints bypassed Universal Work Orchestration governance and violated Canon v2.2.
# All block mutations must now flow through the Next.js /api/work endpoint to ensure
# proper governance evaluation, user-controlled execution modes, and confidence-informed routing.
#
# Migration path for clients:
# - Block updates: Use /api/work with work_type='MANUAL_EDIT'
# - Block deletions: Use /api/work with work_type='MANUAL_EDIT'  
# - Read operations: Continue using GET /api/baskets/{basket_id}/blocks (unchanged)