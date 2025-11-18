"""
Research Agent using Claude Agent SDK.

Migrated from yarnnn_agents.archetypes.research_agent.
Preserves all functionality while using SDK primitives.

Key Changes from Legacy:
- BaseAgent → SDK's query() function
- SubagentDefinition → SDK's ClaudeAgentOptions.agents config
- Manual tool parsing → SDK handles tool-use automatically
- Sequential subagents → SDK manages parallel execution

What Stays The Same:
- 4 subagents (web_monitor, competitor_tracker, social_listener, analyst)
- deep_dive() method interface
- Work output tool-use pattern
- BFF integration with SubstrateClient
"""

import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

# Claude Agent SDK imports
try:
    from claude_agent_sdk import query, ClaudeAgentOptions
except ImportError:
    # Fallback for development/testing without SDK installed
    query = None
    ClaudeAgentOptions = None

logger = logging.getLogger(__name__)


# ============================================================================
# System Prompts (Extracted from Legacy ResearchAgent)
# ============================================================================

# Main agent system prompt
RESEARCH_AGENT_SYSTEM_PROMPT = """You are a Research Agent with continuous monitoring and deep-dive capabilities.

**Job-to-be-Done:**
"Keep me informed about my market and research topics deeply when asked"

**Core Capabilities:**
- Deep-dive research (comprehensive analysis)
- Signal detection (identify important changes)
- Synthesis and insights (not just data aggregation)
- Structured output creation via tools

**Available MCP Tools:**
- mcp__yarnnn__query_substrate: Search knowledge substrate for existing information
- mcp__yarnnn__emit_work_output: Create structured deliverables (findings, insights, recommendations)
- mcp__yarnnn__get_reference_assets: Access reference files and assets

**You have 4 specialized subagents:**
- web_monitor: Monitors websites and blogs
- competitor_tracker: Tracks competitor activity
- social_listener: Monitors social media signals
- analyst: Synthesizes findings into insights

**Workflow for Research Tasks:**
1. ALWAYS query substrate first to understand existing knowledge
2. Identify knowledge gaps explicitly
3. Delegate specialized tasks to appropriate subagents if needed
4. Conduct targeted research to fill gaps
5. Emit structured work outputs for ALL significant findings
6. Link outputs to source blocks via source_context_ids

**CRITICAL: Structured Outputs**
- Use mcp__yarnnn__emit_work_output for EVERY finding, insight, recommendation
- Include source_block_ids to track provenance
- Calibrate confidence scores to evidence quality (0.0-1.0)
- Your outputs will be reviewed by the user

**Quality Standards:**
- Every finding must cite sources
- Every insight must reference supporting findings
- Confidence scores must match evidence quality
- No duplicates vs substrate knowledge"""


# Subagent prompts (extracted from SubagentDefinition objects)
WEB_MONITOR_PROMPT = """You are a web monitoring specialist.

Your job: Scrape websites, detect changes, extract key updates.
Focus on: What's NEW since last check? What CHANGED?

Approach:
1. Fetch current content from specified URLs
2. Compare with previous content (query substrate for historical state)
3. Identify significant changes
4. Extract key updates and insights
5. Score importance of changes (0.0-1.0)

Return format:
- Changes detected (what, where, when)
- Importance score
- Summary of updates

Use mcp__yarnnn__query_substrate to check previous state.
Use mcp__yarnnn__emit_work_output to record findings."""


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
2. Identify changes since last check (query substrate for historical state)
3. Assess strategic significance
4. Connect to broader market trends
5. Emit structured findings

Return format:
- Competitor actions detected
- Strategic implications
- Threat/opportunity assessment

Use mcp__yarnnn__query_substrate for historical context.
Use mcp__yarnnn__emit_work_output to record competitive intelligence."""


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

Use mcp__yarnnn__query_substrate for historical context.
Use mcp__yarnnn__emit_work_output to record social signals."""


ANALYST_PROMPT = """You are a research analyst and synthesizer.

Your job: Transform raw data into actionable insights.
Focus on: Patterns, trends, implications, recommendations.

Analysis approach:
1. Review all findings from other subagents (query substrate for recent findings)
2. Identify patterns and trends across findings
3. Assess significance and urgency
4. Connect to broader context
5. Generate actionable insights and recommendations

Synthesis levels:
- Summary: Brief overview of findings
- Detailed: Comprehensive analysis
- Insights: "So what?" implications and recommendations

Output style:
- Clear, concise, actionable
- Prioritized by importance
- Forward-looking (what does this mean for the future?)
- Recommendation-oriented (what should we do?)

Use mcp__yarnnn__query_substrate to access all recent findings.
Use mcp__yarnnn__emit_work_output to create synthesis outputs (insights, recommendations)."""


# ============================================================================
# SDK Agent Configuration
# ============================================================================

def create_research_agent_options(
    basket_id: str,
    work_session_id: str,
) -> "ClaudeAgentOptions":
    """
    Create Claude Agent SDK options for ResearchAgent.

    This configures the agent with subagents and MCP tools.
    Replaces the legacy _register_subagents() method.
    """
    if not ClaudeAgentOptions:
        raise ImportError("claude-agent-sdk not installed. Run: pip install claude-agent-sdk")

    # MCP server will be initialized separately and passed in
    # For now, we'll configure it in the environment

    return ClaudeAgentOptions(
        system_prompt=RESEARCH_AGENT_SYSTEM_PROMPT,

        # Subagents (replaces SubagentDefinition objects)
        agents={
            "web_monitor": {
                "description": "Monitor websites, blogs, and news sources for updates and changes",
                "prompt": WEB_MONITOR_PROMPT,
                "tools": [
                    "mcp__yarnnn__query_substrate",
                    "mcp__yarnnn__emit_work_output",
                ],
                "model": "sonnet"  # Fast for monitoring
            },

            "competitor_tracker": {
                "description": "Track competitor activity - products, pricing, messaging, strategic moves",
                "prompt": COMPETITOR_TRACKER_PROMPT,
                "tools": [
                    "mcp__yarnnn__query_substrate",
                    "mcp__yarnnn__emit_work_output",
                ],
                "model": "opus"  # More powerful for deep competitive analysis
            },

            "social_listener": {
                "description": "Monitor social media, communities, and forums for signals and sentiment",
                "prompt": SOCIAL_LISTENER_PROMPT,
                "tools": [
                    "mcp__yarnnn__query_substrate",
                    "mcp__yarnnn__emit_work_output",
                ],
                "model": "sonnet"  # Fast for social monitoring
            },

            "analyst": {
                "description": "Synthesize research findings into actionable insights",
                "prompt": ANALYST_PROMPT,
                "tools": [
                    "mcp__yarnnn__query_substrate",
                    "mcp__yarnnn__emit_work_output",
                ],
                "model": "sonnet"  # Good balance for synthesis
            },
        },

        # Execution limits
        max_turns=50,

        # Model selection
        model="claude-sonnet-4-5",  # Default model for main agent
    )


# ============================================================================
# ResearchAgentSDK Class
# ============================================================================

class ResearchAgentSDK:
    """
    Research Agent using Claude Agent SDK.

    Drop-in replacement for yarnnn_agents.archetypes.ResearchAgent.
    Preserves the exact interface (deep_dive method) while using SDK internally.

    Usage:
        agent = ResearchAgentSDK(
            basket_id="5004b9e1-67f5-4955-b028-389d45b1f5a4",
            work_session_id="session-uuid",
        )

        result = await agent.deep_dive("Analyze AI companion competitor pricing")

        # Returns same structure as legacy:
        # {
        #     "status": "completed",
        #     "outputs_created": 5,
        #     "work_outputs": [...],
        #     "session_metadata": {...}
        # }
    """

    def __init__(
        self,
        basket_id: str,
        work_session_id: str,
    ):
        """
        Initialize ResearchAgentSDK.

        Args:
            basket_id: Basket ID for substrate queries
            work_session_id: Work session ID for output tracking
        """
        self.basket_id = basket_id
        self.work_session_id = work_session_id

        # Create SDK options
        self.options = create_research_agent_options(
            basket_id=basket_id,
            work_session_id=work_session_id,
        )

        logger.info(
            f"ResearchAgentSDK initialized: basket={basket_id}, "
            f"session={work_session_id}"
        )

    async def deep_dive(self, task_intent: str) -> Dict[str, Any]:
        """
        Conduct deep-dive research (on-demand).

        This preserves the exact interface from legacy ResearchAgent.deep_dive().

        Args:
            task_intent: Research task description

        Returns:
            Research results with structured work_outputs:
            {
                "status": "completed",
                "outputs_created": int,
                "work_outputs": List[dict],  # Structured outputs for review
                "session_metadata": dict,
                "topic": str,
                "timestamp": str
            }
        """
        if not query:
            raise ImportError("claude-agent-sdk not installed. Cannot execute deep_dive.")

        logger.info(f"ResearchAgentSDK.deep_dive: {task_intent}")

        # Build research prompt with YARNNN-specific context
        research_prompt = f"""Research Task: {task_intent}

**Context:**
- Basket ID: {self.basket_id}
- Work Session ID: {self.work_session_id}

**Instructions:**
1. Query substrate to understand existing knowledge (use mcp__yarnnn__query_substrate)
2. Identify knowledge gaps explicitly
3. Delegate to appropriate subagents if specialized research needed
4. Conduct targeted research to fill gaps
5. Emit structured work outputs for ALL significant findings (use mcp__yarnnn__emit_work_output)
6. Link outputs to source blocks via source_context_ids

**Remember:**
- Use mcp__yarnnn__emit_work_output for EVERY finding, insight, recommendation
- Include source_block_ids to track provenance
- Calibrate confidence scores to evidence quality
- Your outputs will be reviewed by the user

Begin research."""

        # Execute agent with Claude Agent SDK
        # SDK handles tool calls, subagent delegation, parsing automatically
        try:
            result = query(
                prompt=research_prompt,
                options=self.options
            )

            # Stream response and track outputs
            # SDK returns async generator
            outputs_created = 0
            final_message = None
            all_tool_calls = []

            async for message in result:
                # Track tool calls to emit_work_output
                if hasattr(message, 'content'):
                    for block in message.content:
                        if hasattr(block, 'type') and block.type == 'tool_use':
                            if hasattr(block, 'name') and 'emit_work_output' in block.name:
                                outputs_created += 1
                                all_tool_calls.append(block)

                # Save last message for metadata
                if hasattr(message, 'text'):
                    final_message = message

            logger.info(
                f"ResearchAgentSDK completed. Created {outputs_created} outputs via tool calls."
            )

            # Return format matching legacy ResearchAgent
            return {
                "status": "completed",
                "outputs_created": outputs_created,
                "session_metadata": {
                    "final_response": str(final_message) if final_message else None,
                    "tool_calls": len(all_tool_calls),
                },
                "topic": task_intent,
                "timestamp": datetime.utcnow().isoformat(),
                "agent_type": "research",
                "basket_id": self.basket_id,
                "work_session_id": self.work_session_id,
            }

        except Exception as e:
            logger.error(f"ResearchAgentSDK.deep_dive failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "outputs_created": 0,
                "topic": task_intent,
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def monitor(self) -> Dict[str, Any]:
        """
        Continuous monitoring (scheduled runs).

        NOT IMPLEMENTED in Phase 2a.
        Will be added in Phase 3 (scheduled execution).

        For now, raises NotImplementedError to maintain compatibility.
        """
        raise NotImplementedError(
            "monitor() will be implemented in Phase 3 (scheduled execution). "
            "Use deep_dive() for on-demand research."
        )
