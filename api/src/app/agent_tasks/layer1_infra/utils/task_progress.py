"""Helpers for tracking task progress in Phase 1."""

from collections.abc import Iterable
from dataclasses import dataclass


@dataclass
class InputField:
    """Minimal InputField placeholder."""

    name: str


@dataclass
class TaskType:
    """Minimal TaskType placeholder."""

    id: str
    input_fields: Iterable[InputField]


def get_missing_fields(task_type: TaskType, current_inputs: dict) -> list[InputField]:
    """
    Return list of InputField instances that are required by the task_type
    but not present or empty in current_inputs.
    """
    missing: list[InputField] = []
    for field in task_type.input_fields:
        value = current_inputs.get(field.name)
        if (
            value is None
            or (isinstance(value, str) and not value.strip())
            or (isinstance(value, (list, dict)) and not value)
        ):
            missing.append(field)
    return missing
