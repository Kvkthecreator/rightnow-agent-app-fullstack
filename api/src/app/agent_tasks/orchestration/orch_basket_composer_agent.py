"""Orchestrator that composes a brief when a basket is created."""
import asyncio
import json

import asyncpg
from schemas.basket_composer import BasketComposerIn, BasketComposerOut
from schemas.validators import validates
from src.utils.logged_agent import logged

from app.agent_tasks.layer2_tasks.agents.tasks_composer_agent import run as compose_run
from app.event_bus import DB_URL, subscribe
from app.supabase_helpers import publish_event


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

@logged("orch_basket_composer_agent")
@validates(BasketComposerIn)
async def run(_: BasketComposerIn) -> BasketComposerOut:
    print("🚀 orch_basket_composer_agent running …")
    async for evt in subscribe(["basket.compose_request"]):
        await _handle_event(evt)
    return BasketComposerOut(status="completed")

if __name__ == "__main__":
    asyncio.run(run())
