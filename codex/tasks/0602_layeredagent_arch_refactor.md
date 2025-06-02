## codex/tasks/0602_layeredagent_arch_refactor.md

🧩 CODEX TASK: Layered Agent Architecture Refactor

Branch: refactor/layered-agent-architecture
Goal: Restructure all agent files and utilities under /agent_tasks using the new layered design: infra/, tasks/, output/.

✅ Move and Rename Agent Files
🔁 Move these files from api/src/app/agent_tasks/ to:

# Layer 1 — Infrastructure
api/src/app/agent_tasks/infra/
├── agents/
│   └── infra_manager_agent.py        (from manager_agent.py)
├── tools/                            (optional - migrate supabase_helpers here)
├── utils/                            (if needed)

# Layer 2 — Task Orchestration
api/src/app/agent_tasks/tasks/
├── agents/
│   ├── tasks_profile_analyzer_agent.py     (from profile_analyzer_agent.py)
│   ├── tasks_competitor_agent.py           (from competitor_agent.py)
├── registry.py                       (moved from registry.py)

# Layer 3 — Output Generation
api/src/app/agent_tasks/output/
├── agents/
│   ├── output_content_agent.py       (from content_agent.py)
│   ├── output_feedback_agent.py      (from feedback_agent.py)
│   ├── output_repurpose_agent.py     (from repurpose_agent.py)
│   ├── output_strategy_agent.py      (from strategy_agent.py)
❌ Remove or Absorb Legacy Folders
Folder	Action
tools/	🔥 Delete. Move tools to each layer as needed.
util/	🔥 Delete. Move supabase_helpers.py into infra/utils/ and task_utils.py into tasks/utils/
core/task_registry/	🎯 Absorb logic into tasks/registry.py
__pycache__/ files	🧹 Clean all — use .gitignore to avoid future clutter
🛠 Scaffold Empty Agents
In infra/agents/, scaffold:

infra_observer_agent.py
infra_analyzer_agent.py
infra_research_agent.py
Each can include:

from agents import Agent

infra_agent_name = Agent(
    name="infra_observer_agent",
    instructions="(TBD): Describe agent’s monitoring or enrichment responsibilities.",
    model="gpt-4.1-mini"
)
(Adjust names/instructions per agent file)

📦 Bonus Cleanup
If present:

Move prompt_builder.py, output_utils.py, task_router.py from middleware/ into appropriate layer folders (likely tasks/utils/)