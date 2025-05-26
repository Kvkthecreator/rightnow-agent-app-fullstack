## codex/tasks/br_agent_task_structure_2_prompt_composer_middleware.md

Task 2: Prompt Composer Middleware
Codex Task 2 Prompt

Create a function build_agent_prompt(task_type_id: str, context: dict, user_inputs: dict) in /api/agent_tasks/middleware/prompt_builder.py that:
Loads the corresponding task definition from task_types.json.
Merges the prompt_template from the task definition with values from both context (profile fields, report sections) and user_inputs (collected from the frontend for this task run).
Returns a prompt string ready for the agent (with clear, readable formatting).
Requirements:
Place this function in /api/agent_tasks/middleware/prompt_builder.py.
Show an example usage: For the task analyze_competitors, with a sample profile, report section, and user_inputs, show the exact prompt that would be generated.
Add clear comments for future contributors on where/how to expand context merging logic.
(If helpful, show a helper to load the JSON task_types registry for lookups.)
Show both the function code and an example of the output prompt string.