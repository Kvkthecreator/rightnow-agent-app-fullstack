import json
import sys
import os

# CRITICAL: Add src to path BEFORE any other imports that depend on it
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from fastapi import APIRouter, HTTPException, Depends
from contracts.basket import BasketChangeRequest, BasketDelta
from services.idempotency import (
    already_processed,
    mark_processed,
    fetch_delta_by_request_id,
)
from services.manager import run_manager_plan
from services.deltas import persist_delta, list_deltas, try_apply_delta
from repositories.delta_repository import DeltaRepository
from repositories.event_repository import EventRepository

# Import deps AFTER path setup
from ..deps import get_db

router = APIRouter(prefix="/api/baskets", tags=["baskets"])

@router.post("/{basket_id}/work", response_model=BasketDelta)
async def post_basket_work(basket_id: str, req: BasketChangeRequest, db=Depends(get_db)):
    """Process basket work request"""
    if req.basket_id != basket_id:
        raise HTTPException(400, "basket_id mismatch")
    
    # Check idempotency
    if await already_processed(db, req.request_id):
        cached_delta = await fetch_delta_by_request_id(db, req.request_id)
        if not cached_delta:
            raise HTTPException(409, "Duplicate request but missing delta")
        return BasketDelta(**json.loads(cached_delta["payload"]))
    
    # Run manager plan - now returns BasketDelta directly
    delta = await run_manager_plan(db, req)
    
    # Persist with event publishing
    await persist_delta(db, delta, req.request_id)
    await mark_processed(db, req.request_id, delta.delta_id)
    
    return delta

@router.get("/{basket_id}/deltas")
async def get_basket_deltas(basket_id: str, db=Depends(get_db)):
    """Get all deltas for a basket"""
    return await list_deltas(db, basket_id)

@router.post("/{basket_id}/apply/{delta_id}")
async def apply_basket_delta(basket_id: str, delta_id: str, db=Depends(get_db)):
    """Apply a specific delta"""
    success = await try_apply_delta(db, basket_id, delta_id)
    if not success:
        raise HTTPException(409, "Version conflict or delta not found")
    
    return {"status": "applied", "basket_id": basket_id, "delta_id": delta_id}
