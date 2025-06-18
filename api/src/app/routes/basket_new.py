from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

from ..util.db import as_json
from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/baskets", tags=["baskets"])


class BasketCreatePayload(BaseModel):
    text_dump: str = Field(..., alias="text", description="text_dump required")
    file_urls: list[str] | None = None
    basket_name: str | None = None

    model_config = ConfigDict(populate_by_name=True)


@router.post("/new", status_code=201)
async def create_basket(payload: BasketCreatePayload):
    basket_id = str(uuid4())
    try:
        supabase.table("baskets").insert(
            as_json({"id": basket_id, "name": payload.basket_name})
        ).execute()
        supabase.table("raw_dumps").insert(
            as_json(
                {
                    "id": str(uuid4()),
                    "basket_id": basket_id,
                    "body_md": payload.text_dump,
                    "file_refs": payload.file_urls or [],
                }
            )
        ).execute()
    except Exception as err:
        raise HTTPException(status_code=500, detail="internal error") from err
    return {"basket_id": basket_id}
