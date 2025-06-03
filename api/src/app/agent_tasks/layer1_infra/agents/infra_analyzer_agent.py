# api/src/app/agent_tasks/layer1_infra/agents/infra_analyzer_agent.py
import json
from datetime import datetime, timezone
import asyncpg
from ..schemas import AuditReport, DuplicateLabel
from app.supabase_helpers import publish_event
from app.event_bus import DB_URL   # reuse same URL

DUPLICATE_CHECK_SQL = """
with dupes as (
  select lower(label) as norm_label,
         array_agg(id) as ids,
         count(*) as cnt
  from public.context_blocks
  group by lower(label)
  having count(*) > 1
)
select norm_label, ids from dupes;
"""

EVENT_TOPIC = "block.audit_report"

async def run():
    """Main entry for orchestration_runner."""
    conn = await asyncpg.connect(DB_URL)
    try:
        rows = await conn.fetch(DUPLICATE_CHECK_SQL)
    finally:
        await conn.close()

    dupes = [
        DuplicateLabel(label=r["norm_label"], block_ids=[str(i) for i in r["ids"]])
        for r in rows
    ]

    report = AuditReport(
        ok=len(dupes) == 0,
        duplicate_labels=dupes,
        generated_at=datetime.now(timezone.utc).isoformat()
    )

    await publish_event(EVENT_TOPIC, json.loads(report.json()))
    return report  # useful for tests

if __name__ == "__main__":
    print("✅ Infra analyzer agent loaded successfully.")
