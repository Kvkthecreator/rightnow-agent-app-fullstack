"""
YARNNN Agent Framework - Minimal Support for Claude Agent SDK

Provides essential utilities for agents using the official Claude Agent SDK:
- AgentSession: Session and work ticket tracking
- MemoryProvider, GovernanceProvider, TaskProvider: Interface definitions
- EMIT_WORK_OUTPUT_TOOL: Tool for structured outputs
- WorkOutput: Data model for agent deliverables

All production agents now use official Claude Agent SDK (claude-agent-sdk>=0.1.8)
This package provides supporting infrastructure only.
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
from .session import AgentSession
from .tools import (
    EMIT_WORK_OUTPUT_TOOL,
    parse_work_outputs_from_response,
    WorkOutput,
)

__version__ = "2.0.0"  # Official Claude SDK era

__all__ = [
    # Session Management
    "AgentSession",
    # Provider Interfaces
    "MemoryProvider",
    "GovernanceProvider",
    "TaskProvider",
    "Context",
    # State Types
    "AgentState",
    "StepContext",
    "StepResult",
    "InterruptDecision",
    "Change",
    # Tools (Work Output Lifecycle)
    "EMIT_WORK_OUTPUT_TOOL",
    "parse_work_outputs_from_response",
    "WorkOutput",
]
