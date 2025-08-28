"""
Stub implementation for legacy dump interpreter service.
This will be replaced with canonical P1 Substrate Agent.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class RawDumpInterpretationRequest(BaseModel):
    dump_id: UUID
    workspace_id: UUID


class InterpretedBlock(BaseModel):
    title: str
    content: str
    semantic_type: str
    confidence: float


class RawDumpInterpretationResult(BaseModel):
    dump_id: UUID
    blocks: List[InterpretedBlock]
    processing_time_ms: int


class DumpInterpreterService:
    """Legacy stub - use canonical P1SubstrateAgent instead."""
    
    async def interpret_dump(self, request: RawDumpInterpretationRequest) -> RawDumpInterpretationResult:
        # Stub implementation - directs to canonical processing
        return RawDumpInterpretationResult(
            dump_id=request.dump_id,
            blocks=[],
            processing_time_ms=0
        )


class SmartDumpInterpreter(DumpInterpreterService):
    """Legacy alias for DumpInterpreterService."""
    pass