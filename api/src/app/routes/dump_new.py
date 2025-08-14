from __future__ import annotations

import os
import json
import logging
from uuid import uuid4
from typing import List, Dict, Any, Optional
import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..utils.db import as_json
from ..utils.supabase_client import supabase_client as supabase
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace
from ..ingestion.pipeline import chunk_text
from ..ingestion.parsers.pdf_text import extract_pdf_text, PYMUPDF_AVAILABLE

router = APIRouter(prefix="/dumps", tags=["dumps"])
logger = logging.getLogger("uvicorn.error")

# Configuration from environment
ALLOWED_PUBLIC_BASE = os.getenv("ALLOWED_PUBLIC_BASE", "").rstrip("/")
if ALLOWED_PUBLIC_BASE:
    ALLOWED_PUBLIC_BASE += "/"
PDF_MAX_BYTES = int(os.getenv("PDF_MAX_BYTES", "20000000"))
CHUNK_LEN = int(os.getenv("CHUNK_LEN", "30000"))
FETCH_TIMEOUT_SECONDS = int(os.getenv("FETCH_TIMEOUT_SECONDS", "20"))

def is_allowed_url(url: str) -> bool:
    """Check if URL is from allowed public base."""
    if not ALLOWED_PUBLIC_BASE:
        raise HTTPException(500, "ALLOWED_PUBLIC_BASE not configured")
    return url.startswith(ALLOWED_PUBLIC_BASE)


class DumpPayload(BaseModel):
    basket_id: str
    text_dump: str
    file_urls: list[str] | None = None


@router.post("/new", status_code=201)
async def create_dump(p: DumpPayload, req: Request, user: dict = Depends(verify_jwt)):
    trace_id = req.headers.get("X-Req-Id") or f"dump_{uuid4().hex[:8]}"
    
    # Validate basket_id is string (no null)
    if not p.basket_id:
        raise HTTPException(400, "basket_id is required")
        
    workspace_id = get_or_create_workspace(user["user_id"])
    
    # Aggregate all text content
    agg_text = p.text_dump or ""
    source_meta: List[Dict[str, Any]] = []
    
    # Process file URLs if provided
    if p.file_urls:
        if not PYMUPDF_AVAILABLE:
            logger.warning(f"[{trace_id}] PyMuPDF not available, files will be references only")
            
        for url in p.file_urls:
            # SSRF protection
            if not is_allowed_url(url):
                raise HTTPException(400, f"Disallowed file URL: {url}")
                
            meta_item = {"url": url, "parsed": False}
            
            try:
                # Fetch file with timeout and size limits
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        url, 
                        timeout=FETCH_TIMEOUT_SECONDS,
                        follow_redirects=True
                    )
                    response.raise_for_status()
                    
                    # Check content length
                    size = int(response.headers.get("Content-Length", "0"))
                    if size > PDF_MAX_BYTES:
                        raise HTTPException(413, f"File too large: {size} bytes")
                        
                    content = response.content
                    mime = response.headers.get("Content-Type", "")
                    meta_item["mime"] = mime
                    meta_item["size"] = len(content)
                    
                    # Try to parse if PDF
                    if ("pdf" in mime.lower() or 
                        content.startswith(b"%PDF-") or 
                        url.lower().endswith(".pdf")) and PYMUPDF_AVAILABLE:
                        try:
                            pdf_text = extract_pdf_text(content)
                            if pdf_text.strip():
                                meta_item["parsed"] = True
                                meta_item["chars_extracted"] = len(pdf_text)
                                # Append with separator if we have existing text
                                if agg_text:
                                    agg_text += "\n\n"
                                agg_text += pdf_text
                                logger.info(f"[{trace_id}] Parsed PDF: {url} ({len(pdf_text)} chars)")
                            else:
                                meta_item["parse_error"] = "No text content found"
                        except Exception as e:
                            meta_item["parse_error"] = str(e)
                            logger.warning(f"[{trace_id}] PDF parse failed for {url}: {e}")
                            
            except HTTPException:
                raise  # Re-raise HTTP errors
            except httpx.TimeoutException:
                meta_item["parse_error"] = "Fetch timeout"
                logger.warning(f"[{trace_id}] Timeout fetching {url}")
            except Exception as e:
                meta_item["parse_error"] = str(e)
                logger.warning(f"[{trace_id}] Failed to fetch {url}: {e}")
                
            source_meta.append(meta_item)
    
    # Check if we have any usable text
    if not agg_text.strip():
        # Check if we at least tried to parse PDFs
        parsed_count = sum(1 for m in source_meta if m.get("parsed", False))
        if source_meta and parsed_count == 0:
            # All files failed to parse or were non-PDF
            if not p.text_dump:
                raise HTTPException(422, "No usable text to ingest (PDF parsing failed or no text content)")
        elif not p.text_dump and not p.file_urls:
            raise HTTPException(422, "No content provided")
            
        # Fall back to reference-only if we have some text or URLs
        ref_parts = []
        if p.text_dump and p.text_dump.strip():
            ref_parts.append(p.text_dump.strip())
        if p.file_urls:
            ref_parts.extend(f"[file]({url})" for url in p.file_urls)
        agg_text = "\n\n".join(ref_parts)
    
    # Chunk the aggregated text
    chunks = chunk_text(agg_text, CHUNK_LEN)
    dump_ids: List[str] = []
    
    # Insert all chunks as raw_dumps
    for idx, chunk in enumerate(chunks):
        dump_id = str(uuid4())
        dump_data = {
            "id": dump_id,
            "basket_id": str(p.basket_id),
            "workspace_id": workspace_id,
            "body_md": chunk.text,
            "file_refs": p.file_urls or [] if idx == 0 else [],  # Only first gets file_refs
            "source_meta": source_meta if idx == 0 else None,  # Only first gets metadata
            "ingest_trace_id": trace_id,
        }
        
        resp = supabase.table("raw_dumps").insert(as_json(dump_data)).execute()
        
        if getattr(resp, "error", None):
            err = getattr(resp, "error", None)
            detail = err.message if hasattr(err, "message") else str(err)
            logger.error(f"[{trace_id}] Failed to insert dump: {detail}")
            raise HTTPException(500, f"Database error: {detail}")
            
        dump_ids.append(dump_id)
    
    # Log single event for all dumps created
    event_payload = {
        "dump_ids": dump_ids,
        "chunk_count": len(dump_ids),
        "trace_id": trace_id,
        "parsed_files": sum(1 for m in source_meta if m.get("parsed", False)),
        "total_files": len(source_meta),
    }
        
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
    
    logger.info(f"[{trace_id}] Created {len(dump_ids)} dumps for basket {p.basket_id}")
    
    # Return appropriate format based on chunk count
    if len(dump_ids) == 1:
        return {"raw_dump_id": dump_ids[0]}
    else:
        return {"raw_dump_ids": dump_ids}
