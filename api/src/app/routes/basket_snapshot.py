"""Snapshot route for basket narrative (workspace-aware)."""
from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException

from ..util.snapshot_assembler import assemble_snapshot
from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/baskets", tags=["baskets"])
logger = logging.getLogger("uvicorn.error")


@router.get("/{basket_id}/snapshot")
def get_basket_snapshot(basket_id: str) -> dict:
    """
    Return a read-only snapshot for a basket.

    Flow:
      1. Fetch the basket (enforces RLS → user must belong to workspace).
      2. Follow basket.raw_dump_id → fetch the single raw_dump row.
      3. Fetch constant / locked / accepted blocks for that basket.
      4. Assemble + return.
    """
    try:
        # ── 1. basket row ───────────────────────────────────────────
        basket_resp = (
            supabase.table("baskets")
            .select("id, raw_dump_id, name, created_at")
            .eq("id", basket_id)
            .single()
            .execute()
        )
        basket = basket_resp.data
        if basket is None:
            raise HTTPException(status_code=404, detail="Basket not found")

        # ── 2. raw dump ─────────────────────────────────────────────
        dump_resp = (
            supabase.table("raw_dumps")
            .select("id, body_md, created_at")
            .eq("id", basket["raw_dump_id"])
            .single()
            .execute()
        )
        raw_dump = dump_resp.data or {}

        # ── 3. blocks (constant / locked / accepted) ────────────────
        block_resp = (
            supabase.table("blocks")
            .select(
                "id, semantic_type, content, state, scope, canonical_value"
            )
            .eq("basket_id", basket_id)
            .in_("state", ["CONSTANT", "LOCKED", "ACCEPTED"])
            .execute()
        )
        blocks = block_resp.data or []

    except HTTPException:
        raise  # re-raise 404 unchanged
    except Exception:
        logger.exception("get_basket_snapshot failed")
        raise HTTPException(status_code=500, detail="internal error")

    # ── 4. assemble & return ───────────────────────────────────────
    snapshot = assemble_snapshot([raw_dump], blocks)
    snapshot["basket"] = basket            # optional, but often useful
    return snapshot
