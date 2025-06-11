#api/src/app/agent_tasks/layer2_tasks/agents/tasks_editor_agent.py

from schemas.validators import validates

from app.supabase_helpers import publish_event

from ..schemas import TaskBriefDraft, TaskBriefEdited

EVENT_TOPIC_IN  = "brief.draft_created"
EVENT_TOPIC_OUT = "brief.edited"

@validates(TaskBriefDraft)
async def edit(draft: TaskBriefDraft) -> TaskBriefEdited:
    edited = TaskBriefEdited(**draft.model_dump(), edits_log=[])
    await publish_event(EVENT_TOPIC_OUT, edited.model_dump(mode="json"))
    return edited
