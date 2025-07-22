"""Create baskets in alignment with the Yarnnn V1 canonical flow."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse


from ..event_bus import emit
from ..baskets.schemas import BasketCreateRequest
from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
from ..utils.workspace import get_or_create_workspace
from ..services.template_cloner import clone_template

router = APIRouter(prefix="/baskets", tags=["baskets"])
log = logging.getLogger("uvicorn.error")

# ────────────────────────────────────────────────────────────────
# 1. Request model
# ----------------------------------------------------------------

# ────────────────────────────────────────────────────────────────
# 2. Endpoint
# ----------------------------------------------------------------
@router.post("/new", status_code=201)
async def create_basket(
    payload: BasketCreateRequest,
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

    basket_id: str | None = None

    if payload.text_dump:
        # Legacy flow: create basket + raw dump via stored procedure
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
            log.info("created basket %s via RPC", basket_id)
        except Exception as err:  # pragma: no cover - network
            log.exception("create_basket rpc failed")
            raise HTTPException(status_code=500, detail="internal error") from err

        # Update metadata after RPC creation
        try:
            supabase.table("baskets").update(
                {
                    "name": payload.name,
                    "status": payload.status,
                    "tags": payload.tags,
                }
            ).eq("id", basket_id).execute()
        except Exception:  # pragma: no cover - network
            log.exception("post-RPC basket update failed")

        # Emit compose request event
        try:
            await emit(
                "basket.compose_request",
                {
                    "basket_id": basket_id,
                    "details": payload.text_dump,
                    "file_urls": payload.file_urls,
                },
            )
        except Exception as e:  # noqa: BLE001
            log.error(
                "[EVENT BUS] Failed to emit 'basket.compose_request': %s", e,
            )
    else:
        # Simplest flow: just insert a basket row
        try:
            resp = (
                supabase.table("baskets")
                .insert(
                    {
                        "workspace_id": workspace_id,
                        "user_id": user["user_id"],
                        "name": payload.name,
                        "status": payload.status,
                        "tags": payload.tags,
                    }
                )
                .execute()
            )
            if getattr(resp, "status_code", 200) >= 400 or getattr(resp, "error", None):
                detail = getattr(resp, "error", resp)
                raise HTTPException(status_code=500, detail=str(detail))
            basket_id = resp.data[0]["id"]
            log.info("created empty basket %s", basket_id)
        except Exception as err:  # pragma: no cover - network
            log.exception("simple basket insert failed")
            raise HTTPException(status_code=500, detail="internal error") from err

    return JSONResponse({"id": basket_id}, status_code=201)
