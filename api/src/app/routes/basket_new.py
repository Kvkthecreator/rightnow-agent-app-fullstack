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
from ..services.template_cloner import clone_template

router = APIRouter(prefix="/baskets", tags=["baskets"])
log = logging.getLogger("uvicorn.error")

# ────────────────────────────────────────────────────────────────
# 1. Request model
# ----------------------------------------------------------------
class BasketCreateV1(BaseModel):
    """Payload for creating a basket."""

    text_dump: str | None = Field(default=None, min_length=1)
    file_urls: list[str] = Field(default_factory=list)
    template_slug: str | None = None

# ────────────────────────────────────────────────────────────────
# 2. Endpoint
# ----------------------------------------------------------------
@router.post("/new", status_code=201)
async def create_basket(
    payload: BasketCreateV1,
    user: Annotated[dict, Depends(verify_jwt)],
):
    """Create a basket from an atomic text dump or template."""

    workspace_id = get_or_create_workspace(user["user_id"])
    log.info("create_basket user=%s workspace=%s", user["user_id"], workspace_id)

    if payload.template_slug:
        basket_id = clone_template(
            payload.template_slug,
            user["user_id"],
            workspace_id,
            supabase,
        )
        return JSONResponse({"id": basket_id}, status_code=201)

    if not payload.text_dump or not payload.text_dump.strip():
        raise HTTPException(status_code=400, detail="text_dump is empty")

    # Atomic creation via stored procedure
    try:
        rpc_resp = (
            supabase.rpc(
                "create_basket_with_dump",
                {
                    "user_id": user["user_id"],
                    "workspace_id": workspace_id,
                    "dump_body": payload.text_dump,
                    "file_urls": payload.file_urls,
                },
            ).execute()
        )
        if getattr(rpc_resp, "status_code", 200) >= 400 or getattr(rpc_resp, "error", None):
            detail = getattr(rpc_resp, "error", rpc_resp)
            raise HTTPException(status_code=500, detail=str(detail))
        basket_id = rpc_resp.data[0]["basket_id"]
        log.info("created basket %s", basket_id)
    except Exception as err:
        log.exception("create_basket rpc failed")
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
