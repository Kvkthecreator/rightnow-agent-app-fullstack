"""Listener for new basket events (simplified pipeline)."""

import uuid
from typing import Any

import asyncpg

from app.agent_tasks.layer1_infra.agents.infra_analyzer_agent import run as run_analyzer
from app.agent_tasks.layer3_config.agents.config_agent import generate
from app.event_bus import DB_URL


async def handle_new_basket(basket_id: str, payload: Any) -> None:
    """Process a newly created basket."""
    await run_analyzer()

    async with asyncpg.connect(DB_URL) as conn:
        block_id = str(uuid.uuid4())
        await conn.execute(
            (
                "insert into context_blocks(id,user_id,type,label,content,update_policy) "
                "values($1,'demo-user','note',$2,$3,'auto')"
            ),
            block_id,
            (payload.get("intent_summary") or "note")[:50],
            payload.get("input_text", ""),
        )
        await conn.execute(
            (
                "insert into block_brief_link(id,block_id,task_brief_id,transformation) "
                "values(gen_random_uuid(),$1,$2,'source')"
            ),
            block_id,
            basket_id,
        )
        await conn.execute("update baskets set status='confirmed' where id=$1", basket_id)

    await generate(basket_id, "demo-user")


async def handle_update_basket(basket_id: str, payload: Any) -> None:
    """Process additional input for an existing basket."""
    await run_analyzer()

    async with asyncpg.connect(DB_URL) as conn:
        block_id = str(uuid.uuid4())
        await conn.execute(
            (
                "insert into context_blocks(id,user_id,type,label,content,update_policy) "
                "values($1,'demo-user','note',$2,$3,'auto')"
            ),
            block_id,
            (payload.get("intent_summary") or "note")[:50],
            payload.get("input_text", ""),
        )
        await conn.execute(
            (
                "insert into block_brief_link(id,block_id,task_brief_id,transformation) "
                "values(gen_random_uuid(),$1,$2,'source')"
            ),
            block_id,
            basket_id,
        )
        await conn.execute("update baskets set status='confirmed' where id=$1", basket_id)

    await generate(basket_id, "demo-user")


async def run():
    """Placeholder to match orchestration_runner interface."""
    pass
