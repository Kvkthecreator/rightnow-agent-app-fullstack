"""Create-basket endpoint. Supports both the old *text_dump* JSON and the new
structured payload during the transition window."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/baskets", tags=["baskets"])
log = logging.getLogger("uvicorn.error")

# ────────────────────────────────────────────────────────────────
# 1. Dual-schema body models
# ----------------------------------------------------------------
class V1Body(BaseModel):
    text_dump: str = Field(..., min_length=1)
    file_urls: list[str] = Field(default_factory=list)

class BlockSeed(BaseModel):
    semantic_type: str
    label: str | None = None
    content: str
    is_primary: bool | None = None
    meta_scope: str | None = None
    source: str | None = None

class V2Body(BaseModel):
    topic: str | None = None
    intent: str | None = None
    insight: str | None = None
    blocks: list[BlockSeed] = Field(default_factory=list, max_items=25)

# ────────────────────────────────────────────────────────────────
# 2. Endpoint
# ----------------------------------------------------------------
@router.post("/new", status_code=201, response_model=dict)
async def create_basket(
    request: Request,
    user: Annotated[dict, Depends(verify_jwt)],
):
    """
    • If body matches V1 → create basket from *text_dump* (legacy UI).
    • If body matches V2 → create basket + seed blocks (new UI/agents).
    """
    raw_json = await request.json()
    print(raw_json)
    try:
        body_v1 = V1Body.model_validate(raw_json)
        mode = "v1"
    except ValidationError:
        try:
            body_v2 = V2Body.model_validate(raw_json)
            mode = "v2"
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=e.errors()) from e

    if mode == "v1" and not body_v1.text_dump.strip():
        raise HTTPException(status_code=400, detail="text_dump is empty")

    # workspace is the only source of truth for ownership
    workspace_id = get_or_create_workspace(user["user_id"])

    # single transaction so /work can read the snapshot immediately
    try:
        with supabase.transaction() as trx:
            dump_resp = (
                trx.table("raw_dumps")
                .insert(
                    {
                        "body_md": body_v1.text_dump if mode == "v1" else body_v2.topic or "",
                        "file_refs": body_v1.file_urls if mode == "v1" else [],
                        "workspace_id": workspace_id,
                    }
                )
                .execute()
            )
            dump_id = dump_resp.data[0]["id"]

            basket_resp = (
                trx.table("baskets")
                .insert(
                    {
                        "name": body_v2.topic if mode == "v2" else None,
                        "raw_dump_id": dump_id,
                        "state": "INIT",
                        "workspace_id": workspace_id,
                    }
                )
                .execute()
            )
            basket_id = basket_resp.data[0]["id"]

            # seed blocks only for V2
            if mode == "v2" and body_v2.blocks:
                block_rows = [
                    {
                        **blk.model_dump(exclude_none=True),
                        "basket_id": basket_id,
                        "workspace_id": workspace_id,
                        "state": "CONSTANT",
                    }
                    for blk in body_v2.blocks
                ]
                trx.table("blocks").insert(block_rows).execute()

    except Exception as err:  # pragma: no cover
        log.exception("create_basket failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    return JSONResponse({"id": basket_id}, status_code=201)
