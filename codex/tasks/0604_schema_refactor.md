## codex/tasks/0604_schema_refactor.md

## 🛠️ Codex Patch Plan — Schema Refactor (Final Alignment)

This patch aligns the backend codebase to your **final Supabase schema**, scoped strictly to renaming/refactoring existing models and logic. It does **not** add new logic or features — focus is on compatibility and error-proof syncing.

---

### 🎯 Objective

> Refactor all models, queries, and Supabase logic to match the final schema.
> ✅ Remove legacy fields like `profile_core_data`
> ✅ Add new fields like `update_policy`, `feedback_score`, etc.
> ✅ Introduce new tables (e.g. `block_brief_link`) where applicable

---

### 📂 Affected Modules

| Module              | File(s)                                                          | Notes                                                     |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `context_blocks`    | `models/context_blocks.py`, `supabase/queries/context_blocks.py` | Add/update all columns to match schema                    |
| `block_files`       | `models/block_files.py`                                          | Add `storage_domain`, `is_primary`, `associated_block_id` |
| `task_briefs`       | `models/task_briefs.py`                                          | Add `compilation_mode`, remove deprecated profile fields  |
| `block_brief_link`  | `models/block_brief_link.py`                                     | New model — link blocks to briefs                         |
| `schemas/`          | `schemas/context.py`, `schemas/brief.py`, etc.                   | Add/adjust field definitions, align Pydantic models       |
| `composer_agent.py` | `agent_tasks/layer2_tasks/agents/`                               | Output format and DB write logic updated                  |
| `profile_core_data` | ❌ **REMOVE**                                                     | This table is deprecated                                  |

---

### 🧱 Schema Sync — Required Fixes by Table

#### `context_blocks`

* ✅ Add: `update_policy`, `feedback_score`, `last_used_successfully_at`
* ✅ Confirm: `file_ids` is an array of UUIDs
* ✅ Remove: Any leftover profile integration

#### `block_files`

* ✅ Add: `storage_domain` enum, `is_primary`, `associated_block_id`

#### `task_briefs`

* ✅ Add: `compilation_mode` as nullable text
* ✅ Confirm: `media`, `core_context_snapshot` are JSON
* ✅ Remove: `core_profile_data` if still in use

#### `block_brief_link`

* 🆕 New table with fields:

  * `id`, `block_id`, `task_brief_id`, `transformation`, `created_at`

#### `deployment_configs`

* ✅ No change, but confirm `task_brief_id` FK present

---

### 📤 Events / Views

* ✅ No schema changes, but ensure these are queried properly:

  * `view_block_usage_summary`
  * `view_user_brief_patterns`

---

### ✅ Acceptance Criteria

* All model files reflect final schema exactly
* Supabase insert/update/delete match column names
* No references to removed tables or columns (`profile_core_data`, etc.)
* Composer + agents read/write valid payloads based on new schema
* Optional: Create a test route or script to verify DB sync (optional by you)
