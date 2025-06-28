import logging
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException
from postgrest.exceptions import APIError
from src.utils.db import json_safe

from app.utils.supabase_client import supabase_client as supabase
from .orch_basket_parser_agent import run as run_parser

log = logging.getLogger("uvicorn.error")


def run(basket_id: UUID) -> dict[str, Any]:
    """Parse the latest raw dump and create PROPOSED blocks.

    The parser expects ``artifacts`` as a list of ``{"type": str, "content": str}``
    dictionaries. Only ``type`` and ``content`` are used currently.

    Returns a dict with the number of blocks inserted and their IDs.
    """
    try:
        b_res = (
            supabase.table("baskets")
            .select("workspace_id,user_id")
            .eq("id", str(basket_id))
            .single()
            .execute()
        )
        if not b_res.data:
            raise RuntimeError("basket not found")
        workspace_id = b_res.data["workspace_id"]
        user_id = b_res.data.get("user_id") or "system"
    except Exception as err:  # noqa: BLE001
        log.exception("basket lookup failed for %s", basket_id)
        raise RuntimeError("basket lookup failed") from err

    try:
        d_res = (
            supabase.table("raw_dumps")
            .select("body_md,file_refs")
            .eq("basket_id", str(basket_id))
            .order("created_at", desc=True)
            .limit(1)
            .single()
            .execute()
        )
        if not d_res.data:
            raise RuntimeError("raw dump not found")
        body = d_res.data.get("body_md", "")
    except Exception as err:  # noqa: BLE001
        log.exception("raw dump lookup failed for basket %s", basket_id)
        raise RuntimeError("raw dump lookup failed") from err

    parsed = run_parser(
        str(basket_id),
        [{"type": "text", "content": body}],
        user_id,
    )

    inserted_ids: list[str] = []
    for blk in parsed.blocks:
        if not blk.content or not str(blk.content).strip():
            continue
        block_id = str(blk.id or uuid4())
        block_payload = {
            "id": block_id,
            "basket_id": str(basket_id),
            "workspace_id": workspace_id,
            "semantic_type": blk.type,
            "content": blk.content,
            "state": "PROPOSED",
            "meta_agent_notes": "created_by_agent=orch_block_manager",
        }
        try:
            res = supabase.table("blocks").insert(json_safe(block_payload)).execute()
        except APIError:
            log.exception("block insert API error for basket %s", basket_id)
            raise
        except Exception:  # noqa: BLE001
            log.exception("block insert failed for basket %s", basket_id)
            raise
        if getattr(res, "status_code", 200) >= 400 or not res.data:
            log.warning("Supabase insert failed", extra=block_payload)
            raise HTTPException(status_code=500, detail="Supabase insert failed")

        rev_payload = {
            "block_id": block_id,
            "workspace_id": workspace_id,
            "actor_id": user_id,
            "summary": "orch block proposed",
            "diff_json": {"new_content": blk.content},
        }
        try:
            supabase.table("block_revisions").insert(json_safe(rev_payload)).execute()
        except APIError as err:  # noqa: BLE001
            log.error(
                "revision insert API error for basket %s: %s",
                basket_id,
                getattr(err, "message", str(err)),
            )
            raise HTTPException(status_code=500, detail="Supabase insert failed") from err
        except Exception as err:  # noqa: BLE001
            log.exception("revision insert failed for basket %s", basket_id)
            raise HTTPException(status_code=500, detail="Supabase insert failed") from err

        inserted_ids.append(block_id)

    if inserted_ids:
        event_payload = {
            "basket_id": str(basket_id),
            "workspace_id": workspace_id,
            "kind": "orch_block_manager.proposed",
            "payload": {"block_ids": inserted_ids, "count": len(inserted_ids)},
        }
        try:
            supabase.table("events").insert(json_safe(event_payload)).execute()
        except APIError:
            log.exception("event insert API error for basket %s", basket_id)
            raise
        except Exception:  # noqa: BLE001
            log.exception("event insert failed for basket %s", basket_id)
            raise

    log.info(
        "orch_block_manager proposed %s blocks for basket %s",
        len(inserted_ids),
        basket_id,
    )

    return {"inserted": len(inserted_ids), "block_ids": inserted_ids}
