"""
Module: agent_tasks.manager_agent

Manager Agent for Clarification-First Flow.
It accepts initial task_type and user input, iteratively clarifies missing fields,
and when all fields are gathered, dispatches to a downstream specialist agent.
"""
from agents import Agent
from ...layer2_tasks.registry import get_task_def

from ...holding.strategy_agent import strategy
from ...holding.content_agent import content
from ...holding.repurpose_agent import repurpose
from ...holding.feedback_agent import feedback
from ...holding.competitor_agent import competitor_agent

AGENTS = {
    "strategy": strategy,
    "content": content,
    "repurpose": repurpose,
    "feedback": feedback,
    "competitor": competitor_agent,
}

manager = Agent(
    name="manager",
    instructions="""
You are a task manager assistant within a multi-turn workflow. You have access to the following context variables:
  • task_type_id: the identifier of the current task type.
  • collected_inputs: a mapping of input field names to values already provided by the user.

Your job is to:
1. Compare the required input_fields for the given task_type_id (available via the task registry) against collected_inputs.
2. If any required field is missing or empty, ask a clarifying question only for one missing field at a time.
3. When all required fields have values, emit a dispatch JSON to hand off to the downstream specialist agent.

Output formats (exact JSON, no additional text):
- Clarification step:
  { "type": "clarification", "field": "<field_name>", "message": "<clarification question>" }
- Dispatch step (all inputs gathered):
  { "type": "structured", "agent_type": "<agent_type>", "task_type_id": "<task_type_id>", "input": { <field_name>: <value>, ... } }
"""
)