"""
Module: agent_tasks.middleware.task_router

Routes tasks to their assigned agents and validates their outputs.
"""
from .prompt_builder import build_agent_prompt
from ..registry import get_all_task_types, get_task_def
import logging

# Logger for instrumentation
logger = logging.getLogger("uvicorn.error")
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
    # 1. Load task definition from centralized registry
    task_ids = [t.id for t in get_all_task_types()]
    logger.info("🗂️ Loaded task IDs: %s", task_ids)
    task_def = get_task_def(task_type_id)
    if not task_def:
        logger.error("❌ Asked for missing id: %s", task_type_id)
        raise ValueError(f"Unknown task_type_id '{task_type_id}'")

    agent_type = task_def.agent_type
    output_type = task_def.output_type


    # 2. Build the agent prompt
    prompt = build_agent_prompt(task_type_id, context, user_inputs)

    # 3. Select the agent based on agent_type
    if agent_type == "strategy":
        from ...holding.strategy_agent import strategy
        agent = strategy
    elif agent_type == "content":
        from ...holding.content_agent import content
        agent = content
    elif agent_type == "repurpose":
        from ...holding.repurpose_agent import repurpose
        agent = repurpose
    elif agent_type == "feedback":
        from ...holding.feedback_agent import feedback
        agent = feedback
    elif agent_type == "competitor":
        from ...holding.competitor_agent import competitor_agent
        agent = competitor_agent
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