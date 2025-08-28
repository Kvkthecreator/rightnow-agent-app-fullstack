"""
Stub implementation for legacy substrate operations service.
This will be replaced with canonical pipeline agents.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel
from enum import Enum


class SubstrateOperationType(str, Enum):
    CREATE_BLOCK = "create_block"
    UPDATE_BLOCK = "update_block"
    CREATE_RELATIONSHIP = "create_relationship"


class AgentSubstrateRequest(BaseModel):
    operation_type: SubstrateOperationType
    workspace_id: UUID
    basket_id: UUID
    data: Dict[str, Any]


class SubstrateOperationResult(BaseModel):
    operation_id: UUID
    success: bool
    result_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class AgentMemoryAnalysis(BaseModel):
    total_substrates: int
    substrate_types: Dict[str, int]
    recent_activity: List[Dict[str, Any]]


class AgentSubstrateService:
    """Legacy stub - use canonical pipeline agents instead."""
    
    async def execute_operation(self, request: AgentSubstrateRequest) -> SubstrateOperationResult:
        # Stub implementation - directs to canonical processing
        return SubstrateOperationResult(
            operation_id=UUID('00000000-0000-0000-0000-000000000000'),
            success=False,
            error="Use canonical pipeline agents instead"
        )


class AgentMemoryOperations(AgentSubstrateService):
    """Legacy alias for AgentSubstrateService."""
    pass