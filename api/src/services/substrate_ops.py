# ruff: noqa
"""Simple substrate operations for manager use."""

import logging
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from app.utils.db import as_json
from app.utils.supabase_client import supabase_client as supabase

logger = logging.getLogger("uvicorn.error")


class SubstrateOps:
    """Simplified substrate operations for creating and updating entities."""

    @staticmethod
    async def create_context_block(
        basket_id: str,
        content: str,
        source_id: str,
        workspace_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, int]:
        """
        Create a context block from raw dump content.
        Returns (block_id, version).
        """
        block_id = str(uuid4())
        block_data = {
            "id": block_id,
            "basket_id": basket_id,
            "workspace_id": workspace_id,
            "content": content[:2000],  # Truncate for blocks
            "source_ref": source_id,
            "version": 1,
            "state": "draft",
            "metadata": metadata or {}
        }

        resp = supabase.table("context_blocks").insert(as_json(block_data)).execute()

        if getattr(resp, "error", None):
            logger.error(f"Failed to create block: {resp.error}")
            raise Exception(f"Failed to create block: {resp.error}")

        return block_id, 1

    @staticmethod
    async def create_document(
        basket_id: str,
        title: str,
        content: str,
        source_ids: List[str],
        workspace_id: str,
        doc_type: str = "analysis"
    ) -> Tuple[str, int]:
        """
        Create a document from processed content.
        Returns (document_id, version).
        """
        resp = supabase.rpc('fn_document_create', {
            "p_basket_id": basket_id,
            "p_workspace_id": workspace_id,
            "p_title": title,
            "p_content_raw": content,
        }).execute()

        if getattr(resp, "error", None):
            logger.error(f"Failed to create document: {resp.error}")
            raise Exception(f"Failed to create document: {resp.error}")

        doc_id = resp.data
        return doc_id, 1

    @staticmethod
    async def update_context_block(
        block_id: str,
        content: str,
        from_version: int
    ) -> int:
        """
        Update an existing context block.
        Returns new version number.
        """
        new_version = from_version + 1

        resp = (
            supabase.table("context_blocks")
            .update({
                "content": content[:2000],
                "version": new_version,
                "updated_at": "now()"
            })
            .eq("id", block_id)
            .eq("version", from_version)  # Optimistic locking
            .execute()
        )

        if getattr(resp, "error", None) or not resp.data:
            logger.error(f"Failed to update block {block_id}: version conflict or error")
            raise Exception("Failed to update block: version conflict")

        return new_version

    @staticmethod
    async def load_basket_substrate(basket_id: str) -> Dict[str, Any]:
        """
        Load existing substrate for a basket.
        Returns dict with blocks, documents, and context items.
        """
        # Load blocks
        blocks_resp = (
            supabase.table("context_blocks")
            .select("*")
            .eq("basket_id", basket_id)
            .execute()
        )

        # Load documents
        docs_resp = (
            supabase.table("documents")
            .select("*")
            .eq("basket_id", basket_id)
            .execute()
        )

        return {
            "blocks": {b["id"]: b for b in (blocks_resp.data or [])},
            "documents": {d["id"]: d for d in (docs_resp.data or [])},
            "context_items": {}  # TODO: Load context items if needed
        }

    @staticmethod
    async def get_raw_dump_content(dump_id: str) -> Optional[str]:
        """Get the content of a raw dump by ID."""
        resp = (
            supabase.table("raw_dumps")
            .select("body_md")
            .eq("id", dump_id)
            .single()
            .execute()
        )

        if resp.data:
            return resp.data.get("body_md")
        return None
