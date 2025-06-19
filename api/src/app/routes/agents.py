from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..agent_tasks.orch.orch_block_manager_agent import run as run_orch_block_manager
from ..agent_tasks.infra.infra_cil_validator_agent import run as run_infra_cil_validator
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

    if name == "orch_block_manager":
        result = run_orch_block_manager(payload.basket_id)
    elif name == "infra_cil_validator":
        result = run_infra_cil_validator(payload.basket_id)
    else:
        raise HTTPException(status_code=404, detail="unknown agent")
    return result
