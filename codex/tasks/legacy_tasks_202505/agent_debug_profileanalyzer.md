## codex/tasks/agent_debug_profileanalyzer.md

Codex Task: Fix /profile_analyzer Response Handling
Context:
You recently updated the /profile_analyzer endpoint to use the OpenAI Agents SDK, running the profile_analyzer_agent via Runner.run(...).
Now, result.final_output is a Python dict (structured data), not a JSON string.
Currently, the endpoint tries to use .strip() or json.loads() on result.final_output, which fails since it's not a string.

Task:
Update the /profile_analyzer endpoint handler to:

Treat result.final_output as a Python dict.
Remove any .strip() or json.loads() calls on result.final_output.
Return result.final_output directly as the FastAPI response.
Ensure the endpoint returns valid structured JSON to the client.
Example (pseudo):

# OLD (buggy)
raw = result.final_output.strip()
parsed = json.loads(raw)
return parsed

# NEW (fix)
return result.final_output
Location:

File: api/src/app/agent_server.py
Function: The async /profile_analyzer endpoint (recently updated for the Jamie test).
