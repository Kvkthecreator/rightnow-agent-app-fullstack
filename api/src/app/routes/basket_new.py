from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from uuid import uuid4

from ..utils.supabase_client import supabase_client as supabase
from ..util.db import json_safe

router = APIRouter(prefix="/baskets", tags=["baskets"])


class BasketCreatePayload(BaseModel):
    text_dump: str = Field(..., alias="text")
    file_urls: list[str] | None = None
    basket_name: str | None = None

    class Config:
        allow_population_by_field_name = True


@router.post("/new", status_code=201)
async def create_basket(payload: BasketCreatePayload):
    basket_id = str(uuid4())
    try:
        supabase.table("baskets").insert(
            json_safe({"id": basket_id, "name": payload.basket_name})
        ).execute()
        supabase.table("raw_dumps").insert(
            json_safe(
                {
                    "id": str(uuid4()),
                    "basket_id": basket_id,
                    "body_md": payload.text_dump,
                    "file_refs": payload.file_urls or [],
                }
            )
        ).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="internal error")
    return {"basket_id": basket_id}
