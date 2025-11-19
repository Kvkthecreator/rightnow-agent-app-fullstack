"""
Agent SDK - Internalized Claude Agent SDK for YARNNN

Phase 2c: All agents refactored to SDK patterns with BFF integration.

This package contains SDK-based agents that use:
- SubstrateMemoryAdapter (BFF pattern, not YarnnnMemory)
- Skills loaded from .claude/skills/
- Prompts extracted to module-level constants
- BaseAgent from yarnnn_agents scaffold

Agents:
- ResearchAgentSDK: Research and monitoring agent (Phase 2a+2b)
- ContentAgentSDK: Content creation agent (Phase 2c)
- ReportingAgentSDK: Report generation agent (Phase 2c)
"""

from .research_agent import (
    ResearchAgentSDK,
    create_research_agent_sdk,
)

from .content_agent import (
    ContentAgentSDK,
    create_content_agent_sdk,
)

from .reporting_agent import (
    ReportingAgentSDK,
    create_reporting_agent_sdk,
)

__all__ = [
    # Research Agent
    "ResearchAgentSDK",
    "create_research_agent_sdk",
    # Content Agent
    "ContentAgentSDK",
    "create_content_agent_sdk",
    # Reporting Agent
    "ReportingAgentSDK",
    "create_reporting_agent_sdk",
]

__version__ = "2.1.0-all-agents"
