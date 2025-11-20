"""
Thinking Partner Tools - MCP Server Implementation

Official Claude Agent SDK pattern for custom tools.
These tools are packaged as an MCP server and registered with ClaudeAgentOptions.
"""

import logging
import json
import os
from typing import Any, Dict
from claude_agent_sdk import tool, create_sdk_mcp_server

logger = logging.getLogger(__name__)


@tool(
    "work_orchestration",
    "Delegate work to specialized agents (research, content, reporting)",
    {
        "agent_type": str,
        "task": str,
        "parameters": dict
    }
)
async def work_orchestration_tool(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute work_orchestration tool - delegates to specialist agents.

    This is the CRITICAL tool that makes TP functional as a gateway.
    When TP calls this tool, it:
    1. Creates work_request + work_ticket
    2. Executes the appropriate specialist agent
    3. Returns work_outputs for TP to synthesize
    """
    agent_type = args.get('agent_type')
    task = args.get('task')
    parameters = args.get('parameters', {})

    logger.info(f"MCP Tool work_orchestration: agent={agent_type}, task={task[:100]}")

    try:
        # Import required dependencies
        from app.routes.work_orchestration import run_agent_task, AgentTaskRequest

        # Get context from tool invocation (passed via tool metadata)
        basket_id = args.get('_basket_id')  # Injected by TP
        user_id = args.get('_user_id')  # Injected by TP

        # Map TP's task to task_type for specialist agents
        task_type = "deep_dive" if agent_type == "research" else "create" if agent_type == "content" else "generate"

        request = AgentTaskRequest(
            agent_type=agent_type,
            task_type=task_type,
            basket_id=basket_id,
            parameters={
                "topic": task,
                **parameters
            }
        )

        # Mock user for JWT
        user = {"sub": user_id, "user_id": user_id}

        # Execute agent
        result = await run_agent_task(request, user)

        # Extract work_outputs
        work_outputs = []
        if hasattr(result, 'result') and result.result:
            work_outputs = result.result.get('work_outputs', [])

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "status": "success",
                    "agent_type": agent_type,
                    "work_outputs_count": len(work_outputs),
                    "work_outputs": work_outputs[:3],  # Limit for token efficiency
                    "message": f"{agent_type.title()} agent completed with {len(work_outputs)} outputs"
                }, indent=2)
            }]
        }

    except Exception as e:
        logger.error(f"work_orchestration MCP tool FAILED: {e}", exc_info=True)
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "status": "error",
                    "agent_type": agent_type,
                    "error": str(e)
                })
            }]
        }


@tool(
    "infra_reader",
    "Query YARNNN work orchestration state (work_requests, work_tickets, etc)",
    {
        "query_type": str,
        "filters": dict
    }
)
async def infra_reader_tool(args: Dict[str, Any]) -> Dict[str, Any]:
    """Query work orchestration infrastructure."""
    query_type = args.get('query_type')
    filters = args.get('filters', {})
    basket_id = args.get('_basket_id')

    logger.info(f"MCP Tool infra_reader: query_type={query_type}")

    try:
        from app.utils.supabase import supabase_admin

        supabase = supabase_admin()
        results = []

        if query_type == "recent_work_requests":
            limit = filters.get('limit', 10)
            response = supabase.table("work_requests").select(
                "id, agent_type, work_mode, status, created_at"
            ).eq("basket_id", basket_id).order(
                "created_at", desc=True
            ).limit(limit).execute()
            results = response.data

        elif query_type == "work_tickets_by_status":
            status = filters.get('status', 'completed')
            response = supabase.table("work_tickets").select(
                "id, task_type, status, started_at, ended_at"
            ).eq("basket_id", basket_id).eq("status", status).limit(10).execute()
            results = response.data

        elif query_type == "agent_sessions":
            response = supabase.table("agent_sessions").select(
                "id, agent_type, last_active_at, created_at"
            ).eq("basket_id", basket_id).execute()
            results = response.data

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "status": "success",
                    "query_type": query_type,
                    "results_count": len(results),
                    "results": results[:5]
                }, indent=2)
            }]
        }

    except Exception as e:
        logger.error(f"infra_reader MCP tool FAILED: {e}", exc_info=True)
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({"status": "error", "error": str(e)})
            }]
        }


@tool(
    "steps_planner",
    "Plan multi-step workflows for complex requests",
    {
        "user_request": str,
        "existing_context": str
    }
)
async def steps_planner_tool(args: Dict[str, Any]) -> Dict[str, Any]:
    """Plan multi-step workflows using Claude."""
    user_request = args.get('user_request')
    existing_context = args.get('existing_context', '')

    logger.info(f"MCP Tool steps_planner: request={user_request[:100]}")

    try:
        from anthropic import AsyncAnthropic

        planning_prompt = f"""Given this user request:
"{user_request}"

Existing context:
{existing_context}

Create a structured execution plan with steps, agents, and dependencies.

Return JSON format:
{{
  "steps": [
    {{"step_num": 1, "agent": "research", "task": "...", "dependencies": []}},
    {{"step_num": 2, "agent": "content", "task": "...", "dependencies": [1]}}
  ]
}}"""

        client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2000,
            messages=[{"role": "user", "content": planning_prompt}]
        )

        plan_text = response.content[0].text

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "status": "success",
                    "user_request": user_request,
                    "plan": plan_text
                }, indent=2)
            }]
        }

    except Exception as e:
        logger.error(f"steps_planner MCP tool FAILED: {e}", exc_info=True)
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({"status": "error", "error": str(e)})
            }]
        }


# Create MCP server with all TP tools
def create_tp_tools_server():
    """Create MCP server for Thinking Partner tools."""
    return create_sdk_mcp_server(
        name="tp-tools",
        version="1.0.0",
        tools=[
            work_orchestration_tool,
            infra_reader_tool,
            steps_planner_tool
        ]
    )
