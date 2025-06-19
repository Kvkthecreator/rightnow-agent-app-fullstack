"""Layer-1 research agent: refreshes refreshable context blocks."""

from datetime import datetime, timezone

import asyncpg
from schemas.research import ResearchIn, ResearchOut
from schemas.validators import validates
from src.app.agent_tasks.layer1_infra.utils.block_policy import insert_revision, is_auto
from src.utils.logged_agent import logged

from app.event_bus import DB_URL
from app.supabase_helpers import publish_event

from ..schemas import RefreshReport

FIND_REFRESHABLE_SQL = """
select id::text
from public.blocks
where meta_refreshable
  and (last_refreshed_at is null
       or last_refreshed_at < (now() - interval '7 days'));
"""

STAMP_SQL = """
update public.blocks
set last_refreshed_at = now()
where id = any($1::uuid[])
"""

EVENT_TOPIC = "block.refresh_report"


@logged("infra_research_agent")
@validates(ResearchIn)
async def run(_: ResearchIn) -> ResearchOut:
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

    await publish_event(EVENT_TOPIC, report.model_dump(mode="json"))
    return ResearchOut(**report.model_dump())
