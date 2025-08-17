"""Create baskets following the v1 interface spec."""

from __future__ import annotations

import json
import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/baskets", tags=["baskets"])
log = logging.getLogger("uvicorn.error")


@router.post("/new", status_code=201)
async def create_basket(
    payload: dict, user: Annotated[dict, Depends(verify_jwt)]
):
    """Create a basket with idempotency and workspace membership checks."""

    start = time.time()

    workspace_id = get_or_create_workspace(user["user_id"])

    idempotency_key = payload.get("idempotency_key")

    # ---- AUTO NAME (lightweight) ----
    intent = (payload.get("intent") or "").strip()
    basket_name = " ".join(intent.split()[:6]) if intent else "Untitled Basket"
    # ---------------------------------

    # Check for replay using idempotency key
    existing = (
        supabase.table("baskets")
        .select("id")
        .eq("user_id", user["user_id"])
        .eq("idempotency_key", idempotency_key)
        .execute()
    )
    if existing.data:
        basket_id = existing.data[0]["id"]
        log.info(
            json.dumps(
                {
                    "route": "/api/baskets/new",
                    "user_id": user["user_id"],
                    "idempotency_key": idempotency_key,
                    "action": "replayed",
                    "basket_id": basket_id,
                    "duration_ms": int((time.time() - start) * 1000),
                }
            )
        )
        return JSONResponse({"id": basket_id}, status_code=200)

    # Insert new basket
    row = {
        "workspace_id": workspace_id,
        "user_id": user["user_id"],
        "name": basket_name,
        "intent": intent,
        "idempotency_key": idempotency_key,
        "status": "INIT",
    }
    resp = supabase.table("baskets").insert(row).select("id").execute()

    if getattr(resp, "error", None):
        err = resp.error
        if getattr(err, "code", "") == "23505":
            log.info(
                json.dumps(
                    {
                        "route": "/api/baskets/new",
                        "user_id": user["user_id"],
                        "idempotency_key": idempotency_key,
                        "action": "conflict",
                        "duration_ms": int((time.time() - start) * 1000),
                    }
                )
            )
            raise HTTPException(status_code=409, detail="IDEMPOTENCY_CONFLICT")
        log.exception("basket insert failed: %s", err)
        raise HTTPException(status_code=500, detail="INTERNAL_ERROR")

    basket_id = resp.data[0]["id"]
    log.info(
        json.dumps(
            {
                "route": "/api/baskets/new",
                "user_id": user["user_id"],
                "idempotency_key": idempotency_key,
                "action": "created",
                "basket_id": basket_id,
                "duration_ms": int((time.time() - start) * 1000),
            }
        )
    )
    return JSONResponse({"id": basket_id, "name": basket_name}, status_code=201)

