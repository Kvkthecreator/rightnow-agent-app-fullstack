"""Orchestrator that composes a brief when a basket is created."""
import asyncio
import json
import asyncpg
from app.event_bus import subscribe, DB_URL
from app.supabase_helpers import publish_event
from app.agent_tasks.layer2_tasks.agents.tasks_composer_agent import run as compose_run

async def _handle_event(evt) -> None:
    payload = evt.payload
    draft = await compose_run(
        user_id="demo-user",
        intent=payload["intent"],
        sub_instructions=payload.get("details", ""),
        file_urls=[],
    )
    async with asyncpg.connect(DB_URL) as conn:
        await conn.execute(
            "update baskets set core_context_snapshot=$1, is_draft=true where id=$2",
            json.dumps(draft.core_context_snapshot or {}),
            payload["basket_id"],
        )
    await publish_event("basket.composed", {"basket_id": payload["basket_id"]})

async def run() -> None:
    print("🚀 orch_basket_composer_agent running …")
    async for evt in subscribe(["basket.compose_request"]):
        await _handle_event(evt)

if __name__ == "__main__":
    asyncio.run(run())
