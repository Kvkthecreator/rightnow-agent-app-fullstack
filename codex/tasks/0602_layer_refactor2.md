## codex/tasks/0602_layer_refactor2.md

*** 🧩 CODEX TASK: Finalize Layer 1 Refactor + Clean Up Legacy Folders ***
Branch: refactor/layered-agent-architecture
Repo Root: /api/src/app/

*** ✅ Objective ***

Finalize Layer 1 agent structure, clean up legacy folders, and temporarily set aside Layer 2/3 agents until their architecture is finalized.

*** ✅ 1. Finalize Layer 1 Agent Setup ***
Preserve these under:

agent_tasks/
└── infra/
    └── agents/
        ├── infra_manager_agent.py
        ├── infra_observer_agent.py
        ├── infra_analyzer_agent.py
        └── infra_research_agent.py
✅ Keep any updated imports for these agents across agent_server.py, agent_entrypoints.py, etc.

*** ❌ 2. Roll Back Layer 2 & 3 Agent Files ***
Move these into a staging folder:

agent_tasks/
└── holding/
    ├── profile_analyzer_agent.py        # from tasks/agents/
    ├── competitor_agent.py              # from tasks/agents/
    ├── content_agent.py                 # from output/agents/
    ├── feedback_agent.py
    ├── repurpose_agent.py
    ├── strategy_agent.py
✅ Restore all import paths in:

agent_server.py
agent_entrypoints.py
manager_agent.py
task_router.py
so they refer to agent_tasks/holding/ instead of tasks/agents/ or output/agents/.

*** 🧹 3. Clean & Absorb Legacy Folders ***
Folder	Action
tools/	🔥 Delete — rehome relevant logic like web_search.py into infra/tools/
util/	🔥 Delete — rehome supabase_helpers.py to infra/utils/, task_utils.py to tasks/utils/ if retained
core/task_registry/	Move to agent_tasks/tasks/registry.py, or delete if obsolete
__pycache__/	Remove any .pyc files from all old locations

*** 🗂️ 4. Keep Folder Skeletons for /tasks/ and /output/***
Keep these structures intact for future agent additions:

agent_tasks/
├── tasks/
│   ├── agents/       # (empty)
│   ├── tools/
│   ├── utils/
│   └── registry.py   # if ported from core/task_registry/

├── output/
│   ├── agents/       # (empty)
│   ├── renderers/
│   └── delivery/

*** 📌 5. Optional (Add README stubs) ***
For dev clarity, you can also generate lightweight README.md files in:

infra/
tasks/
output/
Each should describe that the folder follows the 3-layer architecture and the expected agent roles inside.

*** ✅ Output ***
Layer 1 fully clean and working
Layer 2/3 agents held in holding/
Legacy folders removed or merged
Codebase ready for focused agent development