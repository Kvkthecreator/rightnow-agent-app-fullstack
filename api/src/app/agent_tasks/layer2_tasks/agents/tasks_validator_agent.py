#api/src/app/agent_tasks/layer2_tasks/agents/tasks_validator_agent.py

from ..schemas import TaskBriefEdited, TaskBriefValidation
from app.event_bus import DB_URL
from app.supabase_helpers import publish_event
import asyncpg
import datetime

EVENT_TOPIC_IN  = "brief.edited"
EVENT_TOPIC_OUT = "brief.validated"

async def validate(brief: TaskBriefEdited) -> TaskBriefValidation:
    errors = []
    if len(set(brief.block_ids)) != len(brief.block_ids):
        errors.append("Duplicate block IDs referenced.")
    if len(brief.outline.split()) > 500:
        errors.append("Outline exceeds 500 words.")
    CORE = {
        "mission_statement",
        "audience_profile",
        "strategic_goal",
        "tone_style",
    }
    # map block_id → type fetched lazily (one round-trip)
    if CORE:
        conn = await asyncpg.connect(DB_URL)
        types_in_brief = await conn.fetch(
            "select type from context_blocks where id = any($1::uuid[])",
            brief.block_ids,
        )
        await conn.close()
        missing = CORE - {r["type"] for r in types_in_brief}
        if missing:
            errors.append(f"Missing required core blocks: {', '.join(missing)}")
    ok = len(errors) == 0
    validation = TaskBriefValidation(
        brief_id=brief.brief_id,
        ok=ok,
        errors=errors,
        checked_at=datetime.datetime.utcnow(),
    )
    await publish_event(EVENT_TOPIC_OUT, validation.dict())
    return validation
