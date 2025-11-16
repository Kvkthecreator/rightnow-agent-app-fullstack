"""
Mock Claude Agent SDK - Placeholder for actual SDK implementation.

Phase 2: This mock defines the expected contract between our adapters
and the SDK. When the real SDK is available, this module will be replaced.

Key insight: We don't know the exact SDK output structure, so this mock
defines what we EXPECT based on our architecture design. The actual SDK
may differ, requiring adjustments to work_session_executor.py.
"""

from .interfaces import MemoryProvider, Context, GovernanceProvider
from .archetypes import ResearchAgent, ContentCreatorAgent, ReportingAgent

__all__ = [
    "MemoryProvider",
    "Context",
    "GovernanceProvider",
    "ResearchAgent",
    "ContentCreatorAgent",
    "ReportingAgent",
]
