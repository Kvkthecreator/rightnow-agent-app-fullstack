"""
Nightly worker:
– Pull pending / approved block_change_queue rows
– Apply changes *only* if the target block.update_policy = 'auto'
– Record a row in block_revisions
"""

import os
import json
import asyncpg
import asyncio
from datetime import datetime, timezone

DB_URL = os.getenv("DATABASE_URL")

SELECT_PENDING = """
select *
from block_change_queue
where status in ('pending','approved')
order by created_at
"""

APPLY_UPDATE = """
update context_blocks as cb
set content = coalesce($2::jsonb->>'content', cb.content),
    label   = coalesce($2::jsonb->>'label',   cb.label),
    version = cb.version + 1,
    updated_at = now()
where cb.id = $1
  and cb.update_policy = 'auto'
returning *
"""

INSERT_REVISION = """
insert into block_revisions
    (id, block_id, old_content, new_content, source_event)
values (gen_random_uuid(), $1, $2, $3, $4)
"""

UPDATE_QUEUE_STATUS = """
update block_change_queue
set status = $2,
    reason = coalesce(reason,'') || $3
where id = $1
"""


async def run_once() -> None:
    async with asyncpg.connect(DB_URL) as conn:
        rows = await conn.fetch(SELECT_PENDING)
        for row in rows:
            block_id = row["block_id"]
            proposed = row["proposed_data"]
            try:
                applied = await conn.fetchrow(
                    APPLY_UPDATE,
                    block_id,
                    json.dumps(proposed),
                )
                if applied:
                    # record revision
                    await conn.execute(
                        INSERT_REVISION,
                        block_id,
                        applied["content"],
                        proposed.get("content"),
                        row["source_event"],
                    )
                    await conn.execute(
                        UPDATE_QUEUE_STATUS,
                        row["id"],
                        "applied",
                        "",
                    )
                else:
                    await conn.execute(
                        UPDATE_QUEUE_STATUS,
                        row["id"],
                        "skipped",
                        "::manual || policy lock",
                    )
            except Exception as e:
                await conn.execute(
                    UPDATE_QUEUE_STATUS,
                    row["id"],
                    "error",
                    str(e),
                )


async def run_forever() -> None:
    while True:
        await run_once()
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(run_once())
