## codex/tasks/0603_layer_refactor3.md

*** 🧩 CODEX TASK: Final Cleanup — Remove core/, Move schemas.py, Organize scripts/ ***
Branch: refactor/layered-agent-architecture
Root: /api/src/app/

✅ OBJECTIVE

Cleanly refactor all remaining legacy folders and fully migrate to the new Layered Agent Architecture.

*** ✅ 1. Move core/task_registry/ to Layer 2 ***
Move core/task_registry/models.py → agent_tasks/tasks/registry/models.py
Move core/task_registry/validator_schemas/ → agent_tasks/tasks/registry/validator_schemas/
Move core/task_registry/providers/ → agent_tasks/tasks/registry/providers/
Delete core/task_registry/ and core/ once empty

*** ✅ 2. Move and Rename schemas.py ***
Move /api/src/schemas.py → agent_tasks/shared/inbound_schemas.py
Optionally rename:
Inbound → InboundPayload
Update all relevant imports:
agent_entrypoints.py
agent_server.py
Any test or utility files using NewTask or NewMessage

*** ✅ 3. Organize Scripts by Layer ***
Move:
scripts/fix_output_json.py → scripts/output/fix_output_json.py
Create placeholder folders:
scripts/infra/
scripts/tasks/
scripts/output/
Add a top-level scripts/README.md with:
“All developer scripts are now scoped by agent layer. Place CLI, refresh, or migration tools here.”

*** ✅ 4. Clean Pycache and Redundant Files ***
Delete all remaining:
__pycache__/ folders
.pyc files
Any empty __init__.py left in removed core/ subdirs

*** ✅ Final Structure Goal: ***
agent_tasks/
├── shared/
│   └── inbound_schemas.py
├── tasks/
│   └── registry/
│       ├── models.py
│       ├── validator_schemas/
│       └── providers/
scripts/
├── infra/
├── tasks/
├── output/
│   └── fix_output_json.py
