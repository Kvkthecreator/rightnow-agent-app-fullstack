from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..utils.db import as_json
from ..utils.supabase_client import supabase_client as supabase
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace
from ..ingestion.pipeline import chunk_text

router = APIRouter(prefix="/dumps", tags=["dumps"])


class DumpPayload(BaseModel):
    basket_id: str
    text_dump: str
    file_urls: list[str] | None = None


@router.post("/new", status_code=201)
async def create_dump(p: DumpPayload, user: dict = Depends(verify_jwt)):
    # Validate basket_id is string (no null)
    if not p.basket_id:
        raise HTTPException(400, "basket_id is required")
        
    workspace_id = get_or_create_workspace(user["user_id"])
    
    # Check if we need to chunk the text
    chunks = chunk_text(p.text_dump, max_len=30000)
    
    if len(chunks) <= 1:
        # Single dump case - maintain legacy behavior
        dump_id = str(uuid4())
        resp = (
            supabase.table("raw_dumps")
            .insert(
                as_json(
                    {
                        "id": dump_id,
                        "basket_id": str(p.basket_id),
                        "workspace_id": workspace_id,
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
    
    else:
        # Multiple chunks case
        dump_ids = []
        for chunk in chunks:
            dump_id = str(uuid4())
            resp = (
                supabase.table("raw_dumps")
                .insert(
                    as_json(
                        {
                            "id": dump_id,
                            "basket_id": str(p.basket_id),
                            "workspace_id": workspace_id,
                            "body_md": chunk.text,
                            "file_refs": p.file_urls or [] if chunk.order_index == 0 else [],
                        }
                    )
                )
                .execute()
            )
            if getattr(resp, "status_code", 200) >= 400 or getattr(resp, "error", None):
                err = getattr(resp, "error", None)
                detail = err.message if getattr(err, "message", None) else str(err or resp)
                raise HTTPException(500, detail)
            
            dump_ids.append(dump_id)
        
        # Log events for all chunks
        supabase.table("events").insert(
            as_json(
                {
                    "id": str(uuid4()),
                    "basket_id": str(p.basket_id),
                    "kind": "dump.created",
                    "payload": {"dump_ids": dump_ids, "chunk_count": len(dump_ids)},
                }
            )
        ).execute()
        
        return {"raw_dump_ids": dump_ids}
