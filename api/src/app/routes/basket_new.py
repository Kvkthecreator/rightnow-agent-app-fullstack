import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

from ..utils.supabase_client import (
    SUPABASE_KEY_ROLE,
    supabase_client as supabase,
)

router = APIRouter(prefix="/baskets", tags=["baskets"])

logger = logging.getLogger("uvicorn.error")
logger.info("[basket_new] Supabase role: %s", SUPABASE_KEY_ROLE)


class BasketCreatePayload(BaseModel):
    text_dump: str = Field(..., alias="text_dump")
    file_urls: list[str] | None = None
    basket_name: str | None = None

    model_config = ConfigDict(populate_by_name=True)


@router.post("/new", status_code=201)
async def create_basket(payload: BasketCreatePayload):
    logger.info("[basket_new] payload: %s", payload.model_dump())

    try:
        resp = (
            supabase.rpc(
                "create_basket_with_dump",
                {
                    "p_name": payload.basket_name,
                    "p_body_md": payload.text_dump,
                },
            ).execute()
        )
    except Exception as err:
        logger.exception("create_basket_with_dump RPC failed")
        raise HTTPException(status_code=500, detail="internal error") from err

    if resp.error:
        logger.error("create_basket_with_dump RPC error: %s", resp.error.message)
        raise HTTPException(status_code=500, detail=resp.error.message)

    result = resp.data
    return {"basket_id": result[0]["basket_id"]}
