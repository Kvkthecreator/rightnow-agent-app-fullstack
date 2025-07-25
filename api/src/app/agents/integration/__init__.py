"""Integration layer for connecting existing agents with substrate operations."""

from .agent_substrate_bridge import (
    AgentSubstrateBridge,
    agent_interpret_dump,
    agent_tag_context,
    agent_propose_block
)

__all__ = [
    "AgentSubstrateBridge",
    "agent_interpret_dump",
    "agent_tag_context", 
    "agent_propose_block"
]