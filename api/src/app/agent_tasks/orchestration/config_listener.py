import asyncio
import json

from app.event_bus import subscribe
from app.agent_tasks.layer3_config.agents.config_agent import generate

async def run():
    async for evt in subscribe(["brief.validated"]):
        payload = evt.payload
        await generate(payload["brief_id"], payload["user_id"])

if __name__ == "__main__":
    asyncio.run(run())
