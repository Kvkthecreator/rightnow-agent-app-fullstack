"""
Thinking Partner Agent - Gateway/Mirror/Meta Agent

The Thinking Partner (TP) is a meta-agent that orchestrates other specialized agents,
provides insights to users, and manages system-level intelligence.

Architecture Pattern: Gateway/Mirror/Meta
- Gateway: Receives all user interaction (chat interface)
- Mirror: Orchestrates YARNNN infrastructure (work_requests, work_tickets, agent_sessions)
- Meta: Emits own intelligence (insights, recommendations, pattern recognition)

Key Capabilities:
1. Chat Interface - User asks questions, TP queries substrate + work history
2. Pattern Recognition - "I notice you reject emoji-heavy posts"
3. Agent Orchestration - Delegates to specialized agents (research, content, reporting)
4. Workflow Planning - Creates multi-step execution plans
5. Infrastructure Querying - Reads work state, agent sessions, outputs
6. Meta-Intelligence - Generates own insights from system patterns

Design Decisions:
- Uses AgentSession for conversation (claude_session_id for resumption)
- Uses SubstrateMemoryAdapter for knowledge queries
- Tools mirror YARNNN infrastructure operations
- No new database tables needed (reuses agent_sessions)
- Lives in work-platform (orchestration domain)

Usage:
    from agents_sdk.thinking_partner import ThinkingPartnerAgent

    tp = ThinkingPartnerAgent(
        basket_id="basket_abc",
        workspace_id="ws_001",
        user_id="user_123",
        anthropic_api_key="sk-ant-..."
    )

    # Chat (creates or resumes session)
    result = await tp.chat(
        user_message="I need LinkedIn content about AI agents",
        claude_session_id=None  # Or provide for resumption
    )

    # Returns:
    # {
    #     "message": "I see we have research from last week. Should I use that or research fresh?",
    #     "claude_session_id": "session_xyz",
    #     "work_outputs": [...],  # Any outputs TP emitted
    #     "actions_taken": [...]  # Agent delegations, etc.
    # }
"""

import logging
import os
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import uuid4, UUID

# YARNNN SDK imports
from yarnnn_agents.base import BaseAgent
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

**Example Interaction:**

User: "I need LinkedIn content about AI agents"

You (thinking):
- Query memory for "AI agents" content/research
- Check infra_reader for recent research work
- Decide: Do we have fresh research? Or need new?

You (response):
"I see we have research on AI agent trends from 3 days ago. Would you like me to:
1. Use that research to create content now (faster)
2. Run fresh research first (more current)

What's your preference?"

**Important:**
- Always query existing knowledge BEFORE delegating to agents
- Explain what you're doing and why
- Ask for clarification when intent is ambiguous
- Use agent_orchestration to delegate, don't try to do specialized work yourself
- Emit insights about patterns you notice (user preferences, recurring topics)
"""


# ============================================================================
# ThinkingPartnerAgent Class
# ============================================================================

class ThinkingPartnerAgent(BaseAgent):
    """
    Meta-agent that orchestrates specialized agents via tools.

    Gateway/Mirror/Meta Pattern:
    - Gateway: Receives user chat messages
    - Mirror: Orchestrates YARNNN infrastructure
    - Meta: Emits own intelligence

    This agent uses the existing agent SDK infrastructure:
    - AgentSession for conversation management
    - SubstrateMemoryAdapter for knowledge queries
    - Custom tools for orchestration capabilities
    - No new database tables needed
    """

    def __init__(
        self,
        basket_id: str,
        workspace_id: str,
        user_id: str,
        work_ticket_id: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5",
        claude_session_id: Optional[str] = None,
    ):
        """
        Initialize ThinkingPartnerAgent.

        Args:
            basket_id: Basket ID for substrate queries
            workspace_id: Workspace ID for authorization
            user_id: User ID for personalization
            work_ticket_id: Optional work ticket ID (if resuming)
            anthropic_api_key: Anthropic API key (from env if None)
            model: Claude model to use
            claude_session_id: Optional Claude session to resume
        """
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.user_id = user_id

        # Create memory adapter using BFF pattern
        memory_adapter = SubstrateMemoryAdapter(
            basket_id=basket_id,
            workspace_id=workspace_id
        )
        logger.info(f"Created SubstrateMemoryAdapter for basket={basket_id}")

        # Get API key
        if anthropic_api_key is None:
            anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY required")

        # Initialize BaseAgent
        # NOTE: We override the Claude client creation to remove Skills beta headers
        # TP doesn't use Skills API, only standard messages API
        super().__init__(
            agent_type="thinking_partner",
            agent_name="Thinking Partner",
            memory=memory_adapter,
            anthropic_api_key=anthropic_api_key,
            model=model,
            ticket_id=work_ticket_id,
            claude_ticket_id=claude_session_id,
        )

        # Override Claude client to remove Skills beta headers (TP doesn't use Skills)
        from anthropic import AsyncAnthropic
        self.claude = AsyncAnthropic(api_key=anthropic_api_key)

        # Build tools
        self._tools = self._build_tools()

        logger.info(
            f"ThinkingPartnerAgent initialized: basket={basket_id}, "
            f"workspace={workspace_id}, user={user_id}"
        )

    def _build_tools(self) -> List[Dict[str, Any]]:
        """Build tool definitions for Thinking Partner."""
        return [
            self._create_agent_orchestration_tool(),
            self._create_infra_reader_tool(),
            self._create_steps_planner_tool(),
            EMIT_WORK_OUTPUT_TOOL,
        ]

    def _create_agent_orchestration_tool(self) -> Dict[str, Any]:
        """
        Tool that MIRRORS work-platform's agent orchestration.

        Delegates to specialized agents (research, content, reporting).
        Creates work_request, work_ticket, executes agent, returns outputs.
        """
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
        """
        Tool for querying YARNNN orchestration infrastructure.

        Reads work_requests, work_tickets, work_outputs, agent_sessions.
        """
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
        """
        Tool for planning multi-step workflows.

        LLM-based planner that breaks down complex requests.
        """
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

    def _get_default_system_prompt(self) -> str:
        """Get Thinking Partner system prompt."""
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

    async def _handle_tool_use(
        self,
        tool_name: str,
        tool_input: Dict[str, Any]
    ) -> str:
        """
        Handle tool execution.

        Routes to appropriate handler based on tool name.
        """
        logger.info(f"TP tool use: {tool_name} with {tool_input}")

        if tool_name == "agent_orchestration":
            return await self._execute_agent_orchestration(tool_input)
        elif tool_name == "infra_reader":
            return await self._execute_infra_reader(tool_input)
        elif tool_name == "steps_planner":
            return await self._execute_steps_planner(tool_input)
        elif tool_name == "emit_work_output":
            # Handled by parse_work_outputs_from_response
            return "Work output recorded"
        else:
            logger.warning(f"Unknown tool: {tool_name}")
            return f"Error: Unknown tool '{tool_name}'"

    async def _execute_agent_orchestration(
        self,
        tool_input: Dict[str, Any]
    ) -> str:
        """
        Execute agent_orchestration tool.

        Delegates to existing agent_orchestration.py run_agent_task endpoint.
        Creates work_request, work_ticket, executes agent.
        """
        agent_type = tool_input["agent_type"]
        task = tool_input["task"]
        parameters = tool_input.get("parameters", {})

        logger.info(f"Delegating to {agent_type} agent: {task}")

        try:
            # Import here to avoid circular dependency
            from app.routes.agent_orchestration import (
                run_agent_task,
                AgentTaskRequest,
                _get_workspace_id_for_user
            )

            # Get workspace_id
            workspace_id = await _get_workspace_id_for_user(self.user_id)

            # Map task to task_type (simplified for MVP)
            # In production, use LLM to parse task into structured request
            task_type_mapping = {
                "research": "deep_dive",
                "content": "create",
                "reporting": "generate"
            }
            task_type = task_type_mapping.get(agent_type, "execute")

            # Build request matching agent_orchestration.py signature
            request = AgentTaskRequest(
                agent_type=agent_type,
                task_type=task_type,
                basket_id=self.basket_id,
                parameters={**parameters, "topic": task} if agent_type == "research" else parameters
            )

            # Create mock user dict for dependency
            mock_user = {"sub": self.user_id}

            # Delegate to existing orchestration
            result = await run_agent_task(request, user=mock_user)

            # Extract info from AgentTaskResponse
            status = result.status
            result_data = result.result or {}
            work_ticket_id = result_data.get("work_ticket_id", "unknown")
            work_outputs = result_data.get("work_outputs", [])

            response = f"""Agent {agent_type} completed with status: {status}

Work Ticket ID: {work_ticket_id}
Outputs Generated: {len(work_outputs)}

Outputs Summary:
"""
            for i, output in enumerate(work_outputs, 1):
                response += f"\n{i}. {output.get('output_type', 'unknown')}: {output.get('title', 'Untitled')}"

            return response

        except Exception as e:
            logger.error(f"Agent orchestration failed: {e}")
            return f"Error delegating to {agent_type} agent: {str(e)}"

    async def _execute_infra_reader(
        self,
        tool_input: Dict[str, Any]
    ) -> str:
        """
        Execute infra_reader tool.

        Queries work-platform infrastructure for state.
        """
        query_type = tool_input["query_type"]
        filters = tool_input.get("filters", {})

        logger.info(f"Infrastructure query: {query_type} with filters {filters}")

        # Import supabase client for direct queries
        from app.utils.supabase_client import supabase_admin_client

        try:
            if query_type == "recent_work_requests":
                # Query recent work requests from database
                limit = filters.get("limit", 10)

                response_data = supabase_admin_client.table("work_requests").select(
                    "id, request_type, description, status, created_at"
                ).eq("basket_id", self.basket_id).order(
                    "created_at", desc=True
                ).limit(limit).execute()

                work_requests = response_data.data or []

                response = f"Recent Work Requests ({len(work_requests)}):\n"
                for wr in work_requests:
                    response += f"\n- {wr.get('request_type', 'unknown')}: {wr.get('description', 'No description')[:100]}"
                    response += f" (status: {wr.get('status')})"

                return response

            elif query_type == "work_tickets_by_status":
                # Query work tickets by status
                status = filters.get("status", "running")
                limit = filters.get("limit", 10)

                response_data = supabase_admin_client.table("work_tickets").select(
                    "id, task_type, status, started_at, ended_at"
                ).eq("basket_id", self.basket_id).eq(
                    "status", status
                ).order("started_at", desc=True).limit(limit).execute()

                work_tickets = response_data.data or []

                response = f"Work Tickets (status={status}, count={len(work_tickets)}):\n"
                for wt in work_tickets:
                    response += f"\n- Agent: {wt.get('task_type')}, Status: {wt.get('status')}"
                    response += f" (started: {wt.get('started_at')})"

                return response

            elif query_type == "work_outputs_by_type":
                # Query work outputs from substrate-API via substrate_client
                # For MVP, return placeholder - actual implementation would query substrate-API
                output_type = filters.get("output_type")
                limit = filters.get("limit", 10)

                # TODO: Query substrate-API for work_outputs
                # For now, return placeholder response
                response = f"Work Outputs (type={output_type or 'all'}):\n"
                response += "\n(Infrastructure query to substrate-API not yet implemented in MVP)"
                response += "\nThis will query work_outputs via substrate_client in production"

                return response

            elif query_type == "agent_sessions":
                # Query agent sessions
                limit = filters.get("limit", 10)
                agent_type = filters.get("agent_type")

                query = supabase_admin_client.table("agent_sessions").select(
                    "id, agent_type, claude_session_id, created_at, updated_at"
                ).eq("basket_id", self.basket_id).order("updated_at", desc=True).limit(limit)

                if agent_type:
                    query = query.eq("agent_type", agent_type)

                response_data = query.execute()
                sessions = response_data.data or []

                response = f"Agent Sessions ({len(sessions)}):\n"
                for session in sessions:
                    response += f"\n- {session.get('agent_type')}: session_id={session.get('id')}"
                    response += f" (updated: {session.get('updated_at')})"

                return response

            elif query_type == "work_history":
                # Combined query for complete work history
                limit = filters.get("limit", 10)

                tickets_data = supabase_admin_client.table("work_tickets").select(
                    "id, task_type, status, started_at, ended_at"
                ).eq("basket_id", self.basket_id).order(
                    "started_at", desc=True
                ).limit(limit).execute()

                tickets = tickets_data.data or []

                response = f"Work History ({len(tickets)} recent items):\n"
                for ticket in tickets:
                    response += f"\n- [{ticket.get('status')}] {ticket.get('task_type')}"
                    response += f" (started: {ticket.get('started_at')})"

                return response

            else:
                return f"Query type '{query_type}' not yet implemented"

        except Exception as e:
            logger.error(f"Infrastructure query failed: {e}")
            return f"Error querying infrastructure: {str(e)}"

    async def _execute_steps_planner(
        self,
        tool_input: Dict[str, Any]
    ) -> str:
        """
        Execute steps_planner tool.

        Uses LLM to plan multi-step workflows.
        """
        user_request = tool_input["user_request"]
        existing_context = tool_input.get("existing_context", "")

        logger.info(f"Planning steps for: {user_request}")

        # Use Claude to plan steps
        planning_prompt = f"""Plan a multi-step workflow for this user request:

User Request: {user_request}

Existing Context: {existing_context or "None"}

Available Agents:
- research: Deep analysis, competitive intelligence, market research
- content: LinkedIn posts, articles, creative content
- reporting: Data visualization, analytics, dashboards

Create an execution plan with:
1. Steps (numbered, sequential)
2. Which agent to use for each step
3. Dependencies (which steps must complete first)
4. Expected outputs from each step

Format as clear numbered list."""

        try:
            response = await self.reason(
                task=planning_prompt,
                max_tokens=2000
            )

            # Extract text content from response
            if hasattr(response, 'content'):
                # Claude API response object
                plan_text = ""
                for block in response.content:
                    if hasattr(block, 'text'):
                        plan_text += block.text
            else:
                plan_text = str(response)

            return f"Execution Plan:\n\n{plan_text}"

        except Exception as e:
            logger.error(f"Steps planning failed: {e}")
            return f"Error planning steps: {str(e)}"

    async def execute(
        self,
        task: str,
        task_id: Optional[str] = None,
        task_metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a task (routes to chat).

        Implements BaseAgent's abstract execute() method.
        For TP, execute means chat.
        """
        return await self.chat(
            user_message=task,
            claude_session_id=kwargs.get("claude_session_id")
        )

    async def chat(
        self,
        user_message: str,
        claude_session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle user chat message.

        This is the primary interface for Thinking Partner.

        Args:
            user_message: User's message
            claude_session_id: Optional session to resume

        Returns:
            {
                "message": str,  # TP's response
                "claude_session_id": str,  # For resumption
                "work_outputs": List[dict],  # Any outputs TP emitted
                "actions_taken": List[str]  # What TP did
            }
        """
        logger.info(f"TP chat: {user_message[:100]}")

        # Start or resume session
        if claude_session_id:
            # Resume existing Claude session
            self._claude_ticket_id = claude_session_id
            logger.info(f"Resuming Claude session: {claude_session_id}")
        elif not self.current_session:
            # Start new session
            self.current_session = self._start_session()
            logger.info(f"Started new TP session: {self.current_session.id}")

        # Query memory for context
        context = None
        if self.memory:
            memory_results = await self.memory.query(user_message, limit=5)
            if memory_results:
                context = "\n".join([r.content for r in memory_results])

        # Call Claude with tools
        response = await self.reason(
            task=user_message,
            context=context,
            tools=self._tools,
            max_tokens=4096,
            resume_session=bool(claude_session_id)
        )

        # Track actions taken
        actions_taken = []

        # Parse response for tool uses and text
        response_text = ""
        if hasattr(response, 'content'):
            for block in response.content:
                if hasattr(block, 'text'):
                    response_text += block.text
                elif block.type == 'tool_use':
                    # Tool was used
                    tool_name = block.name
                    tool_input = block.input
                    actions_taken.append(f"Used tool: {tool_name}")

                    # Execute tool
                    tool_result = await self._handle_tool_use(tool_name, tool_input)

                    # Continue conversation with tool result
                    # (In production, this would be a proper agentic loop)
                    # For now, we'll include tool result in context for next turn
                    logger.info(f"Tool {tool_name} result: {tool_result[:200]}")

        # Parse work outputs (if TP emitted any)
        work_outputs = parse_work_outputs_from_response(response)

        # Extract Claude session ID from response
        new_claude_session_id = self._claude_ticket_id
        if hasattr(response, 'ticket_id'):
            new_claude_session_id = response.ticket_id
            self._claude_ticket_id = new_claude_session_id
            if self.current_session:
                self.current_session.claude_ticket_id = new_claude_session_id

        result = {
            "message": response_text or "Processing...",
            "claude_session_id": new_claude_session_id,
            "work_outputs": [o.to_dict() for o in work_outputs],
            "actions_taken": actions_taken,
            "session_id": self.current_session.id if self.current_session else None
        }

        logger.info(
            f"TP chat complete: {len(response_text)} chars, "
            f"{len(work_outputs)} outputs, {len(actions_taken)} actions"
        )

        return result


# ============================================================================
# Convenience Functions
# ============================================================================

def create_thinking_partner(
    basket_id: str,
    workspace_id: str,
    user_id: str,
    **kwargs
) -> ThinkingPartnerAgent:
    """
    Convenience factory for creating ThinkingPartnerAgent.

    Args:
        basket_id: Basket ID
        workspace_id: Workspace ID
        user_id: User ID
        **kwargs: Additional arguments for ThinkingPartnerAgent

    Returns:
        Configured ThinkingPartnerAgent instance
    """
    return ThinkingPartnerAgent(
        basket_id=basket_id,
        workspace_id=workspace_id,
        user_id=user_id,
        **kwargs
    )
