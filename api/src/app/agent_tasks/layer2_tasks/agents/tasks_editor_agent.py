#api/src/app/agent_tasks/layer2_tasks/agents/tasks_editor_agent.py

from ..schemas import TaskBriefDraft, TaskBriefEdited
from app.supabase_helpers import publish_event

EVENT_TOPIC_IN  = "brief.draft_created"
EVENT_TOPIC_OUT = "brief.edited"

async def edit(draft: TaskBriefDraft) -> TaskBriefEdited:
    edited = TaskBriefEdited(**draft.dict(), edits_log=[])
    await publish_event(EVENT_TOPIC_OUT, edited.dict())
    return edited
