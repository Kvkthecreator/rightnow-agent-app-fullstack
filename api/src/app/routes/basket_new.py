import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

from ..util.db import as_json
from ..utils.supabase_client import (
    SUPABASE_KEY_ROLE,
    supabase_client as supabase,
)

router = APIRouter(prefix="/baskets", tags=["baskets"])

logger = logging.getLogger("uvicorn.error")
logger.info("[basket_new] Supabase role: %s", SUPABASE_KEY_ROLE)


class BasketCreatePayload(BaseModel):
    text_dump: str | None = Field(None, alias="text_dump")
    file_urls: list[str] | None = None
    basket_name: str | None = None

    model_config = ConfigDict(populate_by_name=True)


@router.post("/new", status_code=201)
async def create_basket(payload: BasketCreatePayload):
    logger.info("[basket_new] payload: %s", payload.dict())

    basket_id = str(uuid4())
    try:
        resp = (
            supabase.table("baskets")
            .insert(as_json({"id": basket_id, "name": payload.basket_name}))
            .execute()
        )
    except Exception as err:
        logger.exception("basket insertion failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    if resp.error:
        raise HTTPException(status_code=500, detail=resp.error.message)

    if payload.text_dump:
        dump_id = str(uuid4())
        dr = (
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
        if dr.error:
            raise HTTPException(status_code=500, detail=dr.error.message)
        supabase.table("baskets").update({"raw_dump_id": dump_id}).eq(
            "id", basket_id
        ).execute()

    return {"basket_id": basket_id}
