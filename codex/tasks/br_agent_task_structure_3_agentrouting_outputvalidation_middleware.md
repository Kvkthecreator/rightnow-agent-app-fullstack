## codex/tasks/br_agent_task_structure_3_agentrouting_outputvalidation_middleware.md

Implement agent routing and output validation, so that each task run knows which agent to call, how to validate the output, and how to route it to the correct UI renderer.

Task 3: Agent Routing & Output Validation Middleware
Codex Task 3 Prompt

Create a middleware function route_and_validate_task(task_type_id: str, context: dict, user_inputs: dict) in /api/agent_tasks/middleware/task_router.py that:
Loads the task_type definition from task_types.json to determine which agent_type should handle the task.
Uses the prompt builder to create the agent prompt, then dispatches it to the appropriate agent runner (e.g., strategy, content, feedback agent).
After the agent runs, validates the returned output structure (according to the expected output_type defined in the task).
Returns a dictionary containing raw_output, validated_output, and output_type.
Requirements:
Show sample code using a mock agent runner (or a placeholder if no live agent code).
Show where you’d plug in different agents and validation logic.
Add clear comments for future contributors.
Show a sample usage for the analyze_competitors task.
Show both the middleware code and an example output structure.