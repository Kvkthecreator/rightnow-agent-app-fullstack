"""Create baskets in alignment with the Yarnnn V1 canonical flow."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..event_bus import publish_event

from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/baskets", tags=["baskets"])
log = logging.getLogger("uvicorn.error")

# ────────────────────────────────────────────────────────────────
# 1. Request model
# ----------------------------------------------------------------
class BasketCreateV1(BaseModel):
    """Payload for creating a basket from a raw text dump."""

    text_dump: str = Field(..., min_length=1)
    file_urls: list[str] = Field(default_factory=list)

# ────────────────────────────────────────────────────────────────
# 2. Endpoint
# ----------------------------------------------------------------
@router.post("/new", status_code=201)
async def create_basket(
    payload: BasketCreateV1,
    user: Annotated[dict, Depends(verify_jwt)],
):
    """Create a basket from an atomic text dump."""

    if not payload.text_dump.strip():
        raise HTTPException(status_code=400, detail="text_dump is empty")

    workspace_id = get_or_create_workspace(user["user_id"])
    log.info("create_basket user=%s workspace=%s", user["user_id"], workspace_id)

    # Insert raw dump
    try:
        dump_resp = (
            supabase.table("raw_dumps")
            .insert(
                {
                    "body_md": payload.text_dump,
                    "file_refs": payload.file_urls,
                    "workspace_id": workspace_id,
                }
            )
            .execute()
        )
        if getattr(dump_resp, "status_code", 200) >= 400 or getattr(dump_resp, "error", None):
            detail = getattr(dump_resp, "error", dump_resp)
            raise HTTPException(status_code=500, detail=str(detail))
        raw_dump_id = dump_resp.data[0]["id"]
        log.info("created raw_dump %s", raw_dump_id)
    except Exception as err:
        log.exception("create_basket raw_dumps insert failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    # Insert basket
    try:
        basket_resp = (
            supabase.table("baskets")
            .insert(
                {
                    "raw_dump_id": raw_dump_id,
                    "workspace_id": workspace_id,
                    "state": "INIT",
                }
            )
            .execute()
        )
        if getattr(basket_resp, "status_code", 200) >= 400 or getattr(basket_resp, "error", None):
            detail = getattr(basket_resp, "error", basket_resp)
            raise HTTPException(status_code=500, detail=str(detail))
        basket_id = basket_resp.data[0]["id"]
        log.info("created basket %s", basket_id)
    except Exception as err:
        log.exception("create_basket baskets insert failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    # Publish event
    try:
        await publish_event(
            "basket.compose_request",
            {
                "basket_id": basket_id,
                "details": payload.text_dump,
                "file_urls": payload.file_urls,
            },
        )
    except Exception:
        log.exception("compose_request publish failed")

    return JSONResponse({"id": basket_id}, status_code=201)
