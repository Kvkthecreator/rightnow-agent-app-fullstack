import logging
from fastapi import APIRouter, Body
from ..events.on_input_created import handle_event

logger = logging.getLogger("uvicorn.error")

router = APIRouter(tags=["agents"])

@router.post("/agent-run")
async def agent_run(payload: dict = Body(...)):
    """Forward incoming events directly to the handler."""
    # Accept both {event: {...}} and direct {...} formats
    event = payload["event"] if isinstance(payload.get("event"), dict) else payload
    logger.info("/agent-run payload type: %s", type(event).__name__)
    return await handle_event(event)
