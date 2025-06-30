# api/src/app/routes/context_blocks_create.py

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from supabase import create_client, Client
from uuid import uuid4
import os

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
async def create_context_block(req: BlockCreateRequest):
    try:
        block_id = str(uuid4())
        data = {
            "id": block_id,
            "basket_id": req.basket_id,
            "semantic_type": req.semantic_type,
            "label": req.label,
            "content": req.content,
            "meta_tags": req.meta_tags,
            "state": req.state,
        }
        result = supabase.table("blocks").insert(data).execute()
        if result.status_code >= 400:
            raise HTTPException(status_code=500, detail=result.json().get("message"))
        return {"status": "success", "block_id": block_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
