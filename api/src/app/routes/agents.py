from uuid import UUID

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel

from app.agents.runtime.infra_observer_agent import run as run_orch_block_manager

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentRunPayload(BaseModel):
    basket_id: UUID


@router.post("/{name}/run")
def run_agent(name: str, payload: AgentRunPayload):
    res = (
        supabase.table("baskets")
        .select("id")
        .eq("id", str(payload.basket_id))
        .execute()
    )
    if not res.data:  # type: ignore[attr-defined]
        raise HTTPException(status_code=404, detail="basket not found")

    try:
        if name == "orch_block_manager":
            result = run_orch_block_manager(payload.basket_id)
        else:
            raise HTTPException(status_code=404, detail="unknown agent")
    except APIError as err:
        raise HTTPException(status_code=500, detail=str(err)) from err
    return result
