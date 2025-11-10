"""
Memory adapter: SDK MemoryProvider → substrate_client (Phase 3 BFF pattern).

This adapter makes the Claude Agent SDK's MemoryProvider interface compatible
with our substrate_client HTTP client, preserving the BFF architecture.

Architecture flow:
SDK agents → SubstrateMemoryAdapter → substrate_client → substrate-api
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

# Import SDK interfaces
try:
    from claude_agent_sdk.interfaces import MemoryProvider, Context
except ImportError:
    # Fallback if SDK not installed yet
    class MemoryProvider:
        pass

    class Context:
        def __init__(self, content: str, metadata: Optional[Dict[str, Any]] = None):
            self.content = content
            self.metadata = metadata or {}

# Import our Phase 3 substrate_client
from clients.substrate_client import get_substrate_client

logger = logging.getLogger(__name__)


class SubstrateMemoryAdapter(MemoryProvider):
    """
    Adapter that implements SDK's MemoryProvider interface using substrate_client.

    All substrate operations go through HTTP (Phase 3 BFF pattern):
    - Query → get_basket_blocks()
    - Store → create_dump()
    - Get all → get_basket_blocks(limit=large)

    This ensures:
    - Zero direct database access in work-platform ✅
    - Circuit breaker and retry logic preserved ✅
    - Service-to-service auth respected ✅
    """

    def __init__(self, basket_id: str | UUID, workspace_id: str):
        """
        Initialize memory adapter.

        Args:
            basket_id: Basket ID to operate on
            workspace_id: Workspace ID for authorization context
        """
        self.basket_id = str(basket_id)
        self.workspace_id = workspace_id
        self.client = get_substrate_client()
        logger.info(f"Initialized SubstrateMemoryAdapter for basket {self.basket_id} in workspace {self.workspace_id}")

    async def query(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 20
    ) -> List[Context]:
        """
        Query substrate for relevant context via HTTP.

        Args:
            query: Semantic query string (currently unused - TODO: add semantic search)
            filters: Optional filters (states, semantic_type, etc.)
            limit: Maximum results to return

        Returns:
            List of Context items from substrate blocks
        """
        logger.info(f"Querying substrate memory: query='{query[:50]}...', limit={limit}")

        try:
            # Extract filter parameters
            states = filters.get("states") if filters else None
            if not states:
                # Default to mature blocks
                states = ["ACCEPTED", "LOCKED"]

            # Call substrate-api via HTTP (Phase 3 BFF)
            blocks = self.client.get_basket_blocks(
                basket_id=self.basket_id,
                states=states,
                limit=limit
            )

            # Convert substrate blocks to SDK Context format
            contexts = [self._block_to_context(block) for block in blocks]

            logger.debug(f"Retrieved {len(contexts)} context items from substrate")
            return contexts

        except Exception as e:
            # Graceful degradation: substrate-api not available
            # Return empty context so agent can still execute
            logger.warning(
                f"Substrate-api unavailable, returning empty context. "
                f"Agent will execute without substrate context. Error: {str(e)}"
            )
            return []

    async def store(self, context: Context) -> str:
        """
        Store context in substrate via HTTP.

        Args:
            context: Context object to store

        Returns:
            ID of created dump/block
        """
        logger.info("Storing context in substrate memory")

        # Call substrate-api via HTTP (Phase 3 BFF)
        result = self.client.create_dump(
            basket_id=self.basket_id,
            content=context.content,
            metadata=context.metadata or {}
        )

        dump_id = result.get("id") or result.get("dump_id")
        logger.debug(f"Stored context as dump {dump_id}")

        return dump_id

    async def get_all(
        self,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Context]:
        """
        Get all context items from substrate.

        Args:
            filters: Optional filters

        Returns:
            List of all Context items
        """
        logger.info("Retrieving all context items from substrate")

        # Use query with large limit
        return await self.query("", filters=filters, limit=10000)

    def _block_to_context(self, block: dict) -> Context:
        """
        Convert substrate block to SDK Context format.

        Args:
            block: Substrate block dictionary

        Returns:
            Context object
        """
        # Format block content for agent consumption
        title = block.get("title", "")
        body = block.get("body", "")
        content = f"{title}\n\n{body}".strip() if title else body

        # Preserve substrate metadata
        metadata = {
            "id": block.get("id"),
            "block_id": block.get("id"),
            "semantic_type": block.get("semantic_type"),
            "state": block.get("state"),
            "anchor_role": block.get("anchor_role"),
            "confidence": block.get("confidence"),
            "created_at": block.get("created_at"),
        }

        return Context(content=content, metadata=metadata)

    def _context_to_block_data(self, context: Context) -> dict:
        """
        Convert SDK Context to substrate block creation data.

        Args:
            context: Context object

        Returns:
            Dictionary for block creation
        """
        # Extract title from content (first line if multi-line)
        lines = context.content.split("\n", 1)
        title = lines[0][:200] if lines else "Agent Finding"
        body = lines[1] if len(lines) > 1 else context.content

        return {
            "title": title,
            "body": body,
            "semantic_type": context.metadata.get("semantic_type", "knowledge"),
            "state": context.metadata.get("state", "mature"),
            "confidence": context.metadata.get("confidence", 0.7),
        }
