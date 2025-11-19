"""
Content Agent SDK - Internalized for YARNNN BFF Architecture

Phase 2c: Content creation agent using SDK patterns with SubstrateMemoryAdapter.

Differences from archetype:
- Uses SubstrateMemoryAdapter (BFF pattern) instead of YarnnnMemory
- Simplified to core create() method (no repurposing yet)
- Prompts extracted to module-level constants (reusable for Skills)
- Auto-creates memory adapter if not provided
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Literal, Union
from uuid import UUID

from yarnnn_agents.base import BaseAgent
from yarnnn_agents.subagents import SubagentDefinition
from yarnnn_agents.tools import EMIT_WORK_OUTPUT_TOOL, parse_work_outputs_from_response

# Memory adapter for BFF-to-substrate integration
from adapters.memory_adapter import SubstrateMemoryAdapter

logger = logging.getLogger(__name__)


# ============================================================================
# PROMPTS (Module-level constants for Skills extraction in future)
# ============================================================================

CONTENT_AGENT_SYSTEM_PROMPT = """You are a professional content creator specializing in multi-platform content.

Your core capabilities:
- Create platform-optimized content (Twitter, LinkedIn, Blog, Instagram)
- Maintain consistent brand voice across all platforms
- Adapt tone and format for each platform's best practices
- Generate engaging, actionable content

Platform Guidelines:
- **Twitter**: Concise (280 chars), punchy, conversational, hashtags sparingly
- **LinkedIn**: Professional tone, insights-driven, 1-3 paragraphs, industry focus
- **Blog**: Long-form (800-2000 words), structured with headers, SEO-friendly
- **Instagram**: Visual-first, caption storytelling, emojis OK, call-to-action

Brand Voice Modes:
- **adaptive**: Learn from substrate content, adapt to platform
- **strict**: Rigidly follow existing brand voice patterns
- **creative**: More experimental, test new approaches

Quality Standards:
- Clear, actionable takeaways
- Authentic voice (not generic AI)
- Platform-appropriate formatting
- Engaging hooks and CTAs

You have access to the substrate (brand voice examples, content history) via memory.
Use emit_work_output to save created content for approval.
"""

CONTENT_CREATION_USER_PROMPT_TEMPLATE = """Create {content_type} content for {platform}.

**Topic**: {topic}

**Requirements**:
{requirements}

**Brand Voice Mode**: {brand_voice_mode}
**Voice Temperature**: {voice_temperature}

**Instructions**:
1. Query substrate for brand voice examples and relevant content
2. Understand platform best practices
3. Create engaging content that matches brand voice
4. Emit work output with:
   - output_type: "content_draft"
   - title: Brief description of content
   - body: The actual content (formatted for platform)
   - confidence: How well this matches brand voice (0.0-1.0)
   - metadata: {{platform, content_type, topic}}
   - source_block_ids: IDs of brand voice examples used

Remember:
- Match the brand voice from substrate examples
- Optimize formatting for the target platform
- Include clear value/takeaway
- Make it engaging and authentic
"""


# ============================================================================
# ContentAgentSDK Class
# ============================================================================

class ContentAgentSDK(BaseAgent):
    """
    Content Agent using internalized SDK patterns.

    Simplified from archetype - focused on core create() method.
    Uses SubstrateMemoryAdapter for BFF-to-substrate communication.

    Usage:
        from agents_sdk import ContentAgentSDK

        agent = ContentAgentSDK(
            basket_id="brand_voice_basket",
            workspace_id="user_workspace",
            anthropic_api_key="sk-ant-...",
            enabled_platforms=["twitter", "linkedin"],
            brand_voice_mode="adaptive"
        )

        result = await agent.create(
            platform="twitter",
            topic="AI agent trends",
            content_type="thread"
        )
    """

    def __init__(
        self,
        # BFF context (REQUIRED for SubstrateMemoryAdapter)
        basket_id: Union[str, UUID],
        workspace_id: str,

        # Claude configuration
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5",

        # Platform configuration
        enabled_platforms: Optional[List[str]] = None,
        brand_voice_mode: Literal["adaptive", "strict", "creative"] = "adaptive",
        voice_temperature: float = 0.7,

        # Optional providers (can override auto-creation)
        memory: Optional[Any] = None,
        governance: Optional[Any] = None,
        tasks: Optional[Any] = None,

        # Knowledge modules (Phase 2d)
        knowledge_modules: str = "",
    ):
        """
        Initialize Content Agent SDK.

        Args:
            basket_id: Basket ID for brand voice context
            workspace_id: Workspace ID for authorization
            anthropic_api_key: Anthropic API key (defaults to env var)
            model: Claude model to use
            enabled_platforms: Platforms to support (default: ["twitter", "linkedin", "blog"])
            brand_voice_mode: Voice learning approach
            voice_temperature: Creative temperature (0.0-1.0)
            memory: Memory provider (auto-creates SubstrateMemoryAdapter if None)
            governance: Governance provider (optional)
            tasks: Task provider (optional)
            knowledge_modules: Knowledge modules (procedural knowledge) loaded from orchestration layer
        """
        # Store configuration
        self.basket_id = str(basket_id)
        self.workspace_id = workspace_id
        self.enabled_platforms = enabled_platforms or ["twitter", "linkedin", "blog"]
        self.brand_voice_mode = brand_voice_mode
        self.voice_temperature = voice_temperature
        self.knowledge_modules = knowledge_modules

        # Get Anthropic API key
        if not anthropic_api_key:
            anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY must be provided or set in environment"
                )

        # Create memory adapter using BFF pattern (substrate-API via SubstrateClient)
        # Uses SUBSTRATE_SERVICE_SECRET (not YARNNN_API_KEY)
        if memory is None:
            memory_adapter = SubstrateMemoryAdapter(
                basket_id=basket_id,
                workspace_id=workspace_id
            )
            logger.info(f"Created SubstrateMemoryAdapter for basket={basket_id}")
        else:
            memory_adapter = memory

        # Build system prompt with Knowledge Modules (Phase 2d)
        system_prompt = CONTENT_AGENT_SYSTEM_PROMPT
        if self.knowledge_modules:
            system_prompt += f"\n\n# 📚 YARNNN Knowledge Modules (Procedural Knowledge)\n\n"
            system_prompt += self.knowledge_modules

        # Initialize BaseAgent with substrate memory adapter
        super().__init__(
            agent_type="content",
            agent_name="Content Agent SDK",
            memory=memory_adapter,
            governance=governance,
            tasks=tasks,
            anthropic_api_key=anthropic_api_key,
            model=model,
            system_prompt=system_prompt,
            tools=[EMIT_WORK_OUTPUT_TOOL],
        )

        logger.info(
            f"ContentAgentSDK initialized - Platforms: {', '.join(self.enabled_platforms)}, "
            f"Voice mode: {brand_voice_mode}"
        )

    async def execute(self, task: str) -> Dict[str, Any]:
        """
        Execute content creation task (BaseAgent abstract method).

        Routes to create() for content creation tasks.

        Args:
            task: Task description (parsed for platform, topic, content_type)

        Returns:
            Result dictionary with created content
        """
        # Simple task parsing (can be improved)
        # Expected format: "Create <content_type> for <platform> about <topic>"

        # Default to blog post on linkedin if parsing fails
        platform = "linkedin"
        content_type = "post"
        topic = task

        # Try to parse platform from task
        for p in self.enabled_platforms:
            if p.lower() in task.lower():
                platform = p
                break

        # Try to parse content type
        if "thread" in task.lower():
            content_type = "thread"
        elif "post" in task.lower():
            content_type = "post"
        elif "article" in task.lower() or "blog" in task.lower():
            content_type = "article"

        # Execute content creation
        return await self.create(
            platform=platform,
            topic=topic,
            content_type=content_type
        )

    async def create(
        self,
        platform: str,
        topic: str,
        content_type: str = "post",
        requirements: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create platform-specific content.

        Args:
            platform: Target platform (twitter, linkedin, blog, instagram)
            topic: Content topic
            content_type: Type of content (post, thread, article)
            requirements: Additional requirements (optional)

        Returns:
            Result dictionary with:
            - content: Created content
            - work_outputs: Work outputs emitted
            - substrate_context: Substrate blocks used
        """
        if platform not in self.enabled_platforms:
            raise ValueError(
                f"Platform '{platform}' not enabled. "
                f"Enabled: {', '.join(self.enabled_platforms)}"
            )

        logger.info(
            f"Creating {content_type} for {platform} - Topic: {topic}"
        )

        # Build user prompt
        user_prompt = CONTENT_CREATION_USER_PROMPT_TEMPLATE.format(
            content_type=content_type,
            platform=platform,
            topic=topic,
            requirements=requirements or "Standard quality and engagement",
            brand_voice_mode=self.brand_voice_mode,
            voice_temperature=self.voice_temperature
        )

        # Execute with Claude (BaseAgent handles memory context injection)
        response = await self.execute_with_context(user_prompt)

        # Parse work outputs from response
        work_outputs = parse_work_outputs_from_response(response)

        logger.info(
            f"Content created - {len(work_outputs)} work outputs emitted"
        )

        return {
            "content": response.content[0].text if response.content else "",
            "work_outputs": [wo.model_dump() for wo in work_outputs],
            "platform": platform,
            "topic": topic,
            "content_type": content_type,
        }


# ============================================================================
# Factory Function (backward compatibility)
# ============================================================================

def create_content_agent_sdk(
    basket_id: Union[str, UUID],
    workspace_id: str,
    anthropic_api_key: Optional[str] = None,
    **kwargs
) -> ContentAgentSDK:
    """
    Factory function to create ContentAgentSDK.

    Provides backward compatibility with existing factory pattern.
    """
    return ContentAgentSDK(
        basket_id=basket_id,
        workspace_id=workspace_id,
        anthropic_api_key=anthropic_api_key,
        **kwargs
    )
