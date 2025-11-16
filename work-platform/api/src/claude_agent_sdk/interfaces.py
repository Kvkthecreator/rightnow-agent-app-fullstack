"""
SDK Interface Definitions.

These interfaces define what our adapters must implement to work with
the Claude Agent SDK. This is the contract.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Context:
    """Context item returned from memory queries."""
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class MemoryProvider:
    """
    Interface for memory/context provisioning.

    Our SubstrateMemoryAdapter implements this interface.
    """

    async def query(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 20
    ) -> List[Context]:
        """Query memory for relevant context."""
        raise NotImplementedError

    async def store(self, context: Context) -> str:
        """Store new context and return ID."""
        raise NotImplementedError

    async def get_all(
        self,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Context]:
        """Get all context items."""
        raise NotImplementedError


class GovernanceProvider:
    """
    Interface for governance operations.

    NOTE: We intentionally set this to None for agent execution.
    Governance happens AFTER work approval, not during agent execution.
    """

    async def propose(self, data: Dict[str, Any]) -> str:
        """Create a governance proposal."""
        raise NotImplementedError

    async def vote(self, proposal_id: str, vote: str) -> bool:
        """Vote on a proposal."""
        raise NotImplementedError
