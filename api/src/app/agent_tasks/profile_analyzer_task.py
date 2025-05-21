"""
Module: agent_tasks.profile_analyzer_task

Defines the /profile_analyzer endpoint and delegates to the Profile Analyzer agent.
"""
import traceback
from fastapi import APIRouter, HTTPException, Request
from agents import Runner

from .profile_analyzer_agent import profile_analyzer_agent, ProfileAnalyzerInput
from .context import get_full_profile_context

router = APIRouter()

@router.post("/profile_analyzer")
async def profile_analyzer_endpoint(request: Request):
    """
    Accepts a profile analysis request and returns structured insights
    from the Profile Analyzer agent.
    """
    # Validate and parse input
    try:
        body = await request.json()
        payload = ProfileAnalyzerInput(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid request: {e}")

    # Load full profile context (profile row + report sections)
    full_context = get_full_profile_context(payload.user_id)
    profile_data = full_context.get("profile", {})

    # Prepare agent input text
    text = "\n".join(f"{k}: {v}" for k, v in profile_data.items())
    if full_context.get("report_sections"):
        text += "\n\nPrevious Report Sections:\n"
        for sec in full_context["report_sections"]:
            text += f"- {sec.get('title')}: {sec.get('body')}\n"
    input_message = {"role": "user", "content": [{"type": "input_text", "text": text}]}

    # Invoke the agent
    try:
        result = await Runner.run(
            profile_analyzer_agent,
            input=[input_message],
            context={"task_id": payload.task_id, "user_id": payload.user_id},
            max_turns=12,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error during analysis: {e}")

    # Return the final structured output
    return result.final_output