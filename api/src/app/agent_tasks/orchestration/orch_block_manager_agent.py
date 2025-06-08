"""Orchestrator that watches Layer-1 events and queues block changes."""

import os
import json
import asyncio
import asyncpg
from datetime import datetime, timezone
from typing import Dict, Any

from app.event_bus import subscribe
from app.supabase_helpers import publish_event

DB_URL = os.getenv("DATABASE_URL")

QUEUE_SQL = """
insert into block_change_queue
    (id, action, block_id, proposed_data, source_event, status, reason)
values
    (gen_random_uuid(),
     $1::proposal_action_enum,
     $2::uuid,
     $3::jsonb,
     $4,
     'pending',
     $5)
"""

async def _queue(
    conn: asyncpg.Connection,
    action: str,
    block_id: str,
    proposed_data: Dict[str, Any],
    source_event: str,
    reason: str,
) -> None:
    await conn.execute(
        QUEUE_SQL,
        action,
        block_id,
        json.dumps(proposed_data),
        source_event,
        reason,
    )

async def run() -> None:
    """Entry point used by orchestration_runner."""
    print("🚀 orch_block_manager_agent running …")
    async with asyncpg.create_pool(DB_URL) as pool:
        async for evt in subscribe(["block.audit_report", "block.usage_report"]):
            async with pool.acquire() as conn:
                await _handle_event(conn, evt)

async def _handle_event(conn: asyncpg.Connection, evt) -> None:
    topic = evt.topic
    payload = evt.payload
    if topic == "block.audit_report":
        for dup in payload.get("duplicate_labels", []):
            await _queue(
                conn,
                action="merge",
                block_id=dup["block_ids"][0],
                proposed_data={"block_ids": dup["block_ids"], "update_policy": "auto"},
                source_event=topic,
                reason="duplicate_labels",
            )
    elif topic == "block.usage_report":
        for stale_id in payload.get("stale_blocks", []):
            await _queue(
                conn,
                action="update",
                block_id=stale_id,
                proposed_data={"status": "inactive"},
                source_event=topic,
                reason="stale_block",
            )

if __name__ == "__main__":
    asyncio.run(run())
