from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.app.utils.supabase_client import supabase_client as supabase
from src.utils.db import json_safe

router = APIRouter()


class BasketInputIn(BaseModel):
    basket_id: str
    content: str


class BasketInputOut(BaseModel):
    input_id: str
    success: bool = True


class ContextBlockIn(BaseModel):
    basket_id: str
    content: str
    optional_tags: list[str] = []


class ContextBlockOut(BaseModel):
    block_id: str
    success: bool = True


# TODO(phase2): Currently unused. Remove or connect if frontend adopts this route.
@router.post("/basket-inputs", response_model=BasketInputOut)
async def create_basket_input(input: BasketInputIn):
    input_id = str(uuid4())
    try:
        supabase.table("basket_inputs").insert(
            json_safe({"id": input_id, "basket_id": input.basket_id, "content": input.content})
        ).execute()
        return {"input_id": input_id}
    except Exception as e:  # noqa: B904
        raise HTTPException(status_code=500, detail=f"Insertion failed: {e}") from e


# TODO(phase2): Currently unused. Remove or connect if frontend adopts this route.
@router.post("/context-blocks", response_model=ContextBlockOut)
async def promote_context_block(block: ContextBlockIn):
    block_id = str(uuid4())
    try:
        supabase.table("context_blocks").insert(
            json_safe(
                {
                    "id": block_id,
                    "basket_id": block.basket_id,
                    "label": block.content,
                    "content": block.content,
                    "meta_tags": block.optional_tags,
                }
            )
        ).execute()
        return {"block_id": block_id}
    except Exception as e:  # noqa: B904
        raise HTTPException(status_code=500, detail=f"Insertion failed: {e}") from e


# TODO(phase2): Currently unused. Remove or connect if frontend adopts this route.
@router.get("/basket-inputs/{input_id}/highlight-suggestions")
async def get_highlight_suggestions(input_id: str):
    # Dummy placeholder, to be replaced with logic if highlight implemented
    return {"suggestions": []}
