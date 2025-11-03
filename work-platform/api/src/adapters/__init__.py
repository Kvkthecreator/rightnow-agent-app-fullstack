"""
Adapter layer for Claude Agent SDK integration.

Phase 4: Bridges SDK interfaces to Phase 1-3 architecture (BFF pattern).

Adapters translate SDK provider interfaces → substrate_client HTTP calls.
"""

from .memory_adapter import SubstrateMemoryAdapter
from .governance_adapter import SubstrateGovernanceAdapter
from .auth_adapter import AuthAdapter

__all__ = [
    "SubstrateMemoryAdapter",
    "SubstrateGovernanceAdapter",
    "AuthAdapter",
]
