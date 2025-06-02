## codex/tasks/0603_layer_folder_rename_and_doc.md

✅ OBJECTIVE
Rename agent_tasks/{infra,tasks,output} to layer1_infra, layer2_tasks, and layer3_output, then update all internal imports and drop a README.md in each layer folder.

✅ INSTRUCTIONS
1. Folder Renames:

Old Folder	New Folder
agent_tasks/infra/	agent_tasks/layer1_infra/
agent_tasks/tasks/	agent_tasks/layer2_tasks/
agent_tasks/output/	agent_tasks/layer3_output/
Retain exact substructure inside (agents/, utils/, tools/, etc.)
2. Update Import Paths

All files in agent_tasks, agent_server.py, agent_entrypoints.py, etc. must use the new paths.
Example:
from agent_tasks.infra.agents.infra_manager_agent
⟶ becomes

from agent_tasks.layer1_infra.agents.infra_manager_agent
3. Add README.md in Each Layer Folder

layer1_infra/README.md
# Layer 1 — Infra Agents

These agents maintain block health, freshness, and metadata integrity.
layer2_tasks/README.md
# Layer 2 — Task Agents

These agents execute domain-specific reasoning tasks based on task briefs and context blocks.
layer3_output/README.md
# Layer 3 — Output Agents

These agents produce structured deliverables and orchestrate final output formats.
4. Cleanup

Ensure no __pycache__ or .pyc files are left from before the move.