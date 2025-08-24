"""Create raw dumps via RPC with idempotency."""
from __future__ import annotations

import json
import logging
import time
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, model_validator

from ..utils.jwt import verify_jwt
from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/dumps", tags=["dumps"])
log = logging.getLogger("uvicorn.error")


class CreateDumpReq(BaseModel):
    basket_id: str
    dump_request_id: str
    text_dump: str | None = None
    file_url: str | None = None
    meta: dict[str, Any] | None = None

    @model_validator(mode="after")
    def require_content(cls, model):  # type: ignore[override]
        if not model.text_dump and not model.file_url:
            raise ValueError("Either text_dump or file_url must be provided")
        return model


@router.post("/new", status_code=201)
async def create_dump(
    payload: CreateDumpReq, req: Request, user: Annotated[dict, Depends(verify_jwt)]
):
    start = time.time()
    basket = (
        supabase.table("baskets")
        .select("id, workspace_id")
        .eq("id", payload.basket_id)
        .single()
        .execute()
    )
    if not basket.data:
        raise HTTPException(status_code=404, detail="Basket not found")
    workspace_id = basket.data["workspace_id"]

    membership = (
        supabase.table("workspace_memberships")
        .select("workspace_id")
        .eq("workspace_id", workspace_id)
        .eq("user_id", user["user_id"])
        .execute()
    )
    if not membership.data:
        log.info(
            json.dumps(
                {
                    "route": "/api/dumps/new",
                    "user_id": user["user_id"],
                    "basket_id": payload.basket_id,
                    "dump_request_id": payload.dump_request_id,
                    "action": "forbidden",
                }
            )
        )
        raise HTTPException(status_code=403, detail="Workspace access denied")

    dumps = [
        {
            "dump_request_id": payload.dump_request_id,
            "text_dump": payload.text_dump,
            "file_url": payload.file_url,
            "source_meta": payload.meta or {},
            "ingest_trace_id": (payload.meta or {}).get("ingest_trace_id"),
        }
    ]
    resp = supabase.rpc(
        "fn_ingest_dumps",
        {
            "p_workspace_id": workspace_id,
            "p_basket_id": payload.basket_id,
            "p_dumps": dumps,
        },
    ).execute()
    if getattr(resp, "error", None):
        err = resp.error
        if getattr(err, "code", "") == "23505":
            raise HTTPException(status_code=409, detail="IDEMPOTENCY_CONFLICT")
        raise HTTPException(status_code=500, detail="INTERNAL_ERROR")

    if not resp.data:
        raise HTTPException(status_code=500, detail="INGEST_FAILED")

    dump_id = resp.data[0]["dump_id"]
    log.info(
        json.dumps(
            {
                "route": "/api/dumps/new",
                "user_id": user["user_id"],
                "basket_id": payload.basket_id,
                "dump_request_id": payload.dump_request_id,
                "action": "created",
                "dump_id": dump_id,
                "duration_ms": int((time.time() - start) * 1000),
            }
        )
    )
    return JSONResponse({"dump_id": dump_id}, status_code=201)
