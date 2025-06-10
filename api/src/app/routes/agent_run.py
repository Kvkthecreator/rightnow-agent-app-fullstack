from fastapi import APIRouter, Body
from ..events.on_input_created import handle_event

router = APIRouter(tags=["agents"])

@router.post("/agent-run")
async def agent_run(payload: dict = Body(...)):
    """Forward incoming events directly to the handler."""
    # Accept both {event: {...}} and direct {...} formats
    event = payload.get("event") or payload
    return await handle_event(event)
