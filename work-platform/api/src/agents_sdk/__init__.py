"""
Claude Agent SDK integration for YARNNN (Phase 2a).

Provides SDK-based implementations of YARNNN agents.
Drop-in replacements for yarnnn_agents classes.

Migration Status:
- ResearchAgentSDK: ✅ Implemented (Phase 2a)
- ContentAgent: ⏳ Planned (Phase 3)
- ReportingAgent: ⏳ Planned (Phase 3)

Usage:
    from agents_sdk import ResearchAgentSDK

    agent = ResearchAgentSDK(
        basket_id="uuid",
        work_session_id="uuid",
    )

    result = await agent.deep_dive("Research task")
"""

from .research_agent import (
    ResearchAgentSDK,
    create_research_agent_options,
    # Expose prompts for testing/inspection
    RESEARCH_AGENT_SYSTEM_PROMPT,
    WEB_MONITOR_PROMPT,
    COMPETITOR_TRACKER_PROMPT,
    SOCIAL_LISTENER_PROMPT,
    ANALYST_PROMPT,
)

__all__ = [
    "ResearchAgentSDK",
    "create_research_agent_options",
    "RESEARCH_AGENT_SYSTEM_PROMPT",
    "WEB_MONITOR_PROMPT",
    "COMPETITOR_TRACKER_PROMPT",
    "SOCIAL_LISTENER_PROMPT",
    "ANALYST_PROMPT",
]

__version__ = "2.0.0-sdk"  # SDK-based version
