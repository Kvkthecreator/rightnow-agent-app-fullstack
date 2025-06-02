"""
Utility: task_progress

Helper to track task progress and identify missing input fields for a given task type.
"""
from ...tasks.registry.models import TaskType, InputField

def get_missing_fields(task_type: TaskType, current_inputs: dict) -> list[InputField]:
    """
    Return list of InputField instances that are required by the task_type
    but not present or empty in current_inputs.
    """
    missing: list[InputField] = []
    for field in task_type.input_fields:
        value = current_inputs.get(field.name)
        if value is None or (isinstance(value, str) and not value.strip()) or (isinstance(value, (list, dict)) and not value):
            missing.append(field)
    return missing
 
def is_ready_to_dispatch(task_type_id: str, inputs: dict) -> bool:
    """
    Return True if no required input_fields are missing for the given task_type_id.
    """
    from ...tasks.registry import get_task_def as get_task_type

    task_type = get_task_type(task_type_id)
    if not task_type:
        raise ValueError(f"Unknown task_type_id '{task_type_id}'")
    missing = get_missing_fields(task_type, inputs)
    return len(missing) == 0