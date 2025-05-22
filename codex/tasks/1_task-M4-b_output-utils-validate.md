## codex/tasks/1_task-M4-b_output-utils-validate.md

# M-4 (b) — Hook validator into output_utils.py

## Changes
```diff
* api/src/app/agent_tasks/middleware/output_utils.py

*** 🔧 Patch ***
@@
-import json
+import json
+from jsonschema import validate, ValidationError
+from core.task_registry import get_task_type
+from pathlib import Path
+
+SCHEMA_DIR = Path(__file__).parents[3] / "core" / "task_registry" / "validator_schemas"
 
 def validate_agent_output(task_type_id: str, raw_output: str):
-    """Parse JSON string -> dict  (old behaviour)."""
+    """
+    Parse JSON string -> dict, then (NEW) JSON-Schema validate
+    using schema mapped by TaskType.output_type (if a schema exists).
+    """
     data = json.loads(raw_output)
+
+    task = get_task_type(task_type_id)
+    schema_path = SCHEMA_DIR / f"{task.output_type}.json"
+    if schema_path.exists():
+        try:
+            with open(schema_path) as f:
+                schema = json.load(f)
+            validate(instance=data, schema=schema)
+        except ValidationError as exc:
+            raise ValueError(f"Output failed schema validation: {exc.message}") from exc
+
     return data


`output_utils.validate_agent_output()` is already called by
`task_router.route_and_validate_task`; it now raises if the agent’s JSON
doesn’t match the schema.

---

### ✔️  After M-4

```bash
python - <<'PY'
from core.task_registry import get_task_type
from app.agent_tasks.middleware.output_utils import validate_agent_output
raw = '{"competitors":[{"handle":"@x","positioning":"x","tone":"x","estimated_followers":1}],"differentiation_summary":"y"}'
validate_agent_output("analyze_competitors", raw)   # should pass
PY
