"""
/api/dump  – Upload raw text dump for a basket.
"""

import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from utils.supabase_client import supabase_client as supabase

from app.ingestion.intent import extract_intent
from app.ingestion.splitter import parse_blocks

router = APIRouter(prefix="/api", tags=["dump"])

_ALLOWED_MIME = {"text/plain", "text/markdown"}


def _insert_basket_input(basket_id: str, content: str, intent: str, conf: float) -> str:
    input_id = str(uuid.uuid4())
    supabase.table("basket_inputs").insert(
        {
            "id": input_id,
            "basket_id": basket_id,
            "content": content,
            "source": "user",
            "intent_auto": intent,
            "intent_confidence": conf,
        }
    ).execute()
    return input_id


def _insert_draft_block(user_id: str, basket_id: str, input_id: str, text: str) -> str:
    block_id = str(uuid.uuid4())
    supabase.table("context_blocks").insert(
        {
            "id": block_id,
            "user_id": user_id,
            "basket_id": basket_id,
            "label": text.splitlines()[0][:120],
            "content": text,
            "is_draft": True,
            "meta_derived_from": [input_id],
        }
    ).execute()
    return block_id


@router.post("/dump", status_code=status.HTTP_200_OK)
async def upload_dump(
    basket_id: str = Form(...),
    user_id: str = Form(...),
    text: str | None = Form(None),
    file: UploadFile | None = File(None),  # noqa: B008
):
    if not text and not file:
        raise HTTPException(status_code=400, detail="Provide text or file.")
    if file and file.content_type not in _ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="Unsupported MIME type.")
    if text and file:
        raise HTTPException(status_code=400, detail="Pass either text OR file.")

    raw = text
    if file:
        raw = (await file.read()).decode("utf-8")

    intent, conf = extract_intent(raw)

    # --- DB inserts ----------------------------------------------------
    # 1) commit row
    commit_resp = (
        supabase.table("dump_commits")
        .insert(
            {
                "basket_id": basket_id,
                "user_id": user_id,
                "summary": raw[:120],
            }
        )
        .execute()
    )
    commit_id = commit_resp.data[0]["id"]  # type: ignore[index]

    input_id = _insert_basket_input(basket_id, raw, intent, conf)
    chunk_ids: list[str] = []
    warning = None
    blocks = parse_blocks(raw)
    if len(blocks) > 100:
        warning = "too_many_blocks"
    for chunk in blocks:
        block_id = _insert_draft_block(user_id, basket_id, input_id, chunk)
        # Tag with commit_id
        supabase.table("context_blocks").update({"commit_id": commit_id}).eq(
            "id", block_id
        ).execute()
        chunk_ids.append(block_id)

    if warning:
        supabase.table("basket_inputs").update({"warning_flag": True}).eq("id", input_id).execute()

    response = {
        "input_id": input_id,
        "chunk_ids": chunk_ids,
        "intent": intent,
        "confidence": conf,
        "commit_id": commit_id,
    }
    if warning:
        response["warning"] = warning
    return response
