from fastapi import APIRouter, HTTPException
from ..agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase
from ..agent_tasks.orchestration.thread_parser_listener import handle_update_basket

router = APIRouter(tags=["agents"])

@router.post("/agent-run", status_code=202)
async def agent_run(payload: dict):
    agent = payload.get("agent")
    event = payload.get("event")
    info = payload.get("input", {})

    if agent != "orch_block_manager_agent":
        raise HTTPException(status_code=400, detail="unsupported agent")

    if event == "basket_inputs.created":
        input_id = info.get("input_id")
        if not input_id:
            raise HTTPException(status_code=422, detail="input_id required")
        supabase = get_supabase()
        row = (
            supabase.table("basket_inputs")
            .select("basket_id, content, file_ids")
            .eq("id", input_id)
            .single()
            .execute()
        )
        if row.error or not row.data:
            raise HTTPException(status_code=404, detail="input not found")

        await handle_update_basket(
            row.data["basket_id"],
            {"input_text": row.data["content"], "file_ids": row.data.get("file_ids") or []},
        )
        return {"status": "queued"}

    raise HTTPException(status_code=400, detail="unsupported event")
