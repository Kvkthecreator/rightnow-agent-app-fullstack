# api/src/app/agent_tasks/layer1_infra/agents/infra_analyzer_agent.py
import json
from datetime import datetime, timezone
import asyncpg
from ..schemas import AuditReport, DuplicateLabel
from app.supabase_helpers import publish_event
from app.event_bus import DB_URL   # reuse same URL
from ..utils.block_policy import is_auto, insert_revision

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

        dupes = [
            DuplicateLabel(label=r["norm_label"], block_ids=[str(i) for i in r["ids"]])
            for r in rows
        ]

        report = AuditReport(
            ok=len(dupes) == 0,
            duplicate_labels=dupes,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

        # auto-apply or enqueue
        for dup in dupes:
            primary_id = dup.block_ids[0]
            if await is_auto(conn, primary_id):
                await conn.execute(
                    "update context_blocks set content = content || ' [Merged duplicate]' where id=$1",
                    primary_id,
                )
                await insert_revision(
                    conn,
                    primary_id,
                    prev_content="<merged>",
                    new_content="<merged>",
                    changed_by="agent:infra_analyzer",
                    proposal_event=dup.dict(),
                )
                await publish_event("block.auto_updated", dup.dict())
            else:
                await publish_event("block.update_suggested", dup.dict())

    finally:
        await conn.close()

    # always emit audit_report for dashboards
    await publish_event(EVENT_TOPIC, json.loads(report.json()))
    return report  # useful for tests

if __name__ == "__main__":
    print("✅ Infra analyzer agent loaded successfully.")
