## codex/tasks/0602_context2_folderaudit.md

## 🧠 CODEX TASK: Inventory All Existing Agents and Their Locations

**Goal:** Identify all existing agent implementations in the codebase so we can refactor and align with a new Layered Agent Architecture.

### 📁 Repo:
https://github.com/Kvkthecreator/rightnow-agent-app-fullstack

### ✅ What to Inspect:
1. All files in `api/src/` (especially `app/`, `core/`, or anywhere agent logic is defined)
2. Any class or variable that instantiates an `Agent` or agent-like object
3. The file name and folder where each agent is defined

### ✅ What to Output:
- A table of all agents found with:
  - File path
  - Agent name or identifier (e.g. `manager`, `strategy`)
  - Assigned tools (if any)
  - Associated model (if any)
  - Any prompt instructions (brief summary)
- Any shared agent logic, tools, or helpers found
- Highlight files or logic that appear outdated, unused, or duplicate

### 🧱 Goal of Audit:
Prepare to refactor into:
- `/agent_tasks/infra/`
- `/agent_tasks/tasks/`
- `/agent_tasks/output/`
- `/agent_tasks/shared/`

---

Once you run this, paste the results back here, and I’ll give you:
- ✅ Exact folder moves
- ❌ What to delete
- 🔁 What needs rewriting
- 🆕 What to scaffold for Layer 1 agents

Would you like a Codex CLI command too if you're running this locally via the Codex plugin?
