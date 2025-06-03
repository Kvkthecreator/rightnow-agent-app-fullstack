#api/src/app/agent_tasks/layer1_infra/agents/infra_observer_agent.py

"""Layer-1 observer: flags stale or unused context blocks."""
import json
from datetime import datetime, timezone
import asyncpg

from ..schemas import UsageReport
from app.supabase_helpers import publish_event
from app.event_bus import DB_URL

STALE_SQL = """
select id::text
from public.context_blocks
where (last_refreshed_at is null
       or last_refreshed_at < (now() - interval '30 days'));
"""

UNUSED_SQL = """
select cb.id::text
from public.context_blocks cb
left join public.block_usage_history h
       on h.block_id = cb.id
       and h.used_at > (now() - interval '45 days')
where h.block_id is null;
"""

EVENT_TOPIC = "block.usage_report"


async def run() -> UsageReport:
    """Called by orchestration_runner."""
    conn = await asyncpg.connect(DB_URL)
    try:
        stale_rows = await conn.fetch(STALE_SQL)
        unused_rows = await conn.fetch(UNUSED_SQL)
    finally:
        await conn.close()

    report = UsageReport(
        stale_ids=[r["id"] for r in stale_rows],
        unused_ids=[r["id"] for r in unused_rows],
        generated_at=datetime.now(timezone.utc),
    )

    # emit the event
    await publish_event(EVENT_TOPIC, json.loads(report.json()))
    return report
