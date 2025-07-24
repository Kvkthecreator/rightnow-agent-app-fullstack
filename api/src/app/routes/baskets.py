"""API routes for Basket management."""

import logging
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from schemas.context_block import ContextBlock
from src.utils.db import json_safe

from ..agents.utils.supabase_helpers import get_supabase
from ..event_bus import publish_event
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/baskets", tags=["baskets"])

logger = logging.getLogger("uvicorn.error")

# Allow tests to monkeypatch the module-level client
supabase = get_supabase()


class BasketCreate(BaseModel):
    topic: str
    intent: str
    insight: Optional[str] = None
    reference_file_ids: list[str] = Field(default_factory=list)


class BasketUpdate(BaseModel):
    input_text: Optional[str] = None
    intent_summary: Optional[str] = None


@router.post("/", status_code=201)
async def create_basket(
    payload: BasketCreate,
    user: dict = Depends(verify_jwt),
):
    """Create a new basket and emit compose request."""
    basket_id = str(uuid.uuid4())
    workspace_id = get_or_create_workspace(user["user_id"])
    logger.info(
        "create_basket user=%s workspace=%s", user["user_id"], workspace_id
    )
    try:
        resp = (
            supabase.table("baskets")
            .insert(
                json_safe(
                    {
                        "id": basket_id,
                        "user_id": user["user_id"],
                        "workspace_id": workspace_id,
                        "name": payload.topic,
                        "raw_dump": payload.topic,
                        "status": "draft",
                    }
                )
            )
            .execute()
        )
    except Exception as err:
        logger.exception("create_basket failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    if getattr(resp, "status_code", 200) >= 400 or getattr(resp, "error", None):
        detail = getattr(resp, "error", resp)
        raise HTTPException(status_code=500, detail=str(detail))

    blocks: list[dict[str, Any]] = [
        {
            "id": str(uuid.uuid4()),
            "type": "topic",
            "label": "What are we working on?",
            "content": payload.topic,
            "is_primary": True,
            "meta_scope": "basket",
            "status": "active",
        },
        {
            "id": str(uuid.uuid4()),
            "type": "intent",
            "label": "Intent",
            "content": payload.intent,
            "is_primary": True,
            "meta_scope": "basket",
            "status": "active",
        },
    ]

    if payload.insight:
        blocks.append(
            {
                "id": str(uuid.uuid4()),
                "type": "insight",
                "label": "Insight",
                "content": payload.insight,
                "is_primary": True,
                "meta_scope": "basket",
                "status": "active",
            }
        )

    if payload.reference_file_ids:
        blocks.append(
            {
                "id": str(uuid.uuid4()),
                "type": "reference",
                "label": "reference files",
                "file_ids": payload.reference_file_ids,
                "source": "user_upload",
                "is_primary": True,
                "meta_scope": "basket",
                "status": "active",
            }
        )

    for blk in blocks:
        blk["workspace_id"] = workspace_id
        blk["basket_id"] = basket_id
        safe_block = ContextBlock.model_validate(blk).model_dump(
            mode="json", exclude_none=True
        )
        try:
            supabase.table("blocks").insert(json_safe(safe_block)).execute()
        except Exception as err:
            logger.exception("block insertion failed")
            raise HTTPException(status_code=500, detail="internal error") from err
    await publish_event(
        "basket.compose_request",
        {
            "basket_id": basket_id,
            "topic": payload.topic,
            "intent": payload.intent,
            "insight": payload.insight,
            "file_ids": payload.reference_file_ids,
        },
    )
    return {"id": basket_id}


@router.get("/list", response_model=list[dict])
def list_baskets(user: dict = Depends(verify_jwt)) -> list[dict]:
    """Return recent baskets for the caller's workspace."""
    workspace_id = get_or_create_workspace(user["user_id"])
    try:
        b_resp = (
            supabase.table("baskets")
            .select("id,name,raw_dump_id,created_at")
            .eq("workspace_id", workspace_id)
            .order("created_at", desc="desc")
            .execute()
        )

        logger.debug(
            "[list_baskets] workspace_id=%s rows=%s",
            workspace_id,
            b_resp.data,
        )

        if getattr(b_resp, "status_code", 200) >= 400 or getattr(b_resp, "error", None):
            logger.warning("baskets query failed: %s", getattr(b_resp, "error", b_resp))
            raise HTTPException(status_code=500, detail="internal error")

        baskets = b_resp.data or []
        results: list[dict] = []
        for row in baskets:
            body_md = None
            raw_dump_id = row.get("raw_dump_id")
            if raw_dump_id:
                d_resp = (
                    supabase.table("raw_dumps")
                    .select("body_md")
                    .eq("id", raw_dump_id)
                    .execute()
                )
                if getattr(d_resp, "status_code", 200) >= 400 or getattr(
                    d_resp, "error", None
                ):
                    logger.warning(
                        "raw_dump lookup failed for %s: %s",
                        raw_dump_id,
                        getattr(d_resp, "error", d_resp),
                    )
                elif d_resp.data:
                    if isinstance(d_resp.data, list):
                        body_md = d_resp.data[0].get("body_md")
                    else:
                        body_md = d_resp.data.get("body_md")

            results.append(
                {
                    "id": row["id"],
                    "name": row.get("name"),
                    "raw_dump_body": body_md,
                    "created_at": row.get("created_at"),
                }
            )

        return results
    except Exception as err:  # pragma: no cover
        logger.exception("list_baskets failed")
        raise HTTPException(status_code=500, detail="internal error") from err


@router.get("/{basket_id}")
async def get_basket(basket_id: str, user: dict = Depends(verify_jwt)):
    """Fetch a basket with its blocks and configs."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        basket_resp = (
            supabase.table("baskets")
            .select("*")
            .eq("id", str(basket_id))
            .eq("workspace_id", workspace_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        logger.exception("get_basket failed")
        raise HTTPException(status_code=500, detail="internal error") from exc

    if basket_resp.data is None:
        raise HTTPException(status_code=404, detail="Basket not found")
    try:
        blk_resp = (
            supabase.table("blocks")
            .select("id,type,content,order,meta_tags,origin,status")
            .eq("basket_id", basket_id)
            .eq("workspace_id", workspace_id)
            .order("order")
            .execute()
        )
        blocks = blk_resp.data or []
        cfgs = (
            supabase.table("basket_configs")
            .select("*")
            .eq("basket_id", basket_id)
            .eq("workspace_id", workspace_id)
            .execute()
        )
    except Exception as err:
        logger.exception("get_basket related queries failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    return {
        "id": basket_id,
        "status": basket_resp.data.get("status"),
        "name": basket_resp.data.get("name"),
        "raw_dump": basket_resp.data.get("raw_dump"),
        "tags": basket_resp.data.get("tags"),
        "commentary": basket_resp.data.get("commentary"),
        "blocks": blocks,
        "configs": cfgs.data or [],
    }


@router.post("/{basket_id}/work", status_code=202)
async def update_basket(
    basket_id: str,
    payload: BasketUpdate,
    user: dict = Depends(verify_jwt),
):
    """Add new context to an existing basket and trigger composer."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        if payload.input_text:
            supabase.table("basket_threads").insert(
                json_safe(
                    {
                        "basket_id": basket_id,
                        "workspace_id": workspace_id,
                        "content": payload.input_text,
                        "source": "user_dump",
                    }
                )
            ).execute()
    except Exception as err:
        logger.exception("update_basket failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    await publish_event(
        "basket.compose_request",
        {
            "basket_id": basket_id,
            "intent": payload.intent_summary or "",
            "details": payload.input_text,
            "file_ids": [],
        },
    )
    return {"id": basket_id}
