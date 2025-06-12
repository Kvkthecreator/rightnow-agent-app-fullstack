"""Validate task briefs before execution."""

import datetime

import asyncpg
from schemas.validators import validates
from src.utils.logged_agent import logged

from app.event_bus import DB_URL, publish_event

from ..schemas import TaskBriefEdited, TaskBriefValidation

EVENT_TOPIC_IN = "brief.edited"
EVENT_TOPIC_OUT = "brief.validated"


@logged("tasks_validator_agent")
@validates(TaskBriefEdited)
async def validate(brief: TaskBriefEdited) -> TaskBriefValidation:
    errors = []
    if len(set(brief.block_ids)) != len(brief.block_ids):
        errors.append("Duplicate block IDs referenced.")
    if len(brief.outline.split()) > 500:
        errors.append("Outline exceeds 500 words.")
    CORE_BLOCK_TYPES = {"topic", "intent", "reference", "style_guide"}
    conn = await asyncpg.connect(DB_URL)
    rows = await conn.fetch(
        "select type from block_brief_link bl "
        "join context_blocks cb on cb.id = bl.block_id "
        "where bl.task_brief_id = $1 "
        "and cb.is_core_block is true",
        brief.brief_id,
    )
    await conn.close()
    missing = CORE_BLOCK_TYPES - {r["type"] for r in rows}
    if missing:
        errors.append(f"Core blocks missing: {', '.join(missing)}")
    ok = len(errors) == 0
    validation = TaskBriefValidation(
        brief_id=brief.brief_id,
        ok=ok,
        errors=errors,
        checked_at=datetime.datetime.utcnow(),
    )
    await publish_event(EVENT_TOPIC_OUT, validation.model_dump(mode="json"))
    return validation
