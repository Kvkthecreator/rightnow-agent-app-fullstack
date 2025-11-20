"""
Thinking Partner Agent using Official Anthropic Claude Agent SDK

This is the NEW implementation using ClaudeSDKClient with proper session management.
Replaces the legacy thinking_partner.py which used raw AsyncAnthropic API.

Key improvements:
- Built-in session persistence via ClaudeSDKClient
- Proper conversation continuity (Claude remembers context)
- Official Anthropic SDK (no custom session hacks)
- Cleaner code (SDK handles complexity)

Usage:
    from agents_sdk.thinking_partner_sdk import ThinkingPartnerAgentSDK

    agent = ThinkingPartnerAgentSDK(
        basket_id="basket_123",
        workspace_id="ws_456",
        user_id="user_789"
    )

    # First message (creates new session)
    result = await agent.chat("I need LinkedIn content about AI")
    session_id = result["claude_session_id"]

    # Follow-up message (resumes session)
    result = await agent.chat(
        "Make it more professional",
        claude_session_id=session_id
    )
"""

import logging
import os
from typing import Any, Dict, List, Optional
from uuid import uuid4

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

from adapters.memory_adapter import SubstrateMemoryAdapter
from yarnnn_agents.tools import EMIT_WORK_OUTPUT_TOOL, parse_work_outputs_from_response
from yarnnn_agents.session import AgentSession

logger = logging.getLogger(__name__)


# ============================================================================
# System Prompt
# ============================================================================

THINKING_PARTNER_SYSTEM_PROMPT = """You are the Thinking Partner - a meta-agent that orchestrates specialized agents and provides intelligent assistance to users.

**Your Role:**
You are the user's intelligent assistant for managing their knowledge workspace and agent workflows. You help users:
- Create content (LinkedIn posts, reports, articles)
- Conduct research (competitive intelligence, market analysis)
- Manage knowledge (organize insights, track patterns)
- Coordinate agent workflows (decide what agents to run, when)

**Gateway/Mirror/Meta Pattern:**
1. **Gateway**: You receive ALL user interaction via chat
2. **Mirror**: You orchestrate YARNNN infrastructure via tools
3. **Meta**: You emit your own intelligence (insights, recommendations)

**Your Capabilities:**

**Tools Available:**
1. **agent_orchestration**: Delegate work to specialized agents
   - research: Deep analysis, competitive intelligence, market monitoring
   - content: LinkedIn posts, articles, creative content
   - reporting: Data visualization, analytics, dashboards

2. **infra_reader**: Query YARNNN orchestration state
   - Check work_requests, work_tickets, work_outputs
   - Review agent_sessions, execution history
   - Access work completion status

3. **steps_planner**: Plan multi-step workflows
   - Break down complex requests into steps
   - Decide agent sequences
   - Optimize execution order

4. **emit_work_output**: Emit your own insights
   - Pattern recognition ("I notice...")
   - Recommendations ("You should...")
   - Meta-insights (system-level intelligence)

**Memory Access:**
You have access to the user's knowledge substrate via memory queries:
- Blocks (facts, insights, data)
- Documents (compositions, articles)
- Timeline (history, events)
- Previous work outputs (from all agents)

**Your Approach:**

When user makes a request:
1. **Understand Intent**: What does user want?
2. **Query Context**: What do we already know? (memory.query)
3. **Check Work State**: Any relevant ongoing/past work? (infra_reader)
4. **Decide Action**:
   - Can I answer directly? (from existing knowledge)
   - Should I delegate to agent? (agent_orchestration)
   - Should I plan workflow? (steps_planner for complex requests)
5. **Execute & Synthesize**: Run agent(s), combine outputs intelligently
6. **Emit Meta-Intelligence**: Any patterns worth noting? (emit_work_output)

**Conversation Style:**
- Conversational, not robotic
- Proactive: Suggest what might be helpful
- Transparent: Explain your reasoning
- Efficient: Don't re-run work unnecessarily
- Pattern-aware: Notice user preferences

**Important:**
- Always query existing knowledge BEFORE delegating to agents
- Explain what you're doing and why
- Ask for clarification when intent is ambiguous
- Use agent_orchestration to delegate, don't try to do specialized work yourself
- Emit insights about patterns you notice (user preferences, recurring topics)
"""


# ============================================================================
# ThinkingPartnerAgentSDK Class
# ============================================================================

class ThinkingPartnerAgentSDK:
    """
    Thinking Partner using Official Anthropic Claude Agent SDK.

    Features:
    - ClaudeSDKClient for built-in session management
    - Conversation continuity across multiple exchanges
    - Tool integration (agent_orchestration, infra_reader, etc.)
    - Memory access via SubstrateMemoryAdapter
    """

    def __init__(
        self,
        basket_id: str,
        workspace_id: str,
        user_id: str,
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5",
    ):
        """
        Initialize ThinkingPartnerAgentSDK.

        Args:
            basket_id: Basket ID for substrate queries
            workspace_id: Workspace ID for authorization
            user_id: User ID for personalization
            anthropic_api_key: Anthropic API key (from env if None)
            model: Claude model to use
        """
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.user_id = user_id
        self.model = model

        # Create memory adapter using BFF pattern
        self.memory = SubstrateMemoryAdapter(
            basket_id=basket_id,
            workspace_id=workspace_id
        )
        logger.info(f"Created SubstrateMemoryAdapter for basket={basket_id}")

        # Get API key
        if anthropic_api_key is None:
            anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY required")

        self.api_key = anthropic_api_key

        # Track current AgentSession (for work ticket linking)
        self.current_session: Optional[AgentSession] = None

        # Build agent options
        self._options = self._build_options()

        logger.info(
            f"ThinkingPartnerAgentSDK initialized: basket={basket_id}, "
            f"workspace={workspace_id}, user={user_id}"
        )

    def _build_options(self) -> ClaudeAgentOptions:
        """Build ClaudeAgentOptions with tools and configuration."""
        # Build tools (same as legacy implementation)
        tools = [
            self._create_agent_orchestration_tool(),
            self._create_infra_reader_tool(),
            self._create_steps_planner_tool(),
            EMIT_WORK_OUTPUT_TOOL,
        ]

        return ClaudeAgentOptions(
            model=self.model,
            system_prompt=self._get_system_prompt(),
            tools=tools,
            max_tokens=4096,
        )

    def _get_system_prompt(self) -> str:
        """Get Thinking Partner system prompt with current context."""
        prompt = THINKING_PARTNER_SYSTEM_PROMPT

        # Add context about current state
        prompt += f"""

**Current Context:**
- Basket ID: {self.basket_id}
- Workspace ID: {self.workspace_id}
- User ID: {self.user_id}
- Memory: {"Available" if self.memory else "Not configured"}
"""
        return prompt

    def _create_agent_orchestration_tool(self) -> Dict[str, Any]:
        """Tool for delegating to specialized agents."""
        return {
            "name": "agent_orchestration",
            "description": """Delegate work to specialized agents.

Available agents:
- research: Deep analysis, competitive intelligence, web monitoring, market research
- content: LinkedIn posts, articles, creative content creation
- reporting: Data visualization, analytics dashboards, synthesis reports

Use this when user requests work that requires specialized capabilities.
The agent will execute and return structured work_outputs for review.

Examples:
- "Research AI agent pricing" → research agent
- "Create LinkedIn post about..." → content agent
- "Analyze Q4 metrics" → reporting agent
""",
            "input_schema": {
                "type": "object",
                "properties": {
                    "agent_type": {
                        "type": "string",
                        "enum": ["research", "content", "reporting"],
                        "description": "Which specialized agent to use"
                    },
                    "task": {
                        "type": "string",
                        "description": "Clear task description for the agent"
                    },
                    "parameters": {
                        "type": "object",
                        "description": "Optional agent-specific parameters",
                        "properties": {
                            "research_depth": {"type": "string", "enum": ["quick", "deep"]},
                            "platform": {"type": "string"},
                            "style": {"type": "string"},
                        }
                    }
                },
                "required": ["agent_type", "task"]
            }
        }

    def _create_infra_reader_tool(self) -> Dict[str, Any]:
        """Tool for querying YARNNN orchestration infrastructure."""
        return {
            "name": "infra_reader",
            "description": """Query YARNNN work orchestration state.

Use this to check:
- Recent work_requests (what user asked for)
- Work_tickets status (pending, running, completed, failed)
- Work_outputs (deliverables from agents)
- Agent_sessions (active agent conversations)
- Execution history (what's been done)

Useful before delegating to agents to avoid redundant work.

Examples:
- Check if we have recent research on a topic
- See status of ongoing work
- Review past outputs for context
""",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query_type": {
                        "type": "string",
                        "enum": [
                            "recent_work_requests",
                            "work_tickets_by_status",
                            "work_outputs_by_type",
                            "agent_sessions",
                            "work_history"
                        ],
                        "description": "What infrastructure data to query"
                    },
                    "filters": {
                        "type": "object",
                        "description": "Optional filters",
                        "properties": {
                            "agent_type": {"type": "string"},
                            "status": {"type": "string"},
                            "output_type": {"type": "string"},
                            "limit": {"type": "integer"},
                        }
                    }
                },
                "required": ["query_type"]
            }
        }

    def _create_steps_planner_tool(self) -> Dict[str, Any]:
        """Tool for planning multi-step workflows."""
        return {
            "name": "steps_planner",
            "description": """Plan multi-step workflows for complex requests.

Use this when user request requires multiple agents or steps.

The planner will:
1. Break down request into logical steps
2. Decide which agents to use for each step
3. Determine dependencies (sequential vs parallel)
4. Optimize execution order

Returns execution plan you can follow.

Examples:
- "Research competitors then create content" → 2 steps (research → content)
- "Analyze metrics and create report" → 2 steps (reporting → content)
""",
            "input_schema": {
                "type": "object",
                "properties": {
                    "user_request": {
                        "type": "string",
                        "description": "The user's complex request"
                    },
                    "existing_context": {
                        "type": "string",
                        "description": "Relevant context from memory or infrastructure"
                    }
                },
                "required": ["user_request"]
            }
        }

    async def chat(
        self,
        user_message: str,
        claude_session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle user chat message with session management.

        This is the primary interface for Thinking Partner.

        Args:
            user_message: User's message
            claude_session_id: Optional session to resume

        Returns:
            {
                "message": str,  # TP's response
                "claude_session_id": str,  # For resumption (NEW - actually works!)
                "session_id": str,  # AgentSession ID
                "work_outputs": List[dict],  # Any outputs TP emitted
                "actions_taken": List[str]  # What TP did
            }
        """
        logger.info(f"TP chat (SDK): {user_message[:100]}")

        # Start or resume AgentSession (for work ticket linking)
        if not self.current_session:
            self.current_session = self._start_session()
            logger.info(f"Started new AgentSession: {self.current_session.id}")

        # Query memory for context
        context = None
        if self.memory:
            memory_results = await self.memory.query(user_message, limit=5)
            if memory_results:
                context = "\n".join([r.content for r in memory_results])

        # Build prompt with context
        full_prompt = user_message
        if context:
            full_prompt = f"""**Relevant Context from Memory:**

{context}

**User Message:**
{user_message}"""

        # Create SDK client with options
        async with ClaudeSDKClient(
            api_key=self.api_key,
            options=self._options
        ) as client:
            # Connect with initial prompt
            if claude_session_id:
                # Resume existing session
                logger.info(f"Resuming Claude session: {claude_session_id}")
                await client.connect(session_id=claude_session_id)
            else:
                # Start new session
                await client.connect()

            # Send query
            await client.query(full_prompt)

            # Collect responses
            response_text = ""
            actions_taken = []
            work_outputs = []

            async for message in client.receive_response():
                logger.debug(f"SDK message type: {type(message).__name__}")

                # Extract text content
                if hasattr(message, 'text'):
                    response_text += message.text

                # Process content blocks (text, tool_use, tool_result)
                if hasattr(message, 'content') and isinstance(message.content, list):
                    for block in message.content:
                        if not hasattr(block, 'type'):
                            continue

                        block_type = block.type
                        logger.debug(f"SDK block type: {block_type}")

                        # Text blocks
                        if block_type == 'text' and hasattr(block, 'text'):
                            response_text += block.text

                        # Tool use blocks (for tracking)
                        elif block_type == 'tool_use':
                            tool_name = getattr(block, 'name', 'unknown')
                            actions_taken.append(f"Used tool: {tool_name}")
                            logger.info(f"TP used tool: {tool_name}")

                        # Tool result blocks (CRITICAL - extract work outputs)
                        elif block_type == 'tool_result':
                            tool_name = getattr(block, 'tool_name', '')
                            logger.debug(f"Tool result from: {tool_name}")

                            if tool_name == 'emit_work_output':
                                try:
                                    result_content = getattr(block, 'content', None)
                                    if result_content:
                                        # Parse work output from tool result
                                        import json
                                        if isinstance(result_content, str):
                                            output_data = json.loads(result_content)
                                        else:
                                            output_data = result_content

                                        work_outputs.append(output_data)
                                        logger.info(f"Captured work output: {output_data.get('title', 'untitled')}")
                                except Exception as e:
                                    logger.error(f"Failed to parse work output: {e}", exc_info=True)

            # Get session ID from client
            new_session_id = getattr(client, 'session_id', None)
            logger.debug(f"Session ID retrieved: {new_session_id}")

            # Persist session ID to database for resumption
            if new_session_id and self.current_session:
                self.current_session.update_claude_session(new_session_id)
                logger.info(f"Stored Claude session: {new_session_id}")

            result = {
                "message": response_text or "Processing...",
                "claude_session_id": new_session_id,
                "session_id": self.current_session.id if self.current_session else None,
                "work_outputs": work_outputs,
                "actions_taken": actions_taken,
            }

            logger.info(
                f"TP chat complete (SDK): {len(response_text)} chars, "
                f"{len(actions_taken)} actions"
            )

            return result

    def _start_session(self) -> AgentSession:
        """Start a new agent session."""
        session = AgentSession(
            agent_id=f"thinking_partner_{self.user_id}",
            claude_ticket_id=None,  # SDK manages this now
            metadata={
                "agent_type": "thinking_partner",
                "basket_id": self.basket_id,
                "workspace_id": self.workspace_id,
                "user_id": self.user_id,
            }
        )
        return session


# ============================================================================
# Convenience Functions
# ============================================================================

def create_thinking_partner_sdk(
    basket_id: str,
    workspace_id: str,
    user_id: str,
    **kwargs
) -> ThinkingPartnerAgentSDK:
    """
    Convenience factory for creating ThinkingPartnerAgentSDK.

    Args:
        basket_id: Basket ID
        workspace_id: Workspace ID
        user_id: User ID
        **kwargs: Additional arguments for ThinkingPartnerAgentSDK

    Returns:
        Configured ThinkingPartnerAgentSDK instance
    """
    return ThinkingPartnerAgentSDK(
        basket_id=basket_id,
        workspace_id=workspace_id,
        user_id=user_id,
        **kwargs
    )
