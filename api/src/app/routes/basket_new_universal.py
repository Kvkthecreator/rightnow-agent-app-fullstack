from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from ..utils.db import json_safe
from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
from ..utils.workspace import get_or_create_workspace

# Agent calls
from ..agent_tasks.run_agent_chain import run_agent_chain

router = APIRouter(prefix="/baskets", tags=["baskets"])
log = logging.getLogger("uvicorn.error")


class RawDump(BaseModel):
    body_md: str = Field(..., min_length=1)


class CoreBlock(BaseModel):
    text: str = Field(..., min_length=100, max_length=500)
    scope: str = Field("basket")
    status: str = Field("locked")


class UniversalPayload(BaseModel):
    template_id: str = Field(..., pattern="^universal$")
    basket_name: str = Field(..., min_length=1)
    core_block: CoreBlock
    raw_dumps: list[RawDump]
    guidelines: str | None = Field(default=None, max_length=1000)

    @field_validator("raw_dumps")
    @classmethod
    def check_raw_dumps(cls, v: list[RawDump]):
        if not 1 <= len(v) <= 10:
            raise ValueError("raw_dumps must be 1-10 items")
        return v


@router.post("/new-universal", status_code=201)
async def create_basket_universal(
    payload: UniversalPayload, user: dict = Depends(verify_jwt)
) -> dict:
    workspace_id = get_or_create_workspace(user["user_id"])
    basket_id = str(uuid.uuid4())

    try:
        supabase.table("baskets").insert(
            json_safe(
                {
                    "id": basket_id,
                    "user_id": user["user_id"],
                    "workspace_id": workspace_id,
                    "name": payload.basket_name,
                }
            )
        ).execute()

        block_id = str(uuid.uuid4())
        supabase.table("blocks").insert(
            json_safe(
                {
                    "id": block_id,
                    "basket_id": basket_id,
                    "workspace_id": workspace_id,
                    "content": payload.core_block.text,
                    "scope": "basket",
                    "status": "locked",
                }
            )
        ).execute()

        first_doc_id = None
        for dump in payload.raw_dumps:
            doc_id = str(uuid.uuid4())
            if first_doc_id is None:
                first_doc_id = doc_id
            supabase.table("documents").insert(
                json_safe(
                    {
                        "id": doc_id,
                        "basket_id": basket_id,
                        "workspace_id": workspace_id,
                        "title": "Untitled",
                        "content_raw": None,
                        "content_rendered": None,
                    }
                )
            ).execute()
            supabase.table("raw_dumps").insert(
                json_safe(
                    {
                        "id": str(uuid.uuid4()),
                        "basket_id": basket_id,
                        "workspace_id": workspace_id,
                        "body_md": dump.body_md,
                        "document_id": doc_id,
                    }
                )
            ).execute()

        if payload.guidelines and payload.guidelines.strip():
            supabase.table("context_items").insert(
                json_safe(
                    {
                        "id": str(uuid.uuid4()),
                        "basket_id": basket_id,
                        "workspace_id": workspace_id,
                        "type": "guideline",
                        "content": payload.guidelines,
                        "status": "active",
                    }
                )
            ).execute()
    except Exception as err:
        log.exception("create_basket_universal failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    # ── agent chain ──────────────────────────────────────────────
    try:
        await run_agent_chain(basket_id)
    except Exception:
        log.exception("agent invocation failed")

    return {"basket_id": basket_id, "first_doc_id": first_doc_id}
