from fastapi import APIRouter, HTTPException, Depends
from ...contracts.basket import BasketChangeRequest, BasketDelta
from ...services.idempotency import (
    already_processed,
    mark_processed,
    fetch_delta_by_request_id,
)
from ...services.manager import run_manager_plan
from ...services.deltas import persist_delta, list_deltas, try_apply_delta
from ...services.events import publish_event
from ...services.clock import now_iso
from ..deps import get_db
import json

router = APIRouter(prefix="/api/baskets", tags=["baskets"])

@router.post("/{basket_id}/work", response_model=BasketDelta)
async def post_basket_work(basket_id: str, req: BasketChangeRequest, db=Depends(get_db)):
    if req.basket_id != basket_id:
        raise HTTPException(400, "basket_id mismatch")
    if await already_processed(db, req.request_id):
        cached = await fetch_delta_by_request_id(db, req.request_id)
        if not cached:
            raise HTTPException(409, "Duplicate request but no cached delta")
        return json.loads(cached["payload"])
    plan = await run_manager_plan(db, req)
    delta = BasketDelta(
        delta_id=plan.delta_id,
        basket_id=basket_id,
        summary=plan.summary,
        changes=plan.changes,
        recommended_actions=plan.recommended_actions,
        explanations=plan.explanations,
        confidence=plan.confidence,
        created_at=now_iso(),
    )
    await persist_delta(db, delta, req.request_id)
    await mark_processed(db, req.request_id, delta.delta_id)
    await publish_event(db, "basket.delta.proposed", {"basket_id": basket_id, "delta_id": delta.delta_id})
    return delta

@router.get("/{basket_id}/deltas")
async def get_basket_deltas(basket_id: str, db=Depends(get_db)):
    return await list_deltas(db, basket_id)

@router.post("/{basket_id}/apply/{delta_id}")
async def apply_basket_delta(basket_id: str, delta_id: str, db=Depends(get_db)):
    ok = await try_apply_delta(db, basket_id, delta_id)
    if not ok:
        raise HTTPException(409, "Version conflict; refresh/rebase required")
    await publish_event(db, "basket.delta.applied", {"basket_id": basket_id, "delta_id": delta_id})
    return {"status": "applied"}
