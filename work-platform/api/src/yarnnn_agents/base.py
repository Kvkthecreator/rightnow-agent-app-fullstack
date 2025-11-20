"""
DEPRECATED: BaseAgent - Legacy stub for Content/Reporting agents

This is a STUB to keep Content and Reporting agents working until they're migrated to SDK.
DO NOT use BaseAgent for new agents. Use official Claude Agent SDK instead.

All new agents should use:
- claude_agent_sdk.ClaudeSDKClient
- claude_agent_sdk.ClaudeAgentOptions

See thinking_partner_sdk.py and research_agent_sdk.py for examples.
"""

import logging
from typing import Any, Dict, List, Optional
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class BaseAgent:
    """
    DEPRECATED: Legacy base agent using AsyncAnthropic directly.

    Content and Reporting agents still use this temporarily.
    Will be deleted once they're migrated to official Claude Agent SDK.
    """

    def __init__(
        self,
        agent_type: str,
        agent_name: str,
        memory=None,
        governance=None,
        tasks=None,
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5",
    ):
        """Initialize legacy BaseAgent."""
        self.agent_type = agent_type
        self.agent_name = agent_name
        self.memory = memory
        self.governance = governance
        self.tasks = tasks
        self.model = model

        # Create AsyncAnthropic client
        self.claude = AsyncAnthropic(api_key=anthropic_api_key)

        # Placeholder for subagents
        from .subagents import SubagentRegistry
        self.subagents = SubagentRegistry()

        logger.warning(
            f"BaseAgent is DEPRECATED. {agent_name} should be migrated to Claude Agent SDK. "
            "See thinking_partner_sdk.py for migration pattern."
        )

    async def reason(
        self,
        task: str,
        context: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        max_tokens: int = 4096,
        **kwargs
    ) -> Any:
        """
        Execute reasoning with Claude using AsyncAnthropic.

        This is the core method that Content/Reporting agents use.
        Returns raw Anthropic API response.
        """
        messages = []

        # Build user message
        user_content = task
        if context:
            user_content = f"{context}\n\n{task}"

        messages.append({
            "role": "user",
            "content": user_content
        })

        # Build request
        request_params = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "system": self._get_default_system_prompt(),
        }

        if tools:
            request_params["tools"] = tools

        # Call Claude
        response = await self.claude.messages.create(**request_params)

        return response

    def _get_default_system_prompt(self) -> str:
        """Override this in subclasses."""
        return "You are a helpful AI assistant."
