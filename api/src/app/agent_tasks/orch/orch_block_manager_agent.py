from uuid import UUID, uuid4

from src.utils.db import json_safe

from app.utils.supabase_client import supabase_client as supabase


def run(basket_id: UUID) -> dict:
    """Insert a placeholder block then record a revision and event."""
    block_id = str(uuid4())
    res = (
        supabase.table("blocks")
        .insert(
            json_safe(
                {
                    "id": block_id,
                    "basket_id": str(basket_id),
                    "semantic_type": "placeholder",
                    "content": "pending proposal",
                    "state": "PROPOSED",
                }
            )
        )
        .execute()
    )
    if getattr(res, "status_code", 200) >= 300 or getattr(res, "error", None):
        raise RuntimeError(str(getattr(res, "error", res)))

    res = (
        supabase.table("block_revisions")
        .insert(
            json_safe(
                {
                    "block_id": block_id,
                    "prev_content": None,
                    "new_content": "pending proposal",
                    "changed_by": "orch_block_manager_agent",
                    "proposal_event": {},
                }
            )
        )
        .execute()
    )
    if getattr(res, "status_code", 200) >= 300 or getattr(res, "error", None):
        raise RuntimeError(str(getattr(res, "error", res)))

    res = (
        supabase.table("events")
        .insert(
            json_safe(
                {
                    "basket_id": str(basket_id),
                    "block_id": block_id,
                    "kind": "orch_block_manager.proposed",
                    "payload": {},
                }
            )
        )
        .execute()
    )
    if getattr(res, "status_code", 200) >= 300 or getattr(res, "error", None):
        raise RuntimeError(str(getattr(res, "error", res)))

    return {"proposed": 1}
