## codex/tasks/20250526_manager_tasktype_field_tracking.md

# Title
Implement task_type field tracking and status flow in manager agent

# Objective
Enable the manager agent to:
1. Track which `input_fields` for a task_type have been provided
2. Determine if sufficient information has been gathered to proceed
3. Store field-by-field updates progressively in Supabase or session
4. Provide clarifying prompts only for missing or ambiguous fields

# Rationale
This task builds on the new manager-agent clarification loop design.
Rather than asking the user for all fields at once or in a rigid order, the manager should have:
- Dynamic awareness of which fields are still missing
- The ability to converse naturally to fill them
- Memory of field values already provided

This increases success rates and user satisfaction for pre-defined task flows.

# Tasks

## 1. TaskType field lookup helper
- [ ] In `task_type_registry.py`, add a method:
  ```python
  def get_missing_fields(task_type_id: str, provided_data: dict) -> list[str]:
      # Returns the names of input_fields still needed based on what's in provided_data
  ```
- [ ] Validate `provided_data` using simple presence and non-empty checks

## 2. Extend manager_agent system prompt
- [ ] Modify the system prompt to:
  - Be aware of current task_type ID
  - Include a section with known fields vs. missing fields
  - Ask user for clarification only on remaining items

## 3. Persist input state for in-progress tasks
- [ ] In `agent_server.py`, store progressive input data in Supabase (e.g. `agent_sessions.inputs`) after each manager-agent message
- [ ] Update the message stream with role `system` to track `input_status`

## 4. Clarification-complete logic
- [ ] Add `is_ready_to_dispatch(task_type_id, inputs)` to return boolean
- [ ] When true, route to the downstream agent and begin structured generation

## 5. Testing
- [ ] Test with existing `analyze_competitors` and `create_7_day_plan` task types
- [ ] Include edge cases with partial and malformed input

# Output
A manager agent that can:
- Maintain a memory of per-field input state
- Prompt users for only what’s missing
- Automatically trigger downstream agents when complete
- Reduce friction in multi-turn flows
