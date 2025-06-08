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
        for t, key in [
            ("topic", "topic"),
            ("intent", "intent"),
            ("reference", "file_ids"),
            ("insight", "insight"),
        ]:
            if t == "reference":
                for f in payload.get("file_ids", []):
                    bid = str(uuid.uuid4())
                    await conn.execute(
                        (
                            "insert into context_blocks(id,user_id,type,label,content,is_primary,meta_scope,source) "
                            "values($1,'demo-user',$2,$3,$4,true,'basket','user_upload')"
                        ),
                        bid,
                        t,
                        f.split("/")[-1][:50],
                        f,
                    )
                    await conn.execute(
                        (
                            "insert into block_files(id,user_id,file_url,label,associated_block_id,is_primary,storage_domain) "
                            "values(gen_random_uuid(),'demo-user',$1,$2,$3,true,'block-files')"
                        ),
                        f,
                        f.split("/")[-1][:50],
                        bid,
                    )
                    await conn.execute(
                        (
                            "insert into block_brief_link(id,block_id,task_brief_id,transformation) "
                            "values(gen_random_uuid(),$1,$2,'source')"
                        ),
                        bid,
                        basket_id,
                    )
            else:
                value = payload.get(key)
                if not value:
                    continue
                bid = str(uuid.uuid4())
                await conn.execute(
                    (
                        "insert into context_blocks(id,user_id,type,label,content,is_primary,meta_scope) "
                        "values($1,'demo-user',$2,$3,$4,true,'basket')"
                    ),
                    bid,
                    t,
                    value[:50],
                    value,
                )
                await conn.execute(
                    (
                        "insert into block_brief_link(id,block_id,task_brief_id,transformation) "
                        "values(gen_random_uuid(),$1,$2,'source')"
                    ),
                    bid,
                    basket_id,
                )
        await conn.execute("update baskets set status='confirmed' where id=$1", basket_id)

    await generate(basket_id, "demo-user")


async def handle_update_basket(basket_id: str, payload: Any) -> None:
    """Process additional input for an existing basket."""
    await run_analyzer()

    async with asyncpg.connect(DB_URL) as conn:
        for t, key in [
            ("topic", "topic"),
            ("intent", "intent_summary"),
            ("reference", "file_ids"),
            ("insight", "input_text"),
        ]:
            if t == "reference":
                for f in payload.get("file_ids", []):
                    bid = str(uuid.uuid4())
                    await conn.execute(
                        (
                            "insert into context_blocks(id,user_id,type,label,content,is_primary,meta_scope,source) "
                            "values($1,'demo-user',$2,$3,$4,true,'basket','user_upload')"
                        ),
                        bid,
                        t,
                        f.split("/")[-1][:50],
                        f,
                    )
                    await conn.execute(
                        (
                            "insert into block_files(id,user_id,file_url,label,associated_block_id,is_primary,storage_domain) "
                            "values(gen_random_uuid(),'demo-user',$1,$2,$3,true,'block-files')"
                        ),
                        f,
                        f.split("/")[-1][:50],
                        bid,
                    )
                    await conn.execute(
                        (
                            "insert into block_brief_link(id,block_id,task_brief_id,transformation) "
                            "values(gen_random_uuid(),$1,$2,'source')"
                        ),
                        bid,
                        basket_id,
                    )
            else:
                value = payload.get(key)
                if not value:
                    continue
                bid = str(uuid.uuid4())
                await conn.execute(
                    (
                        "insert into context_blocks(id,user_id,type,label,content,is_primary,meta_scope) "
                        "values($1,'demo-user',$2,$3,$4,true,'basket')"
                    ),
                    bid,
                    t,
                    value[:50],
                    value,
                )
                await conn.execute(
                    (
                        "insert into block_brief_link(id,block_id,task_brief_id,transformation) "
                        "values(gen_random_uuid(),$1,$2,'source')"
                    ),
                    bid,
                    basket_id,
                )
        await conn.execute("update baskets set status='confirmed' where id=$1", basket_id)

    await generate(basket_id, "demo-user")


async def run():
    """Placeholder to match orchestration_runner interface."""
    pass
