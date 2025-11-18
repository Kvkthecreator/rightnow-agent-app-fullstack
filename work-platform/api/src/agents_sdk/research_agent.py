"""
Research Agent SDK - Improved Implementation

This is a REFACTORED version of ResearchAgent using cleaner SDK patterns.
NOT a migration - yarnnn_agents IS already SDK-based.

Key Improvements:
- Prompts extracted to module-level constants (reusable for Skills)
- Cleaner separation of config vs execution
- Better tool-use pattern handling
- Skills-ready architecture for Phase 2b

What Stays The Same:
- Uses BaseAgent, SubagentDefinition from yarnnn_agents
- Uses AsyncAnthropic for Claude API
- Tool-use pattern with emit_work_output
- BFF pattern for substrate-API
- Work session tracking
"""

import logging
import os
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import uuid4

# YARNNN SDK imports (internalized)
from yarnnn_agents.base import BaseAgent
from yarnnn_agents.subagents import SubagentDefinition
from yarnnn_agents.interfaces import (
    MemoryProvider,
    GovernanceProvider,
    TaskProvider,
)
from yarnnn_agents.tools import (
    EMIT_WORK_OUTPUT_TOOL,
    parse_work_outputs_from_response,
    WorkOutput,
)

logger = logging.getLogger(__name__)


# ============================================================================
# System Prompts (Extracted for Reusability and Skills Integration)
# ============================================================================

# Main agent system prompt
RESEARCH_AGENT_SYSTEM_PROMPT = """You are an autonomous Research Agent specializing in intelligence gathering and analysis.

**Your Mission:**
Keep users informed about their markets, competitors, and topics of interest through:
- Continuous monitoring (proactive)
- Deep-dive research (reactive)
- Signal detection (what's important?)
- Insight synthesis (so what?)

**CRITICAL: Structured Output Requirements**

You have access to the emit_work_output tool. You MUST use this tool to record all your findings.
DO NOT just describe findings in free text. Every significant finding must be emitted as a structured output.

When to use emit_work_output:
- "finding" - When you discover a fact (competitor action, market data, news)
- "recommendation" - When you suggest an action (change strategy, add to watchlist)
- "insight" - When you identify a pattern (trend, correlation, anomaly)

Each output you emit will be reviewed by the user before any action is taken.
The user maintains full control through this supervision workflow.

**Research Approach:**
1. Query existing knowledge first (avoid redundant research)
2. Identify knowledge gaps
3. Conduct targeted research
4. For each finding: Call emit_work_output with structured data
5. Synthesize insights (emit as "insight" type)
6. Suggest actions (emit as "recommendation" type)

**Quality Standards:**
- Accuracy over speed
- Structured over narrative
- Actionable over interesting
- Forward-looking over historical
- High confidence = high evidence (don't guess)
"""


# Subagent prompts
WEB_MONITOR_PROMPT = """You are a web monitoring specialist.

Your job: Scrape websites, detect changes, extract key updates.
Focus on: What's NEW since last check? What CHANGED?

Approach:
1. Fetch current content from specified URLs
2. Compare with previous content (from memory)
3. Identify significant changes
4. Extract key updates and insights
5. Score importance of changes (0.0-1.0)

Return format:
- Changes detected (what, where, when)
- Importance score
- Summary of updates

Use emit_work_output to record all findings as structured outputs.
"""


COMPETITOR_TRACKER_PROMPT = """You are a competitive intelligence analyst.

Your job: Monitor competitor activity across multiple channels.
Focus on: Strategic moves, product changes, market positioning.

What to track:
- Product launches and updates
- Pricing changes
- Marketing messaging shifts
- Job postings (hiring signals)
- Social media activity
- Press releases and announcements

Approach:
1. Check competitor websites and social accounts
2. Identify changes since last check
3. Assess strategic significance
4. Connect to broader market trends

Return format:
- Competitor actions detected
- Strategic implications
- Threat/opportunity assessment

Use emit_work_output to record competitive intelligence as structured outputs.
"""


SOCIAL_LISTENER_PROMPT = """You are a social listening specialist.

Your job: Track mentions, sentiment, and emerging discussions.
Focus on: Community sentiment, trending topics, viral content.

Channels to monitor:
- Twitter/X
- Reddit
- Hacker News
- LinkedIn
- Industry forums

What to capture:
- Mentions and sentiment
- Trending discussions
- Viral content and memes
- Community reactions
- Emerging narratives

Return format:
- Social signals detected
- Sentiment analysis
- Trending topics
- Notable mentions

Use emit_work_output to record social signals as structured outputs.
"""


ANALYST_PROMPT = """You are a research analyst and synthesizer.

Your job: Transform raw data into actionable insights.
Focus on: Patterns, trends, implications, recommendations.

Analysis approach:
1. Review all monitoring data
2. Identify patterns and trends
3. Assess significance and urgency
4. Connect to broader context
5. Generate actionable insights

Synthesis levels:
- Summary: Brief overview of findings
- Detailed: Comprehensive analysis
- Insights: "So what?" implications and recommendations

Output style:
- Clear, concise, actionable
- Prioritized by importance
- Forward-looking (what does this mean for the future?)
- Recommendation-oriented (what should we do?)

Use emit_work_output to create synthesis outputs (insights, recommendations).
"""


# ============================================================================
# ResearchAgentSDK Class (Improved Implementation)
# ============================================================================

class ResearchAgentSDK(BaseAgent):
    """
    Improved ResearchAgent using cleaner SDK patterns.

    This is NOT a migration - it's a REFACTORING of the existing SDK-based agent.
    Uses YARNNN's internalized SDK (BaseAgent, SubagentDefinition).

    Key Improvements:
    - Prompts extracted to module-level constants
    - Better subagent isolation
    - Cleaner tool-use handling
    - Skills-ready architecture

    Drop-in replacement for ResearchAgent with identical deep_dive() interface.

    Usage:
        from agents_sdk import ResearchAgentSDK
        from adapters.substrate_adapter import SubstrateMemoryAdapter

        agent = ResearchAgentSDK(
            basket_id="5004b9e1-67f5-4955-b028-389d45b1f5a4",
            workspace_id="ws_001",
            work_session_id="session-uuid",
        )

        result = await agent.deep_dive("Analyze AI companion competitor pricing")

        # Returns same structure as legacy:
        # {
        #     "status": "completed",
        #     "topic": "...",
        #     "work_outputs": [...],
        #     "output_count": 5,
        #     "timestamp": "..."
        # }
    """

    def __init__(
        self,
        basket_id: str,
        workspace_id: str,
        work_session_id: str,
        memory: Optional[MemoryProvider] = None,
        governance: Optional[GovernanceProvider] = None,
        tasks: Optional[TaskProvider] = None,
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5",
        monitoring_domains: Optional[List[str]] = None,
        monitoring_frequency: str = "daily",
        signal_threshold: float = 0.7,
        synthesis_mode: str = "insights",
    ):
        """
        Initialize ResearchAgentSDK.

        Args:
            basket_id: Basket ID for substrate queries
            workspace_id: Workspace ID for authorization
            work_session_id: Work session ID for output tracking
            memory: MemoryProvider (auto-created if None)
            governance: GovernanceProvider (optional)
            tasks: TaskProvider (optional)
            anthropic_api_key: Anthropic API key (from env if None)
            model: Claude model to use
            monitoring_domains: Domains to monitor (for scheduled runs)
            monitoring_frequency: How often to monitor
            signal_threshold: Minimum importance score to alert
            synthesis_mode: How to present findings
        """
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.work_session_id = work_session_id

        # Auto-create memory adapter if not provided
        if memory is None:
            from adapters.substrate_adapter import SubstrateMemoryAdapter
            memory = SubstrateMemoryAdapter(
                basket_id=basket_id,
                workspace_id=workspace_id,
                agent_type="research",
            )

        # Get API key
        if anthropic_api_key is None:
            anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY required")

        # Initialize BaseAgent
        super().__init__(
            agent_type="research",
            agent_name="Research Agent SDK",
            memory=memory,
            governance=governance,
            tasks=tasks,
            anthropic_api_key=anthropic_api_key,
            model=model,
        )

        # Research configuration
        self.monitoring_domains = monitoring_domains or ["general"]
        self.monitoring_frequency = monitoring_frequency
        self.signal_threshold = signal_threshold
        self.synthesis_mode = synthesis_mode

        # Register subagents with extracted prompts
        self._register_subagents()

        logger.info(
            f"ResearchAgentSDK initialized: basket={basket_id}, "
            f"session={work_session_id}, domains={self.monitoring_domains}"
        )

    def _register_subagents(self):
        """Register specialized research subagents using clean SubagentDefinition pattern."""

        # Web Monitor
        self.subagents.register(
            SubagentDefinition(
                name="web_monitor",
                description="Monitor websites, blogs, and news sources for updates and changes",
                system_prompt=WEB_MONITOR_PROMPT,
                tools=["web_search", "web_fetch"],
                metadata={"type": "monitor"}
            )
        )

        # Competitor Tracker
        self.subagents.register(
            SubagentDefinition(
                name="competitor_tracker",
                description="Track competitor activity - products, pricing, messaging, strategic moves",
                system_prompt=COMPETITOR_TRACKER_PROMPT,
                tools=["web_search", "web_fetch"],
                metadata={"type": "monitor"}
            )
        )

        # Social Listener
        self.subagents.register(
            SubagentDefinition(
                name="social_listener",
                description="Monitor social media, communities, and forums for signals and sentiment",
                system_prompt=SOCIAL_LISTENER_PROMPT,
                tools=["web_search", "web_fetch"],
                metadata={"type": "monitor"}
            )
        )

        # Analyst
        self.subagents.register(
            SubagentDefinition(
                name="analyst",
                description="Synthesize research findings into actionable insights",
                system_prompt=ANALYST_PROMPT,
                tools=None,  # No web tools, just analysis
                metadata={"type": "analyst"}
            )
        )

    def _get_default_system_prompt(self) -> str:
        """
        Get Research Agent specific system prompt.

        Override from BaseAgent to use extracted RESEARCH_AGENT_SYSTEM_PROMPT.
        """
        prompt = RESEARCH_AGENT_SYSTEM_PROMPT

        # Add capabilities info
        prompt += f"""

**Your Capabilities:**
- Memory: {"Available" if self.memory is not None else "Not configured"}
- Governance: {"Available" if self.governance is not None else "Not configured"}
- Monitoring Domains: {", ".join(self.monitoring_domains)}
- Monitoring Frequency: {self.monitoring_frequency}
"""

        # Add subagent delegation info
        if self.subagents.list_subagents():
            prompt += "\n" + self.subagents.get_delegation_prompt()

        return prompt

    async def execute(
        self,
        task: str,
        task_id: Optional[str] = None,
        task_metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a research task.

        Implements BaseAgent's abstract execute() method.
        Routes to deep_dive() for now (monitor() not implemented in Phase 2a).

        Args:
            task: Task description
            task_id: Optional task ID
            task_metadata: Optional task metadata
            **kwargs: Additional arguments

        Returns:
            Research results
        """
        # For Phase 2a, we only support deep_dive (on-demand research)
        # Future: Add routing logic for monitor() vs deep_dive()
        return await self.deep_dive(task)

    async def deep_dive(self, topic: str) -> Dict[str, Any]:
        """
        Execute deep-dive research on a specific topic.

        Preserves exact interface from legacy ResearchAgent.deep_dive().
        Uses improved patterns with extracted prompts and cleaner tool handling.

        Args:
            topic: Research topic

        Returns:
            Research findings with structured work_outputs:
            {
                "topic": str,
                "timestamp": str,
                "work_outputs": List[dict],  # Structured outputs for review
                "output_count": int,
                "source_block_ids": List[str],
                "agent_type": "research"
            }
        """
        logger.info(f"ResearchAgentSDK.deep_dive: {topic}")

        # Query existing knowledge and extract block IDs for provenance
        context = None
        source_block_ids = []
        if self.memory:
            memory_results = await self.memory.query(topic, limit=10)
            context = "\n".join([r.content for r in memory_results])
            # Extract block IDs for provenance tracking
            source_block_ids = [
                str(r.metadata.get("block_id", r.metadata.get("id", "")))
                for r in memory_results
                if hasattr(r, "metadata") and r.metadata
            ]
            source_block_ids = [bid for bid in source_block_ids if bid]  # Filter empty

        # Comprehensive research using Claude WITH structured output tool
        research_prompt = f"""Conduct comprehensive research on: {topic}

**Existing Knowledge (Block IDs: {source_block_ids if source_block_ids else 'none'}):**
{context or "No prior context available"}

**Research Objectives:**
1. Provide comprehensive overview
2. Identify key trends and patterns
3. Analyze implications
4. Generate actionable insights

**CRITICAL INSTRUCTION:**
You MUST use the emit_work_output tool to record your findings. Do NOT just describe findings in text.

For each significant finding, insight, or recommendation you discover:
1. Call emit_work_output with structured data
2. Use appropriate output_type (finding, recommendation, insight)
3. Include source_block_ids from the context blocks used: {source_block_ids}
4. Assign confidence scores based on evidence quality

Example workflow:
- Find a key fact → emit_work_output(output_type="finding", ...)
- Identify a pattern → emit_work_output(output_type="insight", ...)
- Suggest action → emit_work_output(output_type="recommendation", ...)

You may emit multiple outputs. Each will be reviewed by the user.

Please conduct thorough research and synthesis, emitting structured outputs for all significant findings."""

        # Call Claude WITH the emit_work_output tool
        response = await self.reason(
            task=research_prompt,
            context=context,
            tools=[EMIT_WORK_OUTPUT_TOOL],  # Enable structured output tool
            max_tokens=8000  # Longer for deep dives
        )

        # Parse structured work outputs from Claude's response
        work_outputs = parse_work_outputs_from_response(response)

        # Log what we found
        logger.info(
            f"Deep-dive produced {len(work_outputs)} structured outputs: "
            f"{[o.output_type for o in work_outputs]}"
        )

        results = {
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
            "work_outputs": [o.to_dict() for o in work_outputs],  # Structured outputs
            "output_count": len(work_outputs),
            "source_block_ids": source_block_ids,
            "agent_type": "research",  # For output routing
            "basket_id": self.basket_id,
            "work_session_id": self.work_session_id,
        }

        logger.info(f"Deep-dive research complete: {topic} with {len(work_outputs)} outputs")

        return results

    async def monitor(self) -> Dict[str, Any]:
        """
        Execute continuous monitoring across all configured domains.

        NOT IMPLEMENTED in Phase 2a (focus on deep_dive for now).
        Will be added in future phases for scheduled execution.

        Raises:
            NotImplementedError: Always (not yet implemented)
        """
        raise NotImplementedError(
            "monitor() will be implemented in future phases (scheduled execution). "
            "Use deep_dive() for on-demand research."
        )


# ============================================================================
# Convenience Functions
# ============================================================================

def create_research_agent_sdk(
    basket_id: str,
    workspace_id: str,
    work_session_id: str,
    **kwargs
) -> ResearchAgentSDK:
    """
    Convenience factory function for creating ResearchAgentSDK.

    Args:
        basket_id: Basket ID for substrate queries
        workspace_id: Workspace ID for authorization
        work_session_id: Work session ID for output tracking
        **kwargs: Additional arguments for ResearchAgentSDK

    Returns:
        Configured ResearchAgentSDK instance
    """
    return ResearchAgentSDK(
        basket_id=basket_id,
        workspace_id=workspace_id,
        work_session_id=work_session_id,
        **kwargs
    )
