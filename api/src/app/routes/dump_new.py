from __future__ import annotations

import os
from uuid import uuid4
import requests

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..utils.db import as_json
from ..utils.supabase_client import supabase_client as supabase
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace
from ..ingestion.pipeline import chunk_text
from ..ingestion.parsers.pdf_text import extract_pdf_text, PYMUPDF_AVAILABLE

router = APIRouter(prefix="/dumps", tags=["dumps"])

# Configuration from environment
ALLOWED_PUBLIC_BASE = os.getenv("ALLOWED_PUBLIC_BASE", "").rstrip("/") + "/"
ENABLE_PDF_V1 = os.getenv("ENABLE_PDF_V1", "0") == "1"
PDF_MAX_BYTES = int(os.getenv("PDF_MAX_BYTES", "20000000"))
CHUNK_LEN = int(os.getenv("CHUNK_LEN", "30000"))

def is_allowed_public_pdf(url: str) -> bool:
    """Check if URL is an allowed public Supabase PDF."""
    return bool(ALLOWED_PUBLIC_BASE and 
                url.startswith(ALLOWED_PUBLIC_BASE) and 
                url.lower().endswith(".pdf"))


class DumpPayload(BaseModel):
    basket_id: str
    text_dump: str
    file_urls: list[str] | None = None


@router.post("/new", status_code=201)
async def create_dump(p: DumpPayload, req: Request, user: dict = Depends(verify_jwt)):
    req_id = req.headers.get("X-Req-Id", "")
    
    # Validate basket_id is string (no null)
    if not p.basket_id:
        raise HTTPException(400, "basket_id is required")
        
    workspace_id = get_or_create_workspace(user["user_id"])
    
    # Collect all texts to process
    texts: list[str] = []
    
    # Add main text dump if provided
    if p.text_dump and p.text_dump.strip():
        texts.extend([c.text for c in chunk_text(p.text_dump, CHUNK_LEN)])
    
    # Process PDF files if enabled and PyMuPDF available
    if ENABLE_PDF_V1 and PYMUPDF_AVAILABLE and p.file_urls:
        for url in p.file_urls:
            if not is_allowed_public_pdf(url):
                continue
            try:
                # Fetch PDF with safety limits
                with requests.get(url, stream=True, timeout=10) as r:
                    ctype = r.headers.get("Content-Type", "")
                    if "pdf" not in ctype.lower():
                        continue
                    
                    total = 0
                    data = bytearray()
                    for chunk in r.iter_content(65536):
                        if not chunk:
                            break
                        data.extend(chunk)
                        total += len(chunk)
                        if total > PDF_MAX_BYTES:
                            raise HTTPException(413, f"PDF too large: {url}")
                    
                    # Extract text from PDF
                    pdf_text = extract_pdf_text(bytes(data))
                    if pdf_text.strip():
                        texts.extend([c.text for c in chunk_text(pdf_text, CHUNK_LEN)])
            except HTTPException:
                raise  # Re-raise size limit errors
            except Exception as e:
                # Soft-fail: keep URL as reference only
                if req_id:
                    print(f"[{req_id}] PDF extraction failed for {url}: {e}")
                pass
    
    # If no texts extracted, create reference dump
    if not texts:
        ref_parts = []
        if p.file_urls:
            ref_parts.extend(f"[file]({url})" for url in p.file_urls)
        if p.text_dump and p.text_dump.strip():
            ref_parts.append(p.text_dump.strip())
        
        ref_md = "\n\n".join(ref_parts)
        if not ref_md.strip():
            raise HTTPException(400, "Nothing to ingest")
        texts = [ref_md]
    
    # Insert all chunks as raw_dumps
    dump_ids: list[str] = []
    for idx, body in enumerate(texts):
        dump_id = str(uuid4())
        resp = (
            supabase.table("raw_dumps")
            .insert(
                as_json(
                    {
                        "id": dump_id,
                        "basket_id": str(p.basket_id),
                        "workspace_id": workspace_id,
                        "body_md": body,
                        "file_refs": p.file_urls or [] if idx == 0 else [],  # Only first gets file_refs
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
    
    # Log single event for all dumps created
    event_payload = {
        "dump_ids": dump_ids,
        "count": len(dump_ids),
    }
    if req_id:
        event_payload["req_id"] = req_id
        
    supabase.table("events").insert(
        as_json(
            {
                "id": str(uuid4()),
                "basket_id": str(p.basket_id),
                "workspace_id": workspace_id,
                "kind": "dump.created",
                "payload": event_payload,
            }
        )
    ).execute()
    
    # Always return both formats for compatibility
    return {"raw_dump_id": dump_ids[0], "raw_dump_ids": dump_ids}
