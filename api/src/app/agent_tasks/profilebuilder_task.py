"""
Module: agent_tasks.profilebuilder_task

Moves the ProfileBuilder conversation flow endpoint into agent_tasks.
"""
import os
from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Request, HTTPException

from ..util.supabase_helpers import get_collected_fields
from ..util.task_utils import create_task_and_session

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
KICKOFF_MESSAGE = (
    "Hi! I'm here to help build your creator profile. "
    "I'll ask you a few quick questions to understand your goals better."
)
FINAL_MESSAGE = (
    "Thanks! You can now review and edit your answers before generating your Insight Report."
)
PROFILE_WEBHOOK_URL = os.getenv("PROFILE_WEBHOOK_URL")
CHAT_WEBHOOK_URL = os.getenv("CLARIFICATION_WEBHOOK_URL")

# In-memory retry tracker for blank inputs: { task_id: { field_name: retry_count } }
retry_tracker: Dict[str, Dict[str, int]] = {}


@router.post("/profilebuilder")
async def profilebuilder_handler(req: Request):
    body = await req.json()
    user_id = body.get("user_id")
    prompt = body.get("prompt") or body.get("user_prompt") or body.get("message")
    if not user_id:
        raise HTTPException(422, "Missing user_id")
    original_task_id = body.get("task_id")
    # Initial call
    if not original_task_id:
        task_id = create_task_and_session(user_id, "profilebuilder")
        created_at = datetime.utcnow().isoformat()
        # Kickoff
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "agent_type": "profilebuilder",
                    "message_type": "text",
                    "message_content": KICKOFF_MESSAGE,
                    "created_at": created_at,
                },
            )
        # First question
        first_field, first_question = QUESTIONS[0]
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "agent_type": "profilebuilder",
                    "message_type": "text",
                    "message_content": first_question,
                    "created_at": created_at,
                },
            )
        return {"type": "text", "message_content": first_question}
    # Subsequent calls
    task_id = original_task_id
    if not prompt:
        raise HTTPException(422, "Missing prompt for existing session")
    # Fetch collected fields
    collected = get_collected_fields(user_id, task_id)
    created_at = datetime.utcnow().isoformat()

    # Next missing field
    next_field = None
    for key, question in QUESTIONS:
        if key not in collected:
            next_field = key
            current_question = question
            break
    # All done
    if next_field is None:
        message_to_send = FINAL_MESSAGE
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "agent_type": "profilebuilder",
                    "message_type": "step_complete",
                    "message_content": message_to_send,
                    "created_at": created_at,
                },
            )
        return {"type": "step_complete", "message_content": message_to_send}
    # Retry logic
    if not prompt.strip():
        task_retries = retry_tracker.setdefault(task_id, {})
        retries = task_retries.get(next_field, 0)
        if retries < 1:
            task_retries[next_field] = retries + 1
            message_to_send = current_question
            if CHAT_WEBHOOK_URL:
                await send_webhook(
                    CHAT_WEBHOOK_URL,
                    {
                        "task_id": task_id,
                        "user_id": user_id,
                        "agent_type": "profilebuilder",
                        "message_type": "text",
                        "message_content": message_to_send,
                        "created_at": created_at,
                    },
                )
            return {"type": "text", "message_content": message_to_send}
        # Skip field on second blank
        task_retries.pop(next_field, None)
        skip_fragment = {next_field: ""}
        if not PROFILE_WEBHOOK_URL:
            raise RuntimeError("PROFILE_WEBHOOK_URL env var is missing")
        await send_webhook(
            PROFILE_WEBHOOK_URL,
            {
                "task_id": task_id,
                "user_id": user_id,
                "agent_type": "profilebuilder",
                "message_type": "profile_partial",
                "message_content": skip_fragment,
                "created_at": created_at,
            },
        )
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
            message_to_send = f"No problem, we’ll move on for now. {next_question}"
        else:
            message_to_send = FINAL_MESSAGE
        if CHAT_WEBHOOK_URL:
            await send_webhook(
                CHAT_WEBHOOK_URL,
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "agent_type": "profilebuilder",
                    "message_type": "text",
                    "message_content": message_to_send,
                    "created_at": created_at,
                },
            )
        return {"type": "text", "message_content": message_to_send}
    # Persist field value
    field_value = prompt
    profile_fragment = {next_field: field_value}
    if not PROFILE_WEBHOOK_URL:
        raise RuntimeError("PROFILE_WEBHOOK_URL env var is missing")
    await send_webhook(
        PROFILE_WEBHOOK_URL,
        {
            "task_id": task_id,
            "user_id": user_id,
            "agent_type": "profilebuilder",
            "message_type": "profile_partial",
            "message_content": profile_fragment,
            "created_at": created_at,
        },
    )
    collected[next_field] = field_value
    retry_tracker.get(task_id, {}).pop(next_field, None)
    # Next question
    next_question = None
    for key, question in QUESTIONS:
        if key not in collected:
            next_question = question
            break
    message_to_send = next_question or FINAL_MESSAGE
    if CHAT_WEBHOOK_URL:
        await send_webhook(
            CHAT_WEBHOOK_URL,
            {
                "task_id": task_id,
                "user_id": user_id,
                "agent_type": "profilebuilder",
                "message_type": "text",
                "message_content": message_to_send,
                "created_at": created_at,
            },
        )
    return {"type": "text", "message_content": message_to_send}