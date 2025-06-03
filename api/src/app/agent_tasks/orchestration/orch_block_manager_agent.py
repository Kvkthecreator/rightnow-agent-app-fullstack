#api/src/app/agent_tasks/orchestration/orch_block_manager_agent.py

#This version never exits—ideal for a background worker.
#If you want a one-shot runner, wrap it in asyncio.wait_for(run(), timeout=10).

import json
import asyncio
import asyncpg
from datetime import datetime, timezone

from .rules.block_crud_rules import BLOCK_CRUD_RULES
from app.event_bus import subscribe, emit, DB_URL
from app.supabase_helpers import publish_event  # reuse insert helper

AUDIT_TOPIC  = "block.audit_report"
USAGE_TOPIC  = "block.usage_report"
QUEUE_TABLE  = "public.block_change_queue"

async def _handle_audit(event_payload):
    for dup in event_payload["duplicate_labels"]:
        # decide a merge proposal
        rule = BLOCK_CRUD_RULES.get("tone", BLOCK_CRUD_RULES["*"])
        proposed = {
            "label": dup["label"],
            "merged_from": dup["block_ids"],
        }
        await _enqueue(
            action="merge",
            block_id=dup["block_ids"][0],
            proposed_data=proposed,
            source_event=AUDIT_TOPIC,
            reason="Duplicate label"
        )

async def _handle_usage(event_payload):
    for bid in event_payload["stale_ids"]:
        rule = BLOCK_CRUD_RULES.get("*")
        if rule["allow_auto_update"]:
            await _enqueue(
                action="update",
                block_id=bid,
                proposed_data={"meta_refreshable": True},
                source_event=USAGE_TOPIC,
                reason="Stale >30d"
            )
    for bid in event_payload["unused_ids"]:
        rule = BLOCK_CRUD_RULES.get("*")
        if rule["allow_auto_delete"]:
            await _enqueue(
                action="delete",
                block_id=bid,
                proposed_data=None,
                source_event=USAGE_TOPIC,
                reason="Unused >45d"
            )

async def _enqueue(action, block_id, proposed_data, source_event, reason):
    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute(
            f"""
            insert into {QUEUE_TABLE} (action, block_id, proposed_data, source_event, reason)
            values ($1, $2, $3, $4, $5)
            """,
            action, block_id, json.dumps(proposed_data) if proposed_data else None,
            source_event, reason
        )
    finally:
        await conn.close()

async def run():
    """Long-running listener; orchestration_runner will await this forever."""
    async with subscribe([AUDIT_TOPIC, USAGE_TOPIC]) as q:
        while True:
            evt = await q.get()
            if evt.topic == AUDIT_TOPIC:
                await _handle_audit(evt.payload)
            elif evt.topic == USAGE_TOPIC:
                await _handle_usage(evt.payload)
            # keep loop alive

# convenience for manual debugging
if __name__ == "__main__":
    asyncio.run(run())

