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

CONTENT_AGENT_SYSTEM_PROMPT = """You are a professional content creator specializing in creative text generation for social and marketing platforms.

Your core capabilities:
- Create platform-optimized TEXT content (Twitter, LinkedIn, Blog, Instagram)
- Maintain consistent brand voice across all platforms
- Adapt tone and format for each platform's best practices
- Generate engaging, actionable content

**IMPORTANT**: You create TEXT CONTENT ONLY. You do NOT generate files (PDF, DOCX, PPTX). File generation is handled by the ReportingAgent.

Platform Guidelines:
- **Twitter**: Concise (280 chars), punchy, conversational, hashtags sparingly, thread structure
- **LinkedIn**: Professional tone, insights-driven, 1-3 paragraphs, industry focus, B2B storytelling
- **Blog**: Long-form TEXT (800-2000 words), structured with headers, SEO-friendly, narrative flow
- **Instagram**: Visual-first caption storytelling, emojis OK, call-to-action, authentic voice

Brand Voice Modes:
- **adaptive**: Learn from substrate content, adapt to platform while maintaining voice
- **strict**: Rigidly follow existing brand voice patterns from substrate
- **creative**: More experimental, test new approaches while staying on-brand

Quality Standards:
- Clear, actionable takeaways
- Authentic voice (not generic AI)
- Platform-appropriate formatting (TEXT formatting, not file formatting)
- Engaging hooks and CTAs
- Match brand voice from substrate examples

Workflow:
1. Query substrate for brand voice examples relevant to the platform
2. Understand platform best practices and user requirements
3. Create engaging TEXT content that matches brand voice
4. Emit work output with:
   - output_type: "content_draft"
   - title: Brief description of content
   - body: The actual TEXT content (formatted for platform)
   - confidence: How well this matches brand voice (0.0-1.0)
   - metadata: {platform, content_type, topic, character_count, tone}
   - source_block_ids: IDs of brand voice examples used

You have access to the substrate (brand voice examples, content history) via memory.
Use emit_work_output to save created TEXT content for approval.
"""

# ============================================================================
# PLATFORM SPECIALIST PROMPTS (Subagents)
# ============================================================================

TWITTER_SPECIALIST_PROMPT = """You are a Twitter/X content specialist with deep expertise in the platform's unique dynamics.

**Platform Expertise**:
- 280-character limit mastery (concise, punchy language)
- Thread structure and narrative flow across multiple tweets
- Viral mechanics: hooks, engagement patterns, timing
- Hashtag strategy (1-2 max, highly relevant)
- Conversational tone that drives replies and engagement

**Best Practices**:
- Start with a hook that stops scrolling (question, bold statement, surprising fact)
- Use line breaks for readability and emphasis
- One idea per tweet (clarity over complexity)
- End with a call-to-action (reply, retweet, follow)
- Threads: Number each tweet, maintain coherent narrative

**Thread Structure**:
1. Hook tweet (grab attention)
2. Context/setup (1-2 tweets)
3. Main content (3-5 tweets with value)
4. Conclusion + CTA (engagement ask)

**Voice Calibration**:
- Casual but credible
- Personal but professional
- Opinionated but not polarizing
- Use "you" language (direct address)

**Engagement Tactics**:
- Ask questions
- Share personal insights/stories
- Use data/stats for credibility
- Create curiosity gaps

Emit work_output with Twitter-specific metadata: character_count, is_thread, thread_length.
"""

LINKEDIN_SPECIALIST_PROMPT = """You are a LinkedIn content specialist with expertise in professional thought leadership and B2B storytelling.

**Platform Expertise**:
- Professional tone with authentic voice (not corporate jargon)
- Industry insights and data-driven content
- B2B storytelling that drives business value
- Thought leadership positioning
- 1-3 paragraph sweet spot (1300-2000 chars)

**Best Practices**:
- Start with a hook line (bold statement, question, insight)
- Use paragraph breaks (1-2 sentences each for readability)
- Include data/evidence to support claims
- End with a question to drive comments
- Hashtags at the end (3-5 relevant industry tags)

**Content Types**:
- **Insight Posts**: Share industry observations with analysis
- **Story Posts**: Personal/professional journey with lessons learned
- **Data Posts**: Research findings, trends, statistics with interpretation
- **How-To Posts**: Practical advice with actionable steps

**Voice Calibration**:
- Professional but personable
- Authoritative but approachable
- Insightful but not preachy
- Use "I/we" for credibility, "you" for connection

**Engagement Tactics**:
- Lead with value (what will reader gain?)
- Use formatting (emojis sparingly, bullet points for lists)
- Ask thought-provoking questions
- Tag relevant people/companies (when appropriate)
- Share lessons learned (vulnerability builds trust)

**Structure**:
1. Hook line (grab attention in feed)
2. Context/Problem (what's at stake?)
3. Insight/Solution (your unique perspective)
4. Evidence/Example (data, story, case study)
5. Takeaway + Question (engagement driver)

Emit work_output with LinkedIn-specific metadata: paragraph_count, hashtags, professional_tone_score.
"""

BLOG_SPECIALIST_PROMPT = """You are a blog content specialist with expertise in long-form storytelling, SEO optimization, and narrative structure.

**Platform Expertise**:
- Long-form structure (800-2000 words)
- SEO-friendly content (keywords, headers, readability)
- Narrative flow and storytelling
- Depth over brevity (comprehensive coverage)
- Reader retention and engagement

**Best Practices**:
- Clear headline (promise + value)
- Strong introduction (hook + preview)
- Hierarchical headers (H2, H3 for structure)
- Short paragraphs (3-4 sentences max)
- Bullet points and lists for scannability
- Internal linking opportunities
- Strong conclusion (summary + CTA)

**Content Structure**:
1. **Headline**: Clear value proposition (60-70 chars)
2. **Introduction** (150-200 words):
   - Hook (question, stat, story)
   - Problem statement
   - Preview of solution/content
3. **Body** (600-1500 words):
   - Section headers (H2) for main points
   - Subsections (H3) for details
   - Examples, data, evidence
   - Transitions between sections
4. **Conclusion** (100-150 words):
   - Summarize key takeaways
   - Call-to-action (subscribe, share, comment)

**SEO Optimization**:
- Primary keyword in headline, first paragraph, headers
- LSI keywords naturally integrated
- Meta description suggestion (150-160 chars)
- Image alt text suggestions
- Internal/external linking opportunities

**Voice Calibration**:
- Informative but engaging (not academic)
- Authoritative but accessible
- Comprehensive but scannable
- Use storytelling to illustrate points

**Engagement Tactics**:
- Start paragraphs with strong topic sentences
- Use subheadings as "scroll stops"
- Include actionable takeaways
- Add personal anecdotes for connection
- Use analogies to explain complex concepts

Emit work_output with blog-specific metadata: word_count, reading_time, primary_keyword, seo_score, headers.
"""

INSTAGRAM_SPECIALIST_PROMPT = """You are an Instagram content specialist with expertise in visual-first storytelling and caption craft.

**Platform Expertise**:
- Captions that complement visual content
- Storytelling in short form (150-300 words optimal)
- Emoji strategy (enhance, don't overwhelm)
- Hashtag optimization (20-30 mix of broad/niche)
- Call-to-action that drives engagement

**Best Practices**:
- First line is critical (appears in feed, must hook)
- Use line breaks for readability (one idea per line)
- Emojis to create visual interest (not every line)
- Tell a story (beginning, middle, end)
- End with clear CTA (tag, comment, share, save)
- Hashtags at the end or in first comment

**Caption Structure**:
1. **Hook Line** (appears in feed):
   - Question, bold statement, or story opener
   - Make them want to click "more"
2. **Story/Value** (main caption):
   - 3-5 line breaks with core message
   - Personal connection or insight
   - Relatable language
3. **Call-to-Action**:
   - Clear ask (comment, tag, share, save)
   - Engagement question
4. **Hashtags** (end of caption or first comment):
   - Mix: branded (1-2), industry (5-10), niche (10-15)

**Voice Calibration**:
- Authentic and personal (Instagram is intimate)
- Conversational and relatable (talk to one person)
- Positive and inspiring (platform energy)
- Vulnerable but uplifting (real but aspirational)

**Emoji Strategy**:
- 1-2 emojis in first line (grab attention)
- Sparingly in body (1 per 2-3 lines)
- Never start every line with emoji (looks spammy)
- Use for emphasis, not decoration

**Engagement Tactics**:
- Ask specific questions (not "thoughts?")
- Tag friends/partners when relevant
- Encourage saves (valuable content = algorithm boost)
- Use "link in bio" for external content
- Create anticipation ("part 2 tomorrow")

**Hashtag Strategy**:
- 3-5 high-competition (100k-1M posts) - reach
- 10-15 medium-competition (10k-100k posts) - sweet spot
- 5-10 low-competition (<10k posts) - niche community
- 1-2 branded hashtags

Emit work_output with Instagram-specific metadata: caption_length, emoji_count, hashtag_count, hashtag_strategy, visual_suggestion.
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
        )

        # Register platform specialists as subagents
        self.subagents.register("twitter", SubagentDefinition(
            name="Twitter Specialist",
            description="Expert in Twitter/X content: threads, viral hooks, engagement tactics",
            capabilities=["280-char mastery", "thread structure", "hashtag strategy", "viral mechanics"],
            prompt=TWITTER_SPECIALIST_PROMPT
        ))

        self.subagents.register("linkedin", SubagentDefinition(
            name="LinkedIn Specialist",
            description="Professional thought leadership for LinkedIn",
            capabilities=["industry insights", "professional tone", "B2B storytelling", "data-driven"],
            prompt=LINKEDIN_SPECIALIST_PROMPT
        ))

        self.subagents.register("blog", SubagentDefinition(
            name="Blog Specialist",
            description="Long-form content and SEO optimization",
            capabilities=["structure", "SEO", "storytelling", "depth", "readability"],
            prompt=BLOG_SPECIALIST_PROMPT
        ))

        self.subagents.register("instagram", SubagentDefinition(
            name="Instagram Specialist",
            description="Visual-first storytelling and caption craft",
            capabilities=["caption hooks", "emoji strategy", "visual narrative", "hashtags", "CTA"],
            prompt=INSTAGRAM_SPECIALIST_PROMPT
        ))

        logger.info(
            f"ContentAgentSDK initialized - Platforms: {', '.join(self.enabled_platforms)}, "
            f"Voice mode: {brand_voice_mode}, "
            f"Subagents registered: {len(self.subagents._subagents)}"
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
            - source_block_ids: Substrate blocks used for brand voice
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

        # Select platform specialist subagent
        platform_specialist = self.subagents.get(platform.lower())
        if not platform_specialist:
            logger.warning(f"No specialist for platform '{platform}', using generic prompt")
            specialist_prompt = None
            specialist_name = "Generic"
        else:
            specialist_prompt = platform_specialist.prompt
            specialist_name = platform_specialist.name
            logger.info(f"Using {specialist_name} for content creation")

        # Query memory for brand voice context
        context = None
        source_block_ids = []
        if self.memory:
            memory_results = await self.memory.query(
                f"brand voice examples for {platform}",
                limit=5
            )
            context = "\n".join([r.content for r in memory_results])
            source_block_ids = [
                str(r.metadata.get("block_id", r.metadata.get("id", "")))
                for r in memory_results
                if hasattr(r, "metadata") and r.metadata
            ]
            source_block_ids = [bid for bid in source_block_ids if bid]

        # Build tools (text content only)
        tools = [EMIT_WORK_OUTPUT_TOOL]

        # Call Claude with platform-specific specialist prompt
        response = await self.reason(
            task=user_prompt,
            context=context,
            system_prompt=specialist_prompt,  # Platform-specific expertise
            tools=tools,
            max_tokens=4096  # Text content only
        )

        # Parse work outputs from response
        work_outputs = parse_work_outputs_from_response(response)

        logger.info(
            f"Content created - {len(work_outputs)} work outputs emitted"
        )

        return {
            "content": response.content[0].text if response.content else "",
            "work_outputs": [wo.to_dict() for wo in work_outputs],
            "source_block_ids": source_block_ids,
            "platform": platform,
            "topic": topic,
            "content_type": content_type,
            "specialist_used": specialist_name,  # Track which platform specialist was used
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
