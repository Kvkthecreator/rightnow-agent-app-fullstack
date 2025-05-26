## codex/tasks/br_agent_task_structure_1_profilecontext.md

Codex Task 1 Prompt
Create a Python function in my backend repo called get_full_profile_context(user_id: str) that:
Loads the profile row for the given user from the profiles table (Supabase).
Loads all report sections for that profile from the profile_report_sections table.
Returns a single dictionary/object with keys profile and report_sections, each containing their respective data.
Place this function in a new file, e.g., agent_tasks/context.py.
Additionally:
Update my /agent (or relevant agent invocation) endpoint to call this function and pass the context to any downstream agent logic.
Add comments so it’s clear how to expand this context bundle in the future (e.g., add analytics, campaign history, etc.).
Use Supabase’s Python client (or pseudo-code if not installed), and show a sample return object for a sample user.
Show both the function code and the suggested endpoint usage in my FastAPI backend.