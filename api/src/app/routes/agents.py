from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..agent_tasks.orch.orch_block_manager_agent import run as run_orch_block_manager
from ..agent_tasks.infra.infra_cil_validator_agent import run as run_infra_cil_validator

router = APIRouter(prefix="/agents", tags=["agents"])


class RunPayload(BaseModel):
    basket_id: UUID


@router.post("/{name}/run")
def run_agent(name: str, payload: RunPayload):
    if name == "orch_block_manager":
        run_orch_block_manager(payload.basket_id)
    elif name == "infra_cil_validator":
        run_infra_cil_validator(payload.basket_id)
    else:
        raise HTTPException(status_code=404, detail="unknown agent")
    return {"status": "ok"}
