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
from app.utils.auth_helpers import get_user
from ..supabase_helpers import get_or_create_workspace
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
    """Create a new basket tied to the caller's workspace."""

    log.info("[basket_new] payload: %s", payload.model_dump())

    workspace_id = get_or_create_workspace(supabase, user["id"])

    dump_resp = supabase.table("raw_dumps").insert(
        {
            "body_md": payload.text_dump or "",
            "file_refs": payload.file_urls or [],
            "workspace_id": workspace_id,
        }
    ).execute()
    dump_id = dump_resp.data[0]["id"]

    basket_resp = supabase.table("baskets").insert(
        {
            "name": payload.basket_name,
            "raw_dump_id": dump_id,
            "workspace_id": workspace_id,
        }
    ).execute()
    basket_id = basket_resp.data[0]["id"]

    return {"id": basket_id}
