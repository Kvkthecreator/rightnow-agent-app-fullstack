"""Snapshot route for basket narrative."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..util.snapshot_assembler import assemble_snapshot
from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/baskets", tags=["baskets"])

logger = logging.getLogger("uvicorn.error")


@router.get("/{basket_id}/snapshot")
def get_basket_snapshot(basket_id: str) -> dict:
    """Return read-only snapshot view for a basket."""
    try:
        dumps_resp = (
            supabase.table("raw_dumps")
            .select("id,body_md,created_at")
            .eq("basket_id", basket_id)
            .order("created_at")
            .execute()
        )
        block_resp = (
            supabase.table("blocks")
            .select(
                "id,semantic_type,content,state,scope,canonical_value"
            )
            .eq("basket_id", basket_id)
            .in_("state", ["CONSTANT", "LOCKED", "ACCEPTED"])
            .execute()
        )
    except Exception as err:
        logger.exception("get_basket_snapshot failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    raw_dumps = dumps_resp.data or []
    blocks = block_resp.data or []
    snapshot = assemble_snapshot(raw_dumps, blocks)
    return snapshot
