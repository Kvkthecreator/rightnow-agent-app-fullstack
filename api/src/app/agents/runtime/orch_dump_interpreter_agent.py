"""Orchestration agent for raw dump interpretation and block proposal."""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from ...agents.services.dump_interpreter import (
    DumpInterpreterService,
    RawDumpInterpretationRequest
)
from ...agents.services.substrate_ops import AgentMemoryOperations

logger = logging.getLogger("uvicorn.error")


class OrchDumpInterpreterInput(BaseModel):
    """Input for orchestration dump interpreter agent."""
    raw_dump_id: str
    workspace_id: str
    interpretation_prompt: Optional[str] = None
    max_blocks: int = 10


class OrchDumpInterpreterOutput(BaseModel):
    """Output from orchestration dump interpreter agent."""
    raw_dump_id: str
    blocks_proposed: int
    interpretation_summary: str
    agent_confidence: float
    processing_time_ms: int
    success: bool
    error_message: Optional[str] = None


async def run_orch_dump_interpreter(
    input_data: OrchDumpInterpreterInput
) -> OrchDumpInterpreterOutput:
    """Orchestration agent to interpret raw dumps and propose blocks."""
    
    start_time = datetime.now(timezone.utc)
    agent_id = "orch_dump_interpreter"
    
    try:
        # Create interpretation request
        request = RawDumpInterpretationRequest(
            raw_dump_id=UUID(input_data.raw_dump_id),
            interpretation_prompt=input_data.interpretation_prompt,
            max_blocks=input_data.max_blocks,
            agent_id=agent_id
        )
        
        # Perform interpretation
        result = await DumpInterpreterService.interpret_dump(
            request, input_data.workspace_id
        )
        
        # Calculate processing time
        end_time = datetime.now(timezone.utc)
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        return OrchDumpInterpreterOutput(
            raw_dump_id=input_data.raw_dump_id,
            blocks_proposed=len(result.proposed_blocks),
            interpretation_summary=result.interpretation_summary,
            agent_confidence=result.agent_confidence,
            processing_time_ms=processing_time_ms,
            success=True
        )
        
    except Exception as e:
        logger.exception(f"Orch dump interpreter failed: {e}")
        
        end_time = datetime.now(timezone.utc)
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        return OrchDumpInterpreterOutput(
            raw_dump_id=input_data.raw_dump_id,
            blocks_proposed=0,
            interpretation_summary="",
            agent_confidence=0.0,
            processing_time_ms=processing_time_ms,
            success=False,
            error_message=str(e)
        )