"""
Composer v0
-----------
Pulls the four core manual blocks + top-3 auto blocks by usage,
creates a Task Brief draft, links blocks, emits event.
"""

import asyncio
import datetime
import json
import os
import sys
import uuid
from datetime import timezone

import asyncpg
from schemas.validators import validates

from app.supabase_helpers import publish_event

from ..schemas import ComposeRequest, TaskBriefDraft

DB_URL = os.getenv("DATABASE_URL")

CORE_BLOCK_TYPES = (
    "topic",
    "intent",
    "reference",
    "style_guide",
)

SQL_CORE = """
select * from context_blocks
where user_id = $1
  and is_core_block is true
  and status = 'active'
order by created_at
"""

SQL_TOP3 = """
select * from view_block_usage_summary
where user_id = $1
  and block_id not in (select id from core)
order by brief_count desc
limit 3
"""

@validates(ComposeRequest)
async def run(payload: ComposeRequest) -> TaskBriefDraft:
    user_id = payload.user_id
    intent = payload.user_intent
    sub_instructions = payload.sub_instructions
    file_urls = payload.file_urls or []
    async with asyncpg.connect(DB_URL) as conn:
        core_blocks = await conn.fetch(SQL_CORE, user_id)
        top3_blocks = await conn.fetch(SQL_TOP3, user_id)

        blocks = list(core_blocks) + list(top3_blocks)
        block_ids = [str(r["id"]) for r in blocks]

        brief_id = str(uuid.uuid4())
        draft = TaskBriefDraft(
            brief_id=brief_id,
            user_intent=intent,
            sub_instructions=sub_instructions,
            file_urls=file_urls,
            block_ids=block_ids,
            outline="",
            created_at=datetime.now(timezone.utc),
        )

        await conn.execute(
            "insert into task_briefs(id,user_id,intent,sub_instructions,media,is_draft)"
            " values($1,$2,$3,$4,$5,'t')",
            brief_id,
            user_id,
            intent,
            sub_instructions,
            json.dumps(file_urls),
        )

        await conn.executemany(
            "insert into block_brief_link(id,block_id,task_brief_id,transformation)"
            " values(gen_random_uuid(), $1, $2, 'source')",
            [(bid, brief_id) for bid in block_ids],
        )

    await publish_event("brief.draft_created", draft.model_dump(mode="json"))
    return draft

# CLI helper
if __name__ == "__main__":
    payload = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {
        "user_id": "demo",
        "user_intent": "Launch a spring sale campaign on social media.",
        "sub_instructions": "",
        "file_urls": []
    }
    asyncio.run(run(payload))
