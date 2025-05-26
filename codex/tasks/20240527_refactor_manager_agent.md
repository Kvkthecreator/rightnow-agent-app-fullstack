## codex/tasks/20240527_refactor_manager_agent.md

# Title
Refactor Manager Agent for Clarification-First Flow

# Objective
Upgrade the `manager_agent` to act as a reasoning-first router that:
1. Accepts an initial task_type and user input
2. Iteratively clarifies missing fields required by the `task_type`
3. Tracks clarification status and outputs until all required fields are gathered
4. Handoffs control to a downstream specialist agent with full context

---

# Step 1: Create `manager_agent.py`
Create `api/src/app/agent_tasks/manager_agent.py`.

```python
from agents import Agent
from app.db.task_type_registry import get_task_type

manager_agent = Agent(
    name="manager",
    instructions="""
You are a task manager assistant. Your job is to:
1. Clarify any missing input fields required by the current task_type.
2. Maintain conversational memory of user replies.
3. Only when all fields are ready, call the appropriate downstream agent.

Output types:
- { "type": "clarification", "field": "follower_count", "message": "How many followers do you have?" }
- { "type": "structured", "agent_type": "competitor", "input": {"field1": "...", ...} }
"""
)
```

---

# Step 2: Update manager session logic
In `agent_server.py`, update `handle_agent_session()` to:
- On new session: load task_type definition
- Save clarification responses to session memory (in Supabase or in-memory state for now)
- After each user reply, check which required fields are still missing
- Ask clarification if needed (`type: clarification`)
- When all fields are present, call the correct agent and return `type: structured`

---

# Step 3: Task type registry support
Update `db/task_type_registry.py` to expose:
- `get_task_type(task_type_id)` returns `input_fields` and `agent_type`
- Each field has:
```ts
interface InputField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'url' | 'markdown';
}
```

---

# Step 4: Codex-Only Schema Tracking Helper (Optional)
Add `app/util/task_progress.py`:
```python
def get_missing_fields(task_type, current_inputs):
    return [f for f in task_type.input_fields if not current_inputs.get(f.name)]
```

---

# Step 5: Output normalization contract
Downstream agents (e.g. `competitor_agent`) must respond in:
```json
{
  "type": "structured",
  "output_type": "CompetitorTable",
  "data": { ... }
}
```

---

# Notes
- Don’t forget to add `manager_agent` to your registry
- Clarification messages will be rendered as chat in frontend
- Downstream agent is only called once all fields confirmed

Let me know when ready to scaffold `jobs` schema or front-end integration.
