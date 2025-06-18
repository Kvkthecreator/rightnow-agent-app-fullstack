import json
import os
import uuid

import asyncpg
from schemas.config import ConfigIn, ConfigOut
from schemas.validators import validates
from src.utils.logged_agent import logged

DB_URL = os.getenv("DATABASE_URL")


@logged("config_agent")
@validates(ConfigIn)
async def generate(payload: ConfigIn) -> ConfigOut:
    brief_id = payload.brief_id
    user_id = payload.user_id
    async with asyncpg.connect(DB_URL) as conn:
        brief = await conn.fetchrow(
            "select intent, core_context_snapshot from task_briefs where id=$1",
            brief_id,
        )
        blocks = await conn.fetch(
            "select cb.type, cb.content "
            "from block_brief_link bl join context_blocks cb on cb.id=bl.block_id "
            "where bl.task_brief_id=$1",
            brief_id,
        )
        config = {
            "brief_id": brief_id,
            "user_id": user_id,
            "intent": brief["intent"],
            "core_context": brief["core_context_snapshot"],
            "blocks": [dict(r) for r in blocks],
            "config": {
                "tool": "openai",
                "model": "gpt-4o",
                "instructions": "Follow the brief to deliver output.",
            },
        }
        await conn.execute(
            (
                "insert into basket_configs(id,basket_id,platform,type,title,"
                "external_url,generated_by_agent,version) "
                "values($1,$2,'google_docs','draft',$3,$4,true,1)"
            ),
            str(uuid.uuid4()),
            brief_id,
            f"Draft - {brief['intent'][:30]}",
            "",
        )
        await conn.execute(
            "insert into brief_configs(id,brief_id,user_id,config_json) values($1,$2,$3,$4)",
            str(uuid.uuid4()),
            brief_id,
            user_id,
            json.dumps(config),
        )
        return ConfigOut(**config)
