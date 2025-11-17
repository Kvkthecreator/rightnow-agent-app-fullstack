"""
YARNNN Agent Framework - Internalized Claude Agent SDK

This is an internalized version of the Claude Agent SDK scaffolding,
customized for YARNNN's work-platform. Provides agent archetypes,
session management, and provider interfaces.

Originally based on: https://github.com/Kvkthecreator/claude-agentsdk-opensource
Now maintained as part of work-platform backend.

Key Components:
- BaseAgent: Foundation for all agent types
- ResearchAgent, ContentCreatorAgent, ReportingAgent: Production-ready archetypes
- MemoryProvider, GovernanceProvider: Pluggable backend interfaces
- AgentSession: Session and state management
- SubagentRegistry: Subagent orchestration support
"""

from .interfaces import (
    MemoryProvider,
    GovernanceProvider,
    TaskProvider,
    Context,
    AgentState,
    StepContext,
    StepResult,
    InterruptDecision,
    Change,
)
from .base import BaseAgent
from .session import AgentSession
from .subagents import SubagentDefinition, SubagentRegistry
from .archetypes import ResearchAgent, ContentCreatorAgent, ReportingAgent
from .tools import (
    EMIT_WORK_OUTPUT_TOOL,
    parse_work_outputs_from_response,
    WorkOutput,
)

__version__ = "1.0.0"  # Internal version, post-internalization

__all__ = [
    # Core
    "BaseAgent",
    "AgentSession",
    # Providers
    "MemoryProvider",
    "GovernanceProvider",
    "TaskProvider",
    "Context",
    # State
    "AgentState",
    "StepContext",
    "StepResult",
    "InterruptDecision",
    "Change",
    # Subagents
    "SubagentDefinition",
    "SubagentRegistry",
    # Archetypes
    "ResearchAgent",
    "ContentCreatorAgent",
    "ReportingAgent",
    # Tools (Work Output Lifecycle)
    "EMIT_WORK_OUTPUT_TOOL",
    "parse_work_outputs_from_response",
    "WorkOutput",
]
