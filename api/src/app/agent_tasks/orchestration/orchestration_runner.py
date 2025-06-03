# api/src/app/agent_tasks/orchestration/orchestration_runner.py
import asyncio
from agent_tasks.layer1_infra.agents.infra_analyzer_agent import run as run_analyzer

async def run_all():
    await run_analyzer()
    # later: observer, research, etc.

# allow CLI call "python -m agent_tasks.orchestration.orchestration_runner"
if __name__ == "__main__":
    asyncio.run(run_all())
