"""
Agent orchestration layer for work-platform.

Phase 4: Integrates Claude Agent SDK with Phase 1-3 architecture via adapters.

This module provides:
- Agent factory (creates SDK agents with substrate adapters)
- Agent configurations (YAML-based)
- Work session orchestration
"""

from .factory import (
    create_research_agent,
    create_content_agent,
    create_reporting_agent,
    load_agent_config,
)

__all__ = [
    "create_research_agent",
    "create_content_agent",
    "create_reporting_agent",
    "load_agent_config",
]
