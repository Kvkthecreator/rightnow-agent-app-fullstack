# ruff: noqa
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase import Client, create_client

from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class BlockCreateRequest(BaseModel):
    basket_id: str
    semantic_type: str
    label: str
    content: str
    meta_tags: list[str] = []
    state: str = "PROPOSED"

@router.post("/context-blocks/create")
async def create_context_block(req: BlockCreateRequest, user: dict = Depends(verify_jwt)):
    try:
        workspace_id = get_or_create_workspace(user["user_id"])  # ✅ this was missing
        result = supabase.rpc('fn_block_create', {
            "p_basket_id": req.basket_id,
            "p_workspace_id": workspace_id,
            "p_title": req.label,
            "p_body_md": req.content,
        }).execute()
        block_id = result.data
        if not block_id:
            raise HTTPException(status_code=500, detail="Block creation failed")
        return {"status": "success", "block_id": block_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
