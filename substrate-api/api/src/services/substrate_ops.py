# ruff: noqa
"""Simple substrate operations for manager use.

⚠️ DEPRECATED: This module bypasses substrate governance (proposals).

ALL substrate mutations should go through the proposal system:
- Use governance_processor.py to create proposals
- Let P1 governance validate and create blocks
- Ensure semantic deduplication and quality checks

This module is kept for legacy compatibility but should NOT be used
for new features.

See: docs/architecture/GOVERNANCE_SEPARATION_REFACTOR_PLAN.md
"""

import logging
import warnings
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from infra.utils.db import as_json
from infra.utils.supabase_client import supabase_client as supabase

logger = logging.getLogger("uvicorn.error")


class SubstrateOps:
    """
    ⚠️ DEPRECATED: Simplified substrate operations for creating and updating entities.

    WARNING: This class bypasses substrate governance (proposals) and should
    NOT be used. All block creation must go through proposals.

    For new features, use:
    - app.agents.pipeline.governance_processor.GovernanceDumpProcessor
    """

    @staticmethod
    async def create_context_block(
        basket_id: str,
        content: str,
        source_id: str,
        workspace_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, int]:
        """
        ⚠️ DEPRECATED: Create a context block from raw dump content.

        WARNING: This method bypasses substrate governance (proposals).

        DO NOT USE for new features. Instead:
        1. Create proposal via governance_processor.py
        2. Let P1 validate and create blocks
        3. Ensure semantic deduplication

        Returns (block_id, version).
        """
        warnings.warn(
            "SubstrateOps.create_context_block is deprecated and bypasses governance. "
            "Use governance_processor.py to create proposals instead.",
            DeprecationWarning,
            stacklevel=2
        )
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
            # V3.0: No context_items table (merged into blocks)
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
