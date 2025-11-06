"""Substrate API HTTP client for work platform.

Phase 1 Scope: READ-ONLY operations
- Fetch basket blocks (for context assembly)
- Fetch basket metadata

Future: Write operations for artifact application (Phase 2+)
"""

import os
from typing import Dict, List, Optional, Any
from uuid import UUID

import httpx
from pydantic import BaseModel


class SubstrateBlock(BaseModel):
    """Substrate block model (simplified for Phase 1)."""

    id: UUID
    basket_id: UUID
    content: str
    block_type: str
    state: str
    created_at: str
    metadata: Dict[str, Any] = {}


class SubstrateBasket(BaseModel):
    """Substrate basket model (simplified for Phase 1)."""

    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    created_at: str


class SubstrateClientError(Exception):
    """Base exception for substrate client errors."""

    pass


class SubstrateClient:
    """HTTP client for substrate-api read-only operations.

    Phase 1: Only implements context fetching (basket blocks).
    Phase 2+: Will add artifact submission to proposals.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        """Initialize substrate client.

        Args:
            base_url: Substrate API base URL (defaults to env var SUBSTRATE_API_URL)
            api_key: API key for authentication (defaults to env var SUBSTRATE_API_KEY)
        """
        self.base_url = base_url or os.getenv(
            "SUBSTRATE_API_URL", "http://localhost:8001"
        )
        self.api_key = api_key or os.getenv("SUBSTRATE_API_KEY", "")

        # Remove trailing slash
        if self.base_url.endswith("/"):
            self.base_url = self.base_url[:-1]

        # Create httpx client with timeout
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers=self._get_headers() if self.api_key else {},
        )

    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for requests."""
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def close(self):
        """Close HTTP client connection."""
        await self.client.aclose()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    # ========================================================================
    # READ Operations (Phase 1)
    # ========================================================================

    async def get_basket(self, basket_id: UUID) -> SubstrateBasket:
        """Fetch basket metadata.

        Args:
            basket_id: Basket UUID

        Returns:
            Basket metadata

        Raises:
            SubstrateClientError: If request fails
        """
        url = f"{self.base_url}/api/baskets/{basket_id}"

        try:
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            return SubstrateBasket(**data)

        except httpx.HTTPStatusError as e:
            raise SubstrateClientError(
                f"Failed to fetch basket {basket_id}: {e.response.status_code} {e.response.text}"
            ) from e
        except Exception as e:
            raise SubstrateClientError(
                f"Failed to fetch basket {basket_id}: {str(e)}"
            ) from e

    async def get_basket_blocks(
        self,
        basket_id: UUID,
        state: Optional[str] = None,
        block_type: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[SubstrateBlock]:
        """Fetch blocks for a basket.

        Args:
            basket_id: Basket UUID
            state: Filter by block state (e.g., 'ACCEPTED')
            block_type: Filter by block type (e.g., 'insight', 'document')
            limit: Maximum number of blocks to fetch

        Returns:
            List of substrate blocks

        Raises:
            SubstrateClientError: If request fails
        """
        url = f"{self.base_url}/api/baskets/{basket_id}/blocks"

        # Build query parameters
        params = {}
        if state:
            params["state"] = state
        if block_type:
            params["block_type"] = block_type
        if limit:
            params["limit"] = limit

        try:
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Handle both list and dict responses
            if isinstance(data, list):
                blocks_data = data
            elif isinstance(data, dict) and "blocks" in data:
                blocks_data = data["blocks"]
            else:
                raise SubstrateClientError(
                    f"Unexpected response format: {type(data)}"
                )

            return [SubstrateBlock(**block) for block in blocks_data]

        except httpx.HTTPStatusError as e:
            raise SubstrateClientError(
                f"Failed to fetch blocks for basket {basket_id}: "
                f"{e.response.status_code} {e.response.text}"
            ) from e
        except Exception as e:
            raise SubstrateClientError(
                f"Failed to fetch blocks for basket {basket_id}: {str(e)}"
            ) from e

    async def assemble_basket_context(
        self,
        basket_id: UUID,
        include_states: Optional[List[str]] = None,
        max_blocks: int = 100,
    ) -> str:
        """Assemble basket blocks into a single context string for agent consumption.

        This is the primary method used by work session executor to get context.

        Args:
            basket_id: Basket UUID
            include_states: Block states to include (default: ['ACCEPTED'])
            max_blocks: Maximum number of blocks to include (default: 100)

        Returns:
            Formatted context string ready for agent consumption

        Raises:
            SubstrateClientError: If request fails
        """
        # Default to only accepted blocks
        if include_states is None:
            include_states = ["ACCEPTED"]

        # Fetch basket metadata
        basket = await self.get_basket(basket_id)

        # Fetch blocks for each state
        all_blocks = []
        for state in include_states:
            blocks = await self.get_basket_blocks(
                basket_id, state=state, limit=max_blocks
            )
            all_blocks.extend(blocks)

        # Sort by created_at (oldest first)
        all_blocks.sort(key=lambda b: b.created_at)

        # Assemble context
        context_parts = [
            f"# Basket: {basket.name}",
            f"Basket ID: {basket.id}",
        ]

        if basket.description:
            context_parts.append(f"Description: {basket.description}")

        context_parts.append(f"\n## Context Blocks ({len(all_blocks)} blocks)\n")

        for i, block in enumerate(all_blocks[:max_blocks], 1):
            context_parts.append(f"### Block {i} ({block.block_type})")
            context_parts.append(block.content)
            context_parts.append("")  # Empty line between blocks

        return "\n".join(context_parts)

    # ========================================================================
    # WRITE Operations (Phase 2+ - Not Yet Implemented)
    # ========================================================================

    async def submit_artifact_to_proposals(
        self, basket_id: UUID, artifact_content: str, artifact_type: str
    ):
        """Submit work artifact to substrate governance (P1 proposals).

        NOT IMPLEMENTED - Phase 2+

        This will submit artifacts through proper P1 governance flow:
        1. Create proposal with artifact content
        2. Wait for user approval
        3. Apply to substrate on approval

        Args:
            basket_id: Target basket
            artifact_content: Artifact content to submit
            artifact_type: Type of artifact

        Raises:
            NotImplementedError: This is Phase 2+ functionality
        """
        raise NotImplementedError(
            "Artifact submission to substrate governance is not yet implemented. "
            "This is Phase 2+ functionality. "
            "See: docs/architecture/GOVERNANCE_SEPARATION_REFACTOR_PLAN.md"
        )


# ============================================================================
# Helper Functions
# ============================================================================


async def get_basket_context_for_session(
    basket_id: UUID,
    substrate_client: Optional[SubstrateClient] = None,
) -> str:
    """Get formatted basket context for a work session.

    Helper function that creates a client if needed and fetches context.

    Args:
        basket_id: Basket UUID
        substrate_client: Optional existing client (reuse connection)

    Returns:
        Formatted context string

    Raises:
        SubstrateClientError: If request fails
    """
    if substrate_client:
        return await substrate_client.assemble_basket_context(basket_id)

    # Create temporary client
    async with SubstrateClient() as client:
        return await client.assemble_basket_context(basket_id)
