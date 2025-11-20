"""
DEPRECATED: Subagents - Legacy stub for Content/Reporting agents

This is a STUB to keep Content and Reporting agents working until they're migrated to SDK.
DO NOT use SubagentDefinition for new agents.

Official Claude Agent SDK has native subagent support via ClaudeAgentOptions.agents parameter.
See: https://platform.claude.com/docs/en/agent-sdk/subagents
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class SubagentDefinition:
    """
    DEPRECATED: Legacy subagent definition.

    Content and Reporting agents use this temporarily.
    Will be deleted once they're migrated to official Claude Agent SDK.
    """
    name: str
    description: str
    system_prompt: str
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        logger.warning(
            f"SubagentDefinition is DEPRECATED. Subagent '{self.name}' should use "
            "Claude Agent SDK native subagents instead. "
            "See: https://platform.claude.com/docs/en/agent-sdk/subagents"
        )


class SubagentRegistry:
    """
    DEPRECATED: Legacy subagent registry.

    Placeholder implementation to keep Content/Reporting agents working.
    """

    def __init__(self):
        self._subagents: Dict[str, SubagentDefinition] = {}
        logger.debug("SubagentRegistry (DEPRECATED) initialized")

    def register(self, subagent: SubagentDefinition) -> None:
        """Register a subagent (legacy)."""
        self._subagents[subagent.name] = subagent
        logger.debug(f"Registered subagent: {subagent.name} (DEPRECATED)")

    def list_subagents(self) -> List[str]:
        """List registered subagent names."""
        return list(self._subagents.keys())

    def get_delegation_prompt(self) -> str:
        """Get delegation instructions for system prompt."""
        if not self._subagents:
            return ""

        prompt = "\n**Subagent Delegation:**\n"
        prompt += "You can delegate work to these specialized subagents:\n\n"

        for name, subagent in self._subagents.items():
            prompt += f"- **{name}**: {subagent.description}\n"

        return prompt
