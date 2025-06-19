"""
Basket creation + initial dump

POST /api/baskets/new
Body:
{
  "text_dump": "...",     # optional – can start with an empty basket
  "file_urls": [...],     # optional list of Supabase storage URLs
  "basket_name": "My idea"
}

Success → 201 { "basket_id": "<uuid>" }
"""

import logging
from uuid import uuid4
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

from ..util.db import as_json
from ..utils.supabase_client import SUPABASE_KEY_ROLE, supabase_client as supabase

router = APIRouter(prefix="/baskets", tags=["baskets"])

log = logging.getLogger("uvicorn.error")
log.info("[basket_new] Supabase role: %s", SUPABASE_KEY_ROLE)


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _raise_if_supabase_error(resp: Any, ctx: str) -> None:
    """
    Handle both response shapes that supabase-py can return:

    ─ Newer (>1.2)  : APIResponse(data=[...], status_code=201, count=None)
    ─ Older (≤1.1)  : Response(data=[...], error=None)

    If status ≥400 or resp.error is truthy → raise 500.
    """
    if hasattr(resp, "error") and resp.error:  # legacy shape
        raise HTTPException(status_code=500, detail=f"{ctx}: {resp.error.message}")

    status = getattr(resp, "status_code", 200)
    if status >= 400:
        raise HTTPException(status_code=500, detail=f"{ctx}: status={status}")


# --------------------------------------------------------------------------- #
# payload model
# --------------------------------------------------------------------------- #
class BasketCreatePayload(BaseModel):
    text_dump: str | None = Field(None, alias="text_dump")
    file_urls: list[str] | None = None
    basket_name: str | None = None

    model_config = ConfigDict(populate_by_name=True)


# --------------------------------------------------------------------------- #
# route
# --------------------------------------------------------------------------- #
@router.post("/new", status_code=201)
async def create_basket(payload: BasketCreatePayload):
    """
    1. Insert a Basket (state=INIT).
    2. If text provided → insert RawDump then PATCH basket.raw_dump_id.
    """

    log.info("[basket_new] payload: %s", payload.model_dump())

    basket_id = str(uuid4())

    # 1️⃣  create the basket row (raw_dump_id will be NULL for the moment)
    try:
        r1 = (
            supabase.table("baskets")
            .insert(as_json({"id": basket_id, "name": payload.basket_name}))
            .execute()
        )
        _raise_if_supabase_error(r1, "basket insert")
    except Exception as exc:
        log.exception("basket insertion failed")
        raise HTTPException(status_code=500, detail="internal error") from exc

    # 2️⃣  optional raw-dump (+ back-patch basket)
    if payload.text_dump:
        dump_id = str(uuid4())
        try:
            r2 = (
                supabase.table("raw_dumps")
                .insert(
                    as_json(
                        {
                            "id": dump_id,
                            "basket_id": basket_id,
                            "body_md": payload.text_dump,
                            "file_refs": payload.file_urls or [],
                        }
                    )
                )
                .execute()
            )
            _raise_if_supabase_error(r2, "raw_dumps insert")

            # back-patch basket.raw_dump_id  (FK is now nullable, so two-phase is safe)
            r3 = (
                supabase.table("baskets")
                .update({"raw_dump_id": dump_id})
                .eq("id", basket_id)
                .execute()
            )
            _raise_if_supabase_error(r3, "basket patch raw_dump_id")

        except Exception as exc:
            log.exception("raw_dumps insertion or patch failed")
            raise HTTPException(status_code=500, detail="internal error") from exc

    return {"basket_id": basket_id}
