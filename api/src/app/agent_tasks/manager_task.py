"""
Module: agent_tasks.manager_task

Defines the Manager agent, its handoff logic, and related payload utilities.
Provides a FastAPI router for the /agent endpoint.
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime
import json
import urllib.request

from agents import Agent, Runner, handoff, RunContextWrapper
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions

from .strategy_agent import strategy
from .content_agent import content
from .repurpose_agent import repurpose
from .feedback_agent import feedback
from ..util.task_utils import create_task_and_session
from ..util.webhook import send_webhook
from .middleware.output_utils import build_payload, flatten_payload

# Pydantic model for Manager handoff payload
class HandoffData(BaseModel):
    clarify: str
    prompt: str

# Manager instructions
MANAGER_TXT = """
You are the Manager. When routing, you MUST call exactly one of these tools:
  • transfer_to_strategy
  • transfer_to_content
  • transfer_to_repurpose
  • transfer_to_feedback

Each call must pass a JSON object matching this schema (HandoffData):
{
  "clarify": "<optional follow-up question or empty string>",
  "prompt":  "<the text to send next>"
}

Do NOT output any other JSON or wrap in Markdown. The SDK will handle the rest.
"""

# Handoff callback: dispatch clarification messages back via webhook
async def on_handoff(ctx: RunContextWrapper[HandoffData], input_data: HandoffData):
    task_id = ctx.context['task_id']
    user_id = ctx.context['user_id']
    payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={'type': 'text', 'content': input_data.clarify},
        reason='handoff',
        trace=ctx.usage.to_debug_dict() if hasattr(ctx.usage, 'to_debug_dict') else [],
    )
    await send_webhook(flatten_payload(payload))

# Manager agent with specialist handoffs
manager = Agent(
    name="manager",
    instructions=prompt_with_handoff_instructions(MANAGER_TXT),
    handoffs=[
        handoff(agent=strategy,  on_handoff=on_handoff, input_type=HandoffData),
        handoff(agent=content,   on_handoff=on_handoff, input_type=HandoffData),
        handoff(agent=repurpose, on_handoff=on_handoff, input_type=HandoffData),
        handoff(agent=feedback,  on_handoff=on_handoff, input_type=HandoffData),
    ],
)

# Map of specialist agents for reference
AGENTS = {
    "strategy": strategy,
    "content": content,
    "repurpose": repurpose,
    "feedback": feedback,
}


# FastAPI router exposing the /agent endpoint
router = APIRouter()

@router.post("/agent")
async def agent_endpoint(request: Request):
    """Universal manager entrypoint for task orchestration."""
    # Delegate to the shared run_agent logic in agent_entrypoints
    from .manager_agent import manager
    from ..agent_entrypoints import run_agent
    return await run_agent(request)