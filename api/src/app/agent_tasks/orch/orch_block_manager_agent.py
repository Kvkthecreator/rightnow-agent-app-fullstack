from typing import Any
from uuid import UUID, uuid4

import logging
from fastapi import HTTPException
from postgrest.exceptions import APIError

from src.utils.db import json_safe

from app.utils.supabase_client import supabase_client as supabase

log = logging.getLogger("uvicorn.error")


def run(basket_id: UUID) -> dict[str, Any]:
    """Insert a placeholder block then record a revision and event."""
    try:
        ws_res = (
            supabase.table("baskets")
            .select("workspace_id")
            .eq("id", str(basket_id))
            .execute()
        )
        workspace_id = ws_res.data[0]["workspace_id"]
    except Exception as err:  # noqa: BLE001
        log.exception("workspace lookup failed for basket %s", basket_id)
        raise RuntimeError("workspace lookup failed") from err

    block_id = str(uuid4())
    block_payload = {
        "id": block_id,
        "basket_id": str(basket_id),
        "workspace_id": workspace_id,
        "semantic_type": "placeholder",
        "content": "pending proposal",
        "state": "PROPOSED",
    }
    try:
        res = supabase.table("blocks").insert(json_safe(block_payload)).execute()
    except APIError as err:
        log.exception("block insert API error for basket %s", basket_id)
        raise
    except Exception as err:  # noqa: BLE001
        log.exception("block insert failed for basket %s", basket_id)
        raise
    if getattr(res, "status_code", 200) >= 400 or not res.data:
        log.warning("Supabase insert failed", extra=block_payload)
        raise HTTPException(status_code=500, detail="Supabase insert failed")

    rev_payload = {
        "block_id": block_id,
        "workspace_id": workspace_id,
        "prev_content": None,
        "new_content": "pending proposal",
        "changed_by": "orch_block_manager_agent",
        "proposal_event": {},
    }
    try:
        res = (
            supabase.table("block_revisions")
            .insert(json_safe(rev_payload))
            .execute()
        )
    except APIError as err:
        log.exception("revision insert API error for basket %s", basket_id)
        raise
    except Exception as err:  # noqa: BLE001
        log.exception("revision insert failed for basket %s", basket_id)
        raise
    if getattr(res, "status_code", 200) >= 400 or not res.data:
        log.warning("Supabase insert failed", extra=rev_payload)
        raise HTTPException(status_code=500, detail="Supabase insert failed")

    event_payload = {
        "basket_id": str(basket_id),
        "workspace_id": workspace_id,
        "block_id": block_id,
        "kind": "orch_block_manager.proposed",
        "payload": {},
    }
    try:
        res = (
            supabase.table("events")
            .insert(json_safe(event_payload))
            .execute()
        )
    except APIError as err:
        log.exception("event insert API error for basket %s", basket_id)
        raise
    except Exception as err:  # noqa: BLE001
        log.exception("event insert failed for basket %s", basket_id)
        raise
    if getattr(res, "status_code", 200) >= 400 or not res.data:
        log.warning("Supabase insert failed", extra=event_payload)
        raise HTTPException(status_code=500, detail="Supabase insert failed")
    return {"inserted": len(res.data)}
