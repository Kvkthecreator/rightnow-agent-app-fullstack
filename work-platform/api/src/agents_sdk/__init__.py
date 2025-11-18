"""
Agent SDK - Improved Implementations (Phase 2a Refactoring)

This package contains REFACTORED agent implementations using cleaner SDK patterns.
NOT a migration - yarnnn_agents IS already SDK-based (internalized).

Key Improvements:
- Prompts extracted to module-level constants (reusable for Skills Phase 2b)
- Better separation of concerns (config vs execution)
- Cleaner tool-use pattern handling
- Skills-ready architecture

Migration Status:
- ResearchAgentSDK: ✅ Implemented (Phase 2a)
- ContentAgent: ⏳ Planned (Future)
- ReportingAgent: ⏳ Planned (Future)

Usage:
    from agents_sdk import ResearchAgentSDK

    agent = ResearchAgentSDK(
        basket_id="uuid",
        workspace_id="uuid",
        work_session_id="uuid",
    )

    result = await agent.deep_dive("Research task")
"""

from .research_agent import (
    ResearchAgentSDK,
    create_research_agent_sdk,
    # Expose prompts for testing/inspection/Skills
    RESEARCH_AGENT_SYSTEM_PROMPT,
    WEB_MONITOR_PROMPT,
    COMPETITOR_TRACKER_PROMPT,
    SOCIAL_LISTENER_PROMPT,
    ANALYST_PROMPT,
)

__all__ = [
    "ResearchAgentSDK",
    "create_research_agent_sdk",
    "RESEARCH_AGENT_SYSTEM_PROMPT",
    "WEB_MONITOR_PROMPT",
    "COMPETITOR_TRACKER_PROMPT",
    "SOCIAL_LISTENER_PROMPT",
    "ANALYST_PROMPT",
]

__version__ = "2.0.0-refactored"  # Refactored version
