# api/src/app/agent_tasks/orch/orchestration_runner.py
# (When you call the nightly cron script, it will now hang "forever" listening
# for events; that is fine on Render or a worker dyno. For GitHub Actions you
# might instead want a 5-minute timeout.)

import asyncio

from app.agent_tasks.layer1_infra.agents.infra_analyzer_agent import run as run_analyzer
from app.agent_tasks.layer1_infra.agents.infra_observer_agent import run as run_observer
from app.agent_tasks.orchestration.orch_block_manager_agent import (
    run as run_block_manager,
)


async def run_all():
    # fire-and-forget Layer-1 checks
    await run_analyzer()
    await run_observer()
    # start the manager listener and config listener concurrently
    await asyncio.gather(
        run_block_manager({}),
    )


if __name__ == "__main__":
    asyncio.run(run_all())
