"""Create-basket endpoint.

* Accepts legacy `{text_dump: …}` payloads (mobile / old web)
* Accepts V2 payload with topic / intent / insight / blocks
* Persists everything under the caller’s workspace
"""

from __future__ import annotations

import logging
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ValidationError
from supabase import Client  # type: ignore

from ..utils.supabase_client import supabase_client as supabase        # sync client
from ..utils.workspace import get_or_create_workspace                  # helper you already have
from ..auth import get_user                                            # returns dict with "id"

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/baskets", tags=["baskets"])

# --------------------------------------------------------------------------- #
# 1. Payload models
# --------------------------------------------------------------------------- #


class BasketCreateLegacy(BaseModel):
    """The original schema used by old clients."""

    text_dump: str = Field(..., min_length=1)
    file_urls: Optional[List[str]] = None
    basket_name: Optional[str] = None


class SeedBlock(BaseModel):
    semantic_type: str
    label: Optional[str] = None
    content: str
    is_primary: Optional[bool] = False
    meta_scope: Optional[str] = "basket"
    source: Optional[str] = None


class BasketCreateV2(BaseModel):
    """New, richer schema described in BASKETS_API_CONTRACT.md"""

    topic: str
    intent: Optional[str] = None
    insight: Optional[str] = None
    blocks: Optional[List[SeedBlock]] = None


# --------------------------------------------------------------------------- #
# 2. Route handler
# --------------------------------------------------------------------------- #


@router.post("/new", status_code=201)
def create_basket(payload: Any, user=Depends(get_user)) -> dict:  # noqa: ANN401 – raw JSON in
    """Create a new basket (supports legacy + V2 bodies)."""
    uid: str | None = user.get("id")
    if not uid:
        raise HTTPException(status_code=401, detail="unauthenticated")

    # ---------- figure out which schema we received ----------
    legacy: BasketCreateLegacy | None
    v2: BasketCreateV2 | None

    try:
        legacy = BasketCreateLegacy.model_validate(payload)
        v2 = None
        mode = "legacy"
    except ValidationError:
        legacy = None
        try:
            v2 = BasketCreateV2.model_validate(payload)
            mode = "v2"
        except ValidationError as ve:
            logger.info("basket_new: bad request %s", ve)
            raise HTTPException(status_code=400, detail="invalid payload") from ve

    # ---------------------------------------------------------
    # workspace resolution (never None thanks to invariant I-1)
    ws_id = get_or_create_workspace(supabase, uid)

    # ---------------------------------------------------------
    # all writes happen in one transaction
    # ---------------------------------------------------------
    try:
        with supabase.postgrest.rpc("pg_temp.start_transaction").execute():  # type: ignore
            if mode == "legacy":  # ---------------------------------------
                dump_body = legacy.text_dump
                dump_id = (
                    supabase.table("raw_dumps")
                    .insert(
                        {
                            "body_md": dump_body,
                            "file_refs": legacy.file_urls or [],
                            "workspace_id": ws_id,
                        }
                    )
                    .execute()
                    .data[0]["id"]
                )

                basket_row = (
                    supabase.table("baskets")
                    .insert(
                        {
                            "name": legacy.basket_name,
                            "raw_dump_id": dump_id,
                            "workspace_id": ws_id,
                        }
                    )
                    .execute()
                    .data[0]
                )

            else:  # --------------------------- V2 -----------------------
                assert v2 is not None  # mypy guard

                dump_id = (
                    supabase.table("raw_dumps")
                    .insert(
                        {
                            "body_md": v2.topic,
                            "workspace_id": ws_id,
                        }
                    )
                    .execute()
                    .data[0]["id"]
                )

                basket_row = (
                    supabase.table("baskets")
                    .insert(
                        {
                            "name": v2.topic,
                            "raw_dump_id": dump_id,
                            "workspace_id": ws_id,
                        }
                    )
                    .execute()
                    .data[0]
                )

                # optional: seed blocks
                if v2.blocks:
                    block_rows = [
                        {
                            "semantic_type": blk.semantic_type,
                            "label": blk.label,
                            "content": blk.content,
                            "state": "INIT",
                            "scope": blk.meta_scope,
                            "canonical_value": blk.content,
                            "source": blk.source,
                            "is_primary": blk.is_primary,
                            "basket_id": basket_row["id"],
                            "workspace_id": ws_id,
                        }
                        for blk in v2.blocks
                    ]
                    supabase.table("blocks").insert(block_rows).execute()

            # commit happens automatically when context block exits
    except Exception as err:
        logger.exception("basket_new failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    return {"id": basket_row["id"]}
