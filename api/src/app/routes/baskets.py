import json
import os
import sys
from uuid import uuid4

# CRITICAL: Add src to path BEFORE any other imports that depend on it
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from contracts.basket import BasketChangeRequest, BasketDelta
from fastapi import APIRouter, Depends, HTTPException, Request
from ..baskets.schemas import BasketWorkRequest
from typing import Union
from services.deltas import list_deltas, persist_delta, try_apply_delta
from services.idempotency import (
    already_processed,
    fetch_delta_by_request_id,
    mark_processed,
)
from services.manager import run_manager_plan

# Import deps AFTER path setup
from ..deps import get_db
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/api/baskets", tags=["baskets"])


@router.post("/{basket_id}/work", response_model=BasketDelta)
async def post_basket_work(
    basket_id: str,
    request: Request,
    user: dict = Depends(verify_jwt),  # noqa: B008
    db=Depends(get_db),  # noqa: B008
):
    """Process basket work request with mode support"""
    
    # Parse request body to determine format
    body = await request.json()
    
    if "mode" in body:
        # New BasketWorkRequest format
        from ..baskets.schemas import BasketWorkRequest
        work_req = BasketWorkRequest.model_validate(body)
        
        # Create corresponding legacy request for manager
        legacy_req = BasketChangeRequest(
            request_id=f"work_{uuid4().hex[:8]}",
            basket_id=basket_id,
            sources=work_req.sources,
            intent=None,
            agent_hints=None,
            user_context=None
        )
    else:
        # Legacy BasketChangeRequest format
        req = BasketChangeRequest.model_validate(body)
        if req.basket_id != basket_id:
            raise HTTPException(400, "basket_id mismatch")
        work_req = None
        legacy_req = req

    workspace_id = get_or_create_workspace(user["user_id"])
    
    # Forward X-Req-Id if present
    trace_req_id = request.headers.get("X-Req-Id")

    # Check idempotency (use legacy request_id if available)
    request_id = getattr(legacy_req, 'request_id', None) if legacy_req else None
    if request_id and await already_processed(db, request_id):
        cached_delta = await fetch_delta_by_request_id(db, request_id)
        if not cached_delta:
            raise HTTPException(409, "Duplicate request but missing delta")
        return BasketDelta(**json.loads(cached_delta["payload"]))

    # Run manager plan - always use legacy_req for compatibility
    delta = await run_manager_plan(db, legacy_req, workspace_id)

    # Persist with event publishing
    if request_id:
        await persist_delta(db, delta, request_id)
        await mark_processed(db, request_id, delta.delta_id)

    return delta


@router.get("/{basket_id}/deltas")
async def get_basket_deltas(basket_id: str, db=Depends(get_db)):  # noqa: B008
    """Get all deltas for a basket"""
    return await list_deltas(db, basket_id)


@router.post("/{basket_id}/apply/{delta_id}")
async def apply_basket_delta(
    basket_id: str,
    delta_id: str,
    db=Depends(get_db),  # noqa: B008
):
    """Apply a specific delta"""
    success = await try_apply_delta(db, basket_id, delta_id)
    if not success:
        raise HTTPException(409, "Version conflict or delta not found")

    return {"status": "applied", "basket_id": basket_id, "delta_id": delta_id}
