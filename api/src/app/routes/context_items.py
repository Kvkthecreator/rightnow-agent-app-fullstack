from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.models.context import ContextItem, ContextItemCreate, ContextItemUpdate
from app.utils.jwt import verify_jwt
from app.utils.workspace import get_or_create_workspace
from app.utils.errors import raise_on_supabase_error
from app.utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/context-items", tags=["context"])
log = logging.getLogger("uvicorn.error")


@router.post("", response_model=ContextItem)
async def create_item(
    body: ContextItemCreate,
    user=Depends(verify_jwt),
    workspace=Depends(get_or_create_workspace),
):
    data = {"basket_id": workspace.basket_id, **body.dict(exclude_none=True)}
    try:
        resp = supabase.table("context_items").insert(data).execute()
    except Exception as err:  # pragma: no cover - network failure
        log.exception("context item insert failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    raise_on_supabase_error(resp)
    record = resp.data[0] if hasattr(resp, "data") else resp.json()[0]
    return ContextItem(**record)


@router.get("", response_model=list[ContextItem])
async def list_items(
    user=Depends(verify_jwt),
    workspace=Depends(get_or_create_workspace),
):
    try:
        resp = (
            supabase.table("context_items")
            .select("*")
            .eq("basket_id", workspace.basket_id)
            .execute()
        )
    except Exception as err:
        log.exception("context item list failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    raise_on_supabase_error(resp)
    records = resp.data if hasattr(resp, "data") else resp.json()
    return [ContextItem(**r) for r in records]


@router.get("/{item_id}", response_model=ContextItem)
async def get_item(item_id: str, user=Depends(verify_jwt), workspace=Depends(get_or_create_workspace)):
    try:
        resp = (
            supabase.table("context_items")
            .select("*")
            .eq("id", item_id)
            .single()
            .execute()
        )
    except Exception as err:
        log.exception("context item fetch failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    raise_on_supabase_error(resp)
    record = resp.data if hasattr(resp, "data") else resp.json()
    if record["basket_id"] != str(workspace.basket_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return ContextItem(**record)


@router.put("/{item_id}", response_model=ContextItem)
async def update_item(item_id: str, body: ContextItemUpdate, user=Depends(verify_jwt), workspace=Depends(get_or_create_workspace)):
    try:
        resp = (
            supabase.table("context_items")
            .update(body.dict(exclude_none=True))
            .eq("id", item_id)
            .eq("basket_id", workspace.basket_id)
            .execute()
        )
    except Exception as err:
        log.exception("context item update failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    raise_on_supabase_error(resp)
    record = resp.data[0] if hasattr(resp, "data") else resp.json()[0]
    return ContextItem(**record)


@router.delete("/{item_id}", status_code=204)
async def delete_item(item_id: str, user=Depends(verify_jwt), workspace=Depends(get_or_create_workspace)):
    try:
        resp = (
            supabase.table("context_items")
            .delete()
            .eq("id", item_id)
            .eq("basket_id", workspace.basket_id)
            .execute()
        )
    except Exception as err:
        log.exception("context item delete failed")
        raise HTTPException(status_code=500, detail="internal error") from err
    raise_on_supabase_error(resp)
    return
