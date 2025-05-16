from .util.supabase_helpers import get_collected_fields
from .util.webhook import send_webhook          # make sure this import path is right
from .util.task_utils import create_task_and_session
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
import os
from typing import Dict

router = APIRouter()
# Profilebuilder conversation flow configuration
QUESTIONS = [
    ("niche", "What niche or topic best describes your content?"),
    ("audience_goal", "Who are you hoping to reach?"),
    ("platforms", "Which platforms do you post on?"),
    ("follower_count", "Roughly how many followers do you have in total?"),
    ("content_frequency", "How often do you post?"),
    ("monetization_goal", "What's your primary revenue goal?"),
]
KICKOFF_MESSAGE = "Hi! I'm here to help build your creator profile. I'll ask you a few quick questions to understand your goals better."
FINAL_MESSAGE = "Thanks! You can now review and edit your answers before generating your Insight Report."
PROFILE_WEBHOOK_URL = os.getenv("PROFILE_WEBHOOK_URL")
CHAT_WEBHOOK_URL    = os.getenv("CLARIFICATION_WEBHOOK_URL")

# In-memory retry tracker for blank inputs: { task_id: { field_name: retry_count } }
retry_tracker: Dict[str, Dict[str, int]] = {}


@router.post("/profilebuilder")
async def profilebuilder_handler(req: Request):
    body = await req.json()
    # Extract user_id and prompt
    user_id = body.get("user_id")
    prompt = body.get("prompt") or body.get("user_prompt") or body.get("message")
    # Validate presence of user_id
    if not user_id:
        raise HTTPException(422, "Missing user_id")
    # Determine if this is the initial call (no task_id)
    original_task_id = body.get("task_id")
    # Initial call: start session and send kickoff + first question
    if not original_task_id:
        task_id = create_task_and_session(user_id, "profilebuilder")
        created_at = datetime.utcnow().isoformat()
        # Kickoff message
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id":         task_id,
                    "user_id":         user_id,
                    "agent_type":      "profilebuilder",
                    "message_type":    "text",
                    "message_content": KICKOFF_MESSAGE,
                    "created_at":      created_at,
                },
            )
        # First question
        first_field, first_question = QUESTIONS[0]
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id":         task_id,
                    "user_id":         user_id,
                    "agent_type":      "profilebuilder",
                    "message_type":    "text",
                    "message_content": first_question,
                    "created_at":      created_at,
                },
            )
        return {"type": "text", "message_content": first_question}
    # Subsequent calls: must have prompt
    task_id = original_task_id
    if not prompt:
        raise HTTPException(422, "Missing prompt for existing session")
    # Debug log for user prompt
    print(f"[profilebuilder] user_id={user_id} task_id={task_id} prompt={prompt}")
    # Fetch existing collected fields from Supabase (keys of answered fields)
    collected = get_collected_fields(user_id, task_id)
    created_at = datetime.utcnow().isoformat()

    # Determine which field this prompt answers (next missing field)
    next_field = None
    for key, question in QUESTIONS:
        if key not in collected:
            next_field = key
            current_question = question
            break
    if next_field is None:
        # All fields already collected; send final message
        message_to_send = FINAL_MESSAGE
        print(f"[profilebuilder] All fields collected. Sending final message and marking step complete.")
        # Send step_complete webhook for frontend auto-transition
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id":         task_id,
                    "user_id":         user_id,
                    "agent_type":      "profilebuilder",
                    "message_type":    "step_complete",
                    "message_content": message_to_send,
                    "created_at":      created_at,
                },
            )
        return {"type": "step_complete", "message_content": message_to_send}

    # Retry logic for blank or whitespace-only input
    if not prompt.strip():
        # Track retries for this task and field
        task_retries = retry_tracker.setdefault(task_id, {})
        retries = task_retries.get(next_field, 0)
        if retries < 1:
            # First blank: repeat the question
            task_retries[next_field] = retries + 1
            message_to_send = current_question
            print(f"[profilebuilder] Blank input for field '{next_field}', retrying once.")
            if CHAT_WEBHOOK_URL:
                await send_webhook(
                    CHAT_WEBHOOK_URL,
                    {
                        "task_id":         task_id,
                        "user_id":         user_id,
                        "agent_type":      "profilebuilder",
                        "message_type":    "text",
                        "message_content": message_to_send,
                        "created_at":      created_at,
                    },
                )
            return {"type": "text", "message_content": message_to_send}
        # Second blank: skip field and move on
        # Clear retry count for this field
        task_retries.pop(next_field, None)
        # Persist a blank fragment to mark as skipped
        skip_fragment = {next_field: ""}
        print(f"[profilebuilder] Blank input again for field '{next_field}', skipping field.")
        if not PROFILE_WEBHOOK_URL:
            raise RuntimeError("PROFILE_WEBHOOK_URL env var is missing")
        await send_webhook(
            PROFILE_WEBHOOK_URL,
            {
                "task_id":         task_id,
                "user_id":         user_id,
                "agent_type":      "profilebuilder",
                "message_type":    "profile_partial",
                "message_content": skip_fragment,
                "created_at":      created_at,
            },
        )
        # Determine next missing field after skip
        temp = dict(collected)
        temp[next_field] = ""
        next_missing = None
        next_question = None
        for key, question in QUESTIONS:
            if key not in temp:
                next_missing = key
                next_question = question
                break
        if next_missing:
            print(f"[profilebuilder] Skipped field '{next_field}', next field: '{next_missing}'")
            message_to_send = f"No problem, we’ll move on for now. {next_question}"
        else:
            print(f"[profilebuilder] Skipped last field '{next_field}', completing.")
            message_to_send = FINAL_MESSAGE
        # Send next prompt or final message
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id":         task_id,
                    "user_id":         user_id,
                    "agent_type":      "profilebuilder",
                    "message_type":    "text",
                    "message_content": message_to_send,
                    "created_at":      created_at,
                },
            )
        return {"type": "text", "message_content": message_to_send}

    # Persist the current field value
    field_value = prompt
    profile_fragment = {next_field: field_value}
    print(f"[profilebuilder] Collected field '{next_field}' = '{field_value}'")
    if not PROFILE_WEBHOOK_URL:
        raise RuntimeError("PROFILE_WEBHOOK_URL env var is missing")
    await send_webhook(
        PROFILE_WEBHOOK_URL,
        {
            "task_id":         task_id,
            "user_id":         user_id,
            "agent_type":      "profilebuilder",
            "message_type":    "profile_partial",
            "message_content": profile_fragment,
            "created_at":      created_at,
        },
    )
    # Update local collected and clear any retry count for this field
    collected[next_field] = field_value
    retry_tracker.get(task_id, {}).pop(next_field, None)

    # Determine the next missing field for follow-up question
    follow_up = None
    for key, question in QUESTIONS:
        if key not in collected:
            follow_up = question
            next_field_name = key
            break

    # Log next field selection
    if follow_up:
        print(f"[profilebuilder] Next field to collect: '{next_field_name}'")
    else:
        print(f"[profilebuilder] All fields collected. Sending final message.")

    # Prepare message to send
    message_to_send = follow_up if follow_up else FINAL_MESSAGE
    # Determine webhook message_type and return type
    msg_type = "text" if follow_up else "step_complete"
    if CHAT_WEBHOOK_URL:
        await send_webhook(
            CHAT_WEBHOOK_URL,
            {
                "task_id":         task_id,
                "user_id":         user_id,
                "agent_type":      "profilebuilder",
                "message_type":    msg_type,
                "message_content": message_to_send,
                "created_at":      created_at,
            },
        )
    return {"type": msg_type, "message_content": message_to_send}