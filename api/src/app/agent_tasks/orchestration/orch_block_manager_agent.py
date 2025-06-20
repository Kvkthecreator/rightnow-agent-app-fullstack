"""Orchestrator that watches Layer-1 events and queues block changes."""

import asyncio
import os

import asyncpg
from schemas.block_manager import BlockManagerIn, BlockManagerOut
from schemas.validators import validates
from src.utils.logged_agent import logged

from app.event_bus import subscribe
from app.event_bus import publish_event

DB_URL = os.getenv("DATABASE_URL")

# Phase 1 removes the change queue. Logic retained here as commented reference.
# QUEUE_SQL = """
# insert into block_change_queue
#     (id, action, block_id, proposed_data, source_event, source_scope, status, reason)
# values
#     (gen_random_uuid(),
#      $1::proposal_action_enum,
#      $2::uuid,
#      $3::jsonb,
#      $4,
#      $5,
#      'pending',
#      $6)
# """

# async def _queue(
#     conn: asyncpg.Connection,
#     action: str,
#     block_id: str,
#     proposed_data: dict[str, Any],
#     source_event: str,
#     source_scope: str,
#     reason: str,
# ) -> None:
#     await conn.execute(
#         QUEUE_SQL,
#         action,
#         block_id,
#         json.dumps(proposed_data),
#         source_event,
#         source_scope,
#         reason,
#     )


@logged("orch_block_manager_agent")
@validates(BlockManagerIn)
async def run(_: BlockManagerIn) -> BlockManagerOut:
    """Entry point used by orchestration_runner."""
    print("🚀 orch_block_manager_agent running …")
    async with asyncpg.create_pool(DB_URL) as pool:
        async for evt in subscribe(["block.audit_report", "block.usage_report"]):
            async with pool.acquire() as conn:
                await _handle_event(conn, evt)
    return BlockManagerOut(state="completed")


async def _handle_event(conn: asyncpg.Connection, evt) -> None:
    topic = evt.topic
    payload = evt.payload
    if topic == "block.audit_report":
        for dup in payload.get("duplicate_labels", []):
            await publish_event(
                "block.update_suggested",
                {
                    "block_id": dup["block_ids"][0],
                    "proposed": {"merge_ids": dup["block_ids"]},
                    "reason": "duplicate_labels",
                },
            )
    elif topic == "block.usage_report":
        for stale_id in payload.get("stale_blocks", []):
            await publish_event(
                "block.update_suggested",
                {
                    "block_id": stale_id,
                    "proposed": {"state": "inactive"},
                    "reason": "stale_block",
                },
            )


if __name__ == "__main__":
    asyncio.run(run())
