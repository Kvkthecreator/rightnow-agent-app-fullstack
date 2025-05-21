"""
Module: agent_tasks.middleware.output_utils

Provides utilities for building and flattening webhook payloads for agent tasks.
"""
from datetime import datetime

def build_payload(
    task_id: str,
    user_id: str,
    agent_type: str,
    message: dict,
    reason: str = "",
    trace: list = None,
) -> dict:
    """
    Build the nested webhook payload structure.

    :param task_id: Unique identifier for the task/session
    :param user_id: Identifier of the user
    :param agent_type: Name of the agent emitting the message
    :param message: Dict with keys 'type' and 'content'
    :param reason: Reason or metadata for this message
    :param trace: Optional trace/debug information
    :return: Nested payload dict
    """
    if trace is None:
        trace = []
    return {
        "task_id": task_id,
        "user_id": user_id,
        "agent_type": agent_type,
        "message": {"type": message.get("type"), "content": message.get("content")},
        "metadata": {"reason": reason},
        "trace": trace,
        "created_at": datetime.utcnow().isoformat(),
    }

def flatten_payload(payload: dict) -> dict:
    """
    Flatten the nested payload into the shape expected by the webhook receiver.

    :param payload: Nested payload dict from build_payload
    :return: Flattened dict with top-level keys
    """
    return {
        "task_id": payload["task_id"],
        "user_id": payload["user_id"],
        "agent_type": payload["agent_type"],
        "message_type": payload["message"]["type"],
        "message_content": payload["message"]["content"],
        "metadata_reason": payload.get("metadata", {}).get("reason", ""),
        "created_at": payload.get("created_at"),
    }