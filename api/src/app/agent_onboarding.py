import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import APIRouter, Request, HTTPException
from agents import Agent, Runner
from datetime import datetime
import json
import urllib.request
from .util.task_utils import create_task_and_session

router = APIRouter()

# Define the onboarding agent
onboarding_agent = Agent(
    name="OnboardingAgent",
    instructions="""
You are an onboarding assistant helping new influencers introduce themselves.
Your job is to:
1. Gently ask about their interests, content goals, and style.
2. Summarize their early profile with a few soft fields.
3. Optionally ask a clarifying follow-up question if needed.

Return your response in the following format:
{
  "output_type": "soft_profile",
  "contains_image": false,
  "details": {
    "interests": ["wellness", "fitness"],
    "preferred_style": "authentic, relaxed",
    "content_goals": "collaborations, brand storytelling",
    "next_question": "Would you consider doing live sessions?"
  }
}
Only reply in this format.
"""
)

@router.post("/onboard")
async def onboard_influencer(request: Request):
    data = await request.json()
    user_input = data.get("input", "")
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(422, "Missing 'user_id'")
    # Generate or reuse task_id for session
    task_id = data.get("task_id")
    if not task_id:
        task_id = create_task_and_session(user_id, "onboarding")
    webhook_url = data.get("webhook_url")
    debug_info = {}

    result = await Runner.run(onboarding_agent, input=user_input)

    try:
        parsed_output = json.loads(result.final_output)
        output_type = parsed_output.get("output_type")
        output_details = parsed_output.get("details")
        contains_image = parsed_output.get("contains_image", False)

        if not output_type or not output_details:
            raise ValueError("Missing required output keys")
    except Exception as e:
        parsed_output = None
        output_type = "raw_text"
        output_details = result.final_output
        contains_image = False
        debug_info["validation_error"] = str(e)
        debug_info["raw_output"] = result.final_output

    session = {
        "task_id": task_id,
        "agent_type": "onboarding",
        "user_id": user_id,
        "output_type": output_type,
        "contains_image": contains_image,
        "output_details": output_details,
        "created_at": datetime.utcnow().isoformat(),
    }

    if debug_info:
        session["debug_info"] = debug_info

    if webhook_url:
        # Send HTTP POST via urllib.request
        try:
            req = urllib.request.Request(
                webhook_url,
                data=json.dumps(session).encode('utf-8'),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req):
                pass
        except Exception as e:
            session["webhook_error"] = str(e)

    return session
