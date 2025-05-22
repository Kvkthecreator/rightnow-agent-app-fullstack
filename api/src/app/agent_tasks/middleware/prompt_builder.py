"""
Module: agent_tasks.middleware.prompt_builder

Builds agent prompts by merging task templates with runtime context and user inputs.
"""
import json
from pathlib import Path
from core.task_registry import get_task_type

# Path to the JSON registry of task definitions (moved to agent_tasks root)
TASK_TYPES_FILE = Path(__file__).parent.parent / "task_types.json"

def load_task_types() -> dict:
    """
    Load and return the task type definitions from the JSON registry.
    Returns an empty dict on error.
    """
    try:
        with open(TASK_TYPES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[PromptBuilder] Error loading task_types.json: {e}")
        return {}

def build_agent_prompt(task_type_id: str, context: dict, user_inputs: dict) -> str:
    """
    Build a prompt string for the specified task type by merging the prompt template
    with provided context and user input values.

    :param task_type_id: Identifier of the task in task_types.json
    :param context: Runtime context (e.g., {'profile': {...}, 'report_sections': [...]})
    :param user_inputs: Additional user-provided inputs for this task run
    :return: A formatted prompt ready to send to the agent
    """
    # 1) Load task definitions
    tasks = load_task_types()
    task_def = tasks.get(task_type_id)
    if not task_def:
        raise ValueError(f"Unknown task_type_id '{task_type_id}'")

    template = task_def.get('prompt_template', '')

    # ------------------------------------------------------------------
    # NEW: prepend tool availability note based on TaskType.tools
    # ------------------------------------------------------------------
    registry_task = get_task_type(task_type_id)
    if registry_task and registry_task.tools:
        tool_note = (
            "You have access to the following external tools during reasoning: "
            + ", ".join(registry_task.tools)
            + ".\n\n"
        )
    else:
        tool_note = ""
    template = tool_note + template
    # 2) Flatten context and inputs for simple template substitution
    flat_data = {}
    # a) Profile fields, prefixed to avoid naming collisions
    profile = context.get('profile', {}) or {}
    for k, v in profile.items():
        flat_data[f'profile_{k}'] = v
    # b) Report sections as numbered list
    sections = context.get('report_sections', []) or []
    section_lines = []
    for idx, sec in enumerate(sections, start=1):
        title = sec.get('title', '')
        body = sec.get('body', '')
        section_lines.append(f"{idx}. {title}: {body}")
    flat_data['report_sections'] = '\n'.join(section_lines)
    # c) User inputs
    for k, v in (user_inputs or {}).items():
        flat_data[k] = v

    # 3) Perform template substitution
    try:
        prompt = template.format(**flat_data)
    except Exception as e:
        print(f"[PromptBuilder] Error formatting prompt: {e}")
        prompt = template

    return prompt