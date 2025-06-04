# AGENTS.md

This document defines the key agents within the Context OS backend. Each agent performs a specific reasoning, enrichment, or orchestration task. Use this as a reference for development, testing, or creating new agents.

---

## 🧠 Agent: `orch_block_manager_agent`

**File**: `api/agents/orch_block_manager_agent.py`  
**Role**: Classifies, enriches, and maintains `context_blocks` to ensure structured, reusable brand context.  
**Schema Target**: `context_blocks`

### 🧩 Responsibilities

- Automatically tag and enrich new or updated context blocks
- Populate metadata fields such as:
  - `meta_tags` (e.g., "tone", "mission", "audience")
  - `meta_context_scope` (e.g., "global", "campaign-specific")
  - `meta_agent_notes` (agent-generated notes)
  - `meta_refreshable`, `meta_derived_from`
- Respect `update_policy` field:
  - `manual`: skip automatic updates
  - `auto`: allow enrichment/refinement

### 🔄 Trigger Events

- `block.created`
- `block.updated`

### ✅ Output

- Update to `context_blocks` row:
  - New metadata fields
  - Optional structure fix (formatting, normalization)
  - JSON patch style output (or full object replacement)

---

## 🧾 Agent: `orch_brief_composer_agent`

**File**: `api/agents/orch_brief_composer_agent.py`  
**Role**: Synthesizes a new `task_brief` based on selected context blocks and user intent.  
**Schema Target**: `task_briefs`

### 🧩 Responsibilities

- Accept input:
  - `block_ids` (selected from context)
  - `task_type` (what the user wants to do)
  - `compilation_mode` (e.g., `exploratory`, `structured`)
- Generate:
  - Title, summary
  - Proposed action steps
  - Clarification or confirmation needs (if any)

### 🔄 Trigger Events

- `brief.compose_request`

### ✅ Output

- New row in `task_briefs`:
  - `core_context_snapshot` (from blocks)
  - `title`, `summary`, `instructions`, `output_expectation`
  - `is_draft = true`
- Emits `brief.draft_created` event

---

## 🧪 Agent: `orch_brief_validator_agent` (Planned)

**Role**: Validates and optionally adjusts a task brief before final submission.  
**Stage**: Optional refinement agent post-creation.  
**Status**: ✴️ Planned, not yet implemented.

---

## Shared Schema Fields (Reference)

### `context_blocks`
- `id`, `title`, `body`
- `type` (`tone`, `audience`, `mission`, etc.)
- `update_policy` (`manual`, `auto`)
- `meta_tags`, `meta_context_scope`, `meta_agent_notes`
- `meta_refreshable`, `meta_derived_from`
- `data_type`, `is_draft`

### `task_briefs`
- `id`, `title`, `summary`
- `task_type`, `block_ids`, `core_context_snapshot`
- `compilation_mode`, `output_expectation`, `is_draft`

---

## Notes

- Agents should emit standardized events (`block.updated`, `brief.draft_created`) via webhook.
- Agent behavior is influenced by `update_policy`, `task_type`, and system configuration (e.g. `compilation_mode`).
- Codex tasks can reference this file to understand and modify agent behavior intelligently.

