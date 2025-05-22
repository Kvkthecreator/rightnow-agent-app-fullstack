"""
Module: agent_tasks.middleware.output_utils

Provides utilities for building and flattening webhook payloads for agent tasks.
"""
import json
from pathlib import Path
from datetime import datetime
from jsonschema import validate, ValidationError
from core.task_registry import get_task_type

SCHEMA_DIR = Path(__file__).parents[3] / "core" / "task_registry" / "validator_schemas"

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

def validate_agent_output(task_type_id: str, raw_output: str) -> dict:
    """
    Parse JSON string -> dict, then JSON-Schema validate
    using schema mapped by TaskType.output_type (if a schema exists).
    """
    data = json.loads(raw_output)

    task = get_task_type(task_type_id)
    schema_path = SCHEMA_DIR / f"{task.output_type}.json"
    if schema_path.exists():
        try:
            with open(schema_path) as f:
                schema = json.load(f)
            validate(instance=data, schema=schema)
        except ValidationError as exc:
            raise ValueError(f"Output failed schema validation: {exc.message}") from exc

    return data