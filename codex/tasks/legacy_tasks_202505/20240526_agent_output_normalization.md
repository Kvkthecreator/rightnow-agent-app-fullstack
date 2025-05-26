## codex/tasks/20240526_agent_output_normalization.md

# Title
Normalize agent output so `output_json.data` is always an object

# Root Cause
The FastAPI `/agent-run` endpoint sometimes stores `output_json.data` as a
**raw string** (often fenced code-block JSON) when the LLM can’t complete the
task.  
The React `RendererSwitch` component assumes `data` is an object/array, so it
throws and the UI falls back to “Unable to load report.”

# Desired Outcome
* Every row in **reports.output_json** has:
  ```json
  {
    "output_type": "<TaskId>",
    "data": { ... }           // ← **always** an object
  }
If the agent fails, data must be { "error": "<human message>" }.

Implementation Steps

Add util api/src/app/utils/normalize_output.py:
import json, re

FENCE = re.compile(r"^```(?:json)?\s*([\s\S]+?)\s*```$", re.I)

def normalize_output(raw):
    # Step 1 – unwrap fenced block if present
    if isinstance(raw, str):
        m = FENCE.match(raw.strip())
        if m:
            raw = m.group(1)

        # Step 2 – try JSON-parse
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, (dict, list)):
                return parsed
        except Exception:
            pass
        return {"error": str(raw)}

    # Already dict or list
    return raw
Patch /agent-run handler:
from .utils.normalize_output import normalize_output
...
result = await run_agent_logic(...)
payload = {
    "output_type": task_type_id,
    "data": normalize_output(result),
}
supabase.table("reports").update({
    "output_json": payload,
    "status": "completed",
}).eq("id", report_id).execute()
Back-fill bad rows (optional CLI):
# scripts/fix_output_json.py
from utils.normalize_output import normalize_output
rows = supabase.table("reports").select("*").execute().data
for r in rows:
    if isinstance(r["output_json"]["data"], str):
        fixed = normalize_output(r["output_json"]["data"])
        supabase.table("reports").update({
            "output_json": { **r["output_json"], "data": fixed }
        }).eq("id", r["id"]).execute()
Acceptance Criteria

Running an agent with bad input stores
{"data": { "error": "…" }, "output_type": …}.
Existing malformed rows are fixed by the script.
/api/reports/:id shows data as an object in all cases.