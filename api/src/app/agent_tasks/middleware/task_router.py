"""
Module: agent_tasks.middleware.task_router

Routes tasks to their assigned agents and validates their outputs.
"""
from .prompt_builder import build_agent_prompt
from core.task_registry import get_task_type
from app.tools import get_tool_clients
from agents import Runner

def validate_output(raw_output: dict, output_type: str) -> dict:
    """
    Validate raw_output against the expected schema for output_type.
    Returns the validated subset or raises ValueError on mismatch.
    """
    if output_type == "analysis_sections":
        # Expect a 'sections' list of {title, content} dicts
        sections = raw_output.get("sections")
        if not isinstance(sections, list):
            raise ValueError("Invalid output: 'sections' must be a list")
        for sec in sections:
            if not isinstance(sec, dict) or "title" not in sec or "content" not in sec:
                raise ValueError("Each section must be a dict with 'title' and 'content'")
        return {"sections": sections}
    # No-op for untyped outputs
    return raw_output

async def route_and_validate_task(
    task_type_id: str,
    context: dict,
    user_inputs: dict
) -> dict:
    """
    Load task definition, build prompt, dispatch to correct agent,
    validate its output, and return both raw and validated outputs.

    Returns:
      { 'raw_output': dict, 'validated_output': dict, 'output_type': str }
    """
    # 1. Load task definition
    task_def = get_task_type(task_type_id)
    if not task_def:
        raise ValueError(f"Unknown task_type_id '{task_type_id}'")

    agent_type = task_def.agent_type
    output_type = task_def.output_type

    # ------------------------------------------------------------------
    # NEW: build list[Tool] for this task
    # ------------------------------------------------------------------
    tool_clients = get_tool_clients(task_def.tools)

    # 2. Build the agent prompt
    prompt = build_agent_prompt(task_type_id, context, user_inputs)

    # 3. Select the agent based on agent_type
    if agent_type == "strategy":
        from ..strategy_agent import strategy as StrategyAgent
        agent = StrategyAgent(tools=tool_clients)
    elif agent_type == "content":
        from ..content_agent import content as ContentAgent
        agent = ContentAgent(tools=tool_clients)
    elif agent_type == "repurpose":
        from ..repurpose_agent import repurpose as RepurposeAgent
        agent = RepurposeAgent(tools=tool_clients)
    elif agent_type == "feedback":
        from ..feedback_agent import feedback as FeedbackAgent
        agent = FeedbackAgent(tools=tool_clients)
    else:
        raise ValueError(f"Unknown agent_type: {agent_type}")

    # 4. Run the agent
    result = await Runner.run(
        agent,
        input=[{"role": "user", "content": prompt}],
        context={"task_type": task_type_id, **context},
    )
    raw_output = result.final_output

    # 5. Validate the output
    validated = validate_output(raw_output, output_type)

    return {
        "raw_output": raw_output,
        "validated_output": validated,
        "output_type": output_type,
    }

# === Sample Usage ===
# async def example():
#     context = { 'profile': {...}, 'report_sections': [...] }
#     inputs = { 'competitors_list': 'A, B, C' }
#     output = await route_and_validate_task(
#         'analyze_competitors', context, inputs
#     )
#     # output -> {
#     #    'raw_output': {...},
#     #    'validated_output': {'sections': [...]},
#     #    'output_type': 'analysis_sections'
#     # }