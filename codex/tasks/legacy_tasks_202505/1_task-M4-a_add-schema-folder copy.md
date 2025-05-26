## codex/tasks/1_task-M4-a_add-schema-folder.md

## Milestone M-4 — **Schema-validated outputs**

Two tasks: (a) add validator folder & first schema, (b) wire validation in `output_utils.py`.

---

### 📄 `codex/tasks/2_task-M4-a_add-schema-folder.md`

```md
# M-4 (a) — Add validator_schemas & first schema

## Changes
```diff
+ api/src/core/task_registry/validator_schemas/__init__.py
+ api/src/core/task_registry/validator_schemas/competitor_table.json
+ api/src/requirements.txt

*** ✨ validator_schemas/__init__.py ***
"""Holds JSON-Schema files keyed by output_type."""

*** ✨ competitor_table.json ***
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CompetitorTable",
  "type": "object",
  "required": ["competitors", "differentiation_summary"],
  "properties": {
    "competitors": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["handle", "positioning", "tone", "estimated_followers"],
        "properties": {
          "handle": { "type": "string" },
          "positioning": { "type": "string" },
          "tone": { "type": "string" },
          "estimated_followers": { "type": "integer" },
          "content_notes": { "type": "string" }
        }
      }
    },
    "differentiation_summary": { "type": "string" }
  }
}

*** ✨ requirements.txt (backend) ***
 jsonschema>=4.21
