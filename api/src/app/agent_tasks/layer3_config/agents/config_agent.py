import asyncpg
import os
import json
import uuid
from datetime import datetime, timezone

DB_URL = os.getenv("DATABASE_URL")

async def generate(brief_id: str, user_id: str):
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
            "insert into brief_configs(id,brief_id,user_id,config_json) values($1,$2,$3,$4)",
            str(uuid.uuid4()),
            brief_id,
            user_id,
            json.dumps(config),
        )
        return config
