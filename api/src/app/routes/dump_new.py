from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..util.db import as_json
from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/dumps", tags=["dumps"])


class DumpPayload(BaseModel):
    basket_id: str
    text_dump: str
    file_urls: list[str] | None = None


@router.post("/new", status_code=201)
async def create_dump(p: DumpPayload):
    dump_id = str(uuid4())
    resp = (
        supabase.table("raw_dumps")
        .insert(
            as_json(
                {
                    "id": dump_id,
                    "basket_id": str(p.basket_id),
                    "body_md": p.text_dump,
                    "file_refs": p.file_urls or [],
                }
            )
        )
        .execute()
    )
    if getattr(resp, "status_code", 200) >= 400 or getattr(resp, "error", None):
        err = getattr(resp, "error", None)
        detail = err.message if getattr(err, "message", None) else str(err or resp)
        raise HTTPException(500, detail)

    supabase.table("events").insert(
        as_json(
            {
                "id": str(uuid4()),
                "basket_id": str(p.basket_id),
                "kind": "dump.created",
                "payload": {"dump_id": dump_id},
            }
        )
    ).execute()

    return {"raw_dump_id": dump_id}
