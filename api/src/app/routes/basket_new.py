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

from fastapi import APIRouter, HTTPException, Depends
from supabase.lib.auth_helpers import get_user
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

from ..util.db import as_json
from ..utils.supabase_client import SUPABASE_KEY_ROLE, supabase_client as supabase

router = APIRouter(prefix="/baskets", tags=["baskets"])

log = logging.getLogger("uvicorn.error")
log.info("[basket_new] Supabase role: %s", SUPABASE_KEY_ROLE)



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
async def create_basket(
    payload: BasketCreatePayload,
    user=Depends(get_user),
):
    """
    1. Insert a Basket (state=INIT).
    2. If text provided → insert RawDump then PATCH basket.raw_dump_id.
    """

    log.info("[basket_new] payload: %s", payload.model_dump())

    basket_id = str(uuid4())

    basket_row = {"id": basket_id, "name": payload.basket_name}

    # 1️⃣  create the basket row
    try:
        supabase.table("baskets").insert(as_json(basket_row)).execute()
    except Exception as exc:
        log.exception("basket insertion failed")
        raise HTTPException(status_code=500, detail="internal error") from exc

    # 2️⃣  optional raw-dump
    if payload.text_dump:
        dump_id = str(uuid4())
        try:
            supabase.table("raw_dumps").insert(
                as_json({
                    "id": dump_id,
                    "basket_id": basket_id,
                    "body_md": payload.text_dump,
                    "file_refs": payload.file_urls or [],
                })
            ).execute()
        except Exception as exc:
            log.exception("raw_dumps insertion or patch failed")
            raise HTTPException(status_code=500, detail="internal error") from exc

    return {"basket_id": basket_id}
