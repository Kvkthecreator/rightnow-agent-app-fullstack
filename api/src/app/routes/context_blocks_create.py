from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from supabase import create_client, Client
from uuid import uuid4
import os

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
        block_id = str(uuid4())
        data = {
            "id": block_id,
            "basket_id": req.basket_id,
            "semantic_type": req.semantic_type,
            "label": req.label,
            "content": req.content,
            "meta_tags": req.meta_tags,
            "state": req.state,
            "workspace_id": workspace_id,  # ✅ this was missing
        }
        result = supabase.table("blocks").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Block creation failed")
        return {"status": "success", "block_id": block_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
