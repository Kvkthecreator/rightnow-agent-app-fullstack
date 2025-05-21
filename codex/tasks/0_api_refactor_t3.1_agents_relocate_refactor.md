## codex/tasks/0_api_refactor_t3.1_agents_relocate_refactor.md

**Task 3.1: Codex Task: Split Specialist Agents Into Separate Files**


Task: Split Specialist Agents into Dedicated Files
Objective:
Refactor the codebase so that each specialist agent—strategy, content, repurpose, and feedback—lives in its own Python file under api/src/app/agent_tasks/. Remove the combined specialist_agents.py. Update all relevant imports and references across the backend.

Step-by-step Instructions:

For each specialist agent (strategy, content, repurpose, feedback):
Create a new file:
strategy_agent.py
content_agent.py
repurpose_agent.py
feedback_agent.py
Move the respective Agent class/definition and any directly related logic (e.g., Pydantic schemas if unique to that agent) into its dedicated file.
If there are common/shared helpers, move those to agent_tasks/middleware/ or a new agent_tasks/common.py as appropriate.
Remove specialist_agents.py entirely from agent_tasks/.
Update all imports in:
manager_task.py
agent_server.py
Any other module that references the specialist agents
to import the agents from their new files.
For example, change:
from .specialist_agents import strategy, content, repurpose, feedback
to:

from .strategy_agent import strategy
from .content_agent import content
from .repurpose_agent import repurpose
from .feedback_agent import feedback
If a SPECIALIST_AGENTS map is used (for agent lookups), recreate it in manager_task.py or in a new common.py and update all references.
Test all imports and endpoints:
Run a py_compile on all updated modules to verify no import errors.
Start the FastAPI backend and check that /agent and all specialist-agent flows still work.
Commit the changes with:
git add .
git commit -m "refactor: split specialist agents into one file per agent and update imports"
Purpose:
To ensure that each agent is modular, easy to extend, debug, and test—following best practices for a scalable agent system.