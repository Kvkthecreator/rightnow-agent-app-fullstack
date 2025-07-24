# api/src/app/agent_tasks/layer1_infra/agents/infra_analyzer_agent.py
from datetime import datetime, timezone

import asyncpg
from schemas.audit import AuditIn, AuditOut
from schemas.validators import validates
from src.utils.logged_agent import logged

from app.event_bus import DATABASE_URL  # reuse same URL
from app.event_bus import publish_event

from ..schemas import AuditReport, DuplicateLabel

DUPLICATE_CHECK_SQL = """
with dupes as (
  select lower(label) as norm_label,
         array_agg(id) as ids,
         count(*) as cnt
  from public.blocks
  group by lower(label)
  having count(*) > 1
)
select norm_label, ids from dupes;
"""

EVENT_TOPIC = "block.audit_report"


@logged("infra_analyzer_agent")
@validates(AuditIn)
async def run(_: AuditIn) -> AuditOut:
    """Main entry for orchestration_runner."""
    conn = await asyncpg.connect(DATABASE_URL)
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

        # Phase 1: only emit suggestions, never auto-update
        for dup in dupes:
            await publish_event("block.update_suggested", dup.model_dump(mode="json"))

    finally:
        await conn.close()

    # always emit audit_report for dashboards
    await publish_event(EVENT_TOPIC, report.model_dump(mode="json"))
    return AuditOut(**report.model_dump())


if __name__ == "__main__":
    print("✅ Infra analyzer agent loaded successfully.")
