#api/src/app/agent_tasks/layer2_tasks/agents/tasks_validator_agent.py

from ..schemas import TaskBriefEdited, TaskBriefValidation
from app.event_bus import publish_event
import datetime

EVENT_TOPIC_IN  = "brief.edited"
EVENT_TOPIC_OUT = "brief.validated"

def validate(brief: TaskBriefEdited) -> TaskBriefValidation:
    errors = []
    if len(set(brief.block_ids)) != len(brief.block_ids):
        errors.append("Duplicate block IDs referenced.")
    if len(brief.outline.split()) > 500:
        errors.append("Outline exceeds 500 words.")
    if not any("tone" in bid.lower() for bid in brief.block_ids):
        errors.append("No tone block present.")
    ok = len(errors) == 0
    validation = TaskBriefValidation(
        brief_id=brief.brief_id,
        ok=ok,
        errors=errors,
        checked_at=datetime.datetime.utcnow(),
    )
    publish_event(EVENT_TOPIC_OUT, validation.dict())
    return validation
