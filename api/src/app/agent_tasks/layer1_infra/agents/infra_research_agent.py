"""Layer-1 research agent: refreshes refreshable context blocks."""

import json
from datetime import datetime, timezone
import asyncpg

from ..schemas import RefreshReport
from app.supabase_helpers import publish_event
from app.event_bus import DB_URL
from ..utils.block_policy import is_auto, insert_revision

FIND_REFRESHABLE_SQL = """
select id::text
from public.context_blocks
where meta_refreshable
  and (last_refreshed_at is null
       or last_refreshed_at < (now() - interval '7 days'));
"""

STAMP_SQL = """
update public.context_blocks
set last_refreshed_at = now()
where id = any($1::uuid[])
"""

EVENT_TOPIC = "block.refresh_report"

async def run() -> RefreshReport:
    """Called by orchestration_runner."""
    conn = await asyncpg.connect(DB_URL)
    refreshed = []
    proposed = []
    try:
        rows = await conn.fetch(FIND_REFRESHABLE_SQL)
        for r in rows:
            bid = r["id"]
            if await is_auto(conn, bid):
                await conn.execute(STAMP_SQL, [bid])
                await insert_revision(
                    conn,
                    bid,
                    prev_content="<unchanged>",
                    new_content="<auto-refresh>",
                    changed_by="agent:infra_research",
                    proposal_event={"reason": "auto-refresh"},
                )
                refreshed.append(bid)
            else:
                await publish_event(
                    "block.update_suggested",
                    {"block_id": bid, "proposed": {"last_refreshed_at": "now()"}},
                )
                proposed.append(bid)
    finally:
        await conn.close()

    report = RefreshReport(
        refreshed_ids=refreshed,
        proposed_ids=proposed,
        generated_at=datetime.now(timezone.utc),
    )

    await publish_event(EVENT_TOPIC, json.loads(report.json()))
    return report

