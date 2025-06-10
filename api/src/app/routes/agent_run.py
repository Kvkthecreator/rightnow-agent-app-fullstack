from fastapi import APIRouter, HTTPException
from ..events.on_input_created import handle_event as handle_input_created

router = APIRouter(tags=["agents"])

@router.post("/agent-run", status_code=202)
async def agent_run(payload: dict):
    agent = payload.get("agent")
    event_payload = payload.get("event")

    if isinstance(event_payload, dict):
        event_type = event_payload.get("type")
    else:
        event_type = event_payload

    if agent != "orch_block_manager_agent":
        raise HTTPException(status_code=400, detail="unsupported agent")

    if event_type == "basket_inputs.created":
        if not isinstance(event_payload, dict):
            raise HTTPException(status_code=422, detail="event payload required")
        result = await handle_input_created(event_payload)
        return result

    raise HTTPException(status_code=400, detail="unsupported event")
