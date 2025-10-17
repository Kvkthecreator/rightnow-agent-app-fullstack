"""
P2 Relationship Inference Endpoints (V3.1 Compliant)

Implements P2 Graph Intelligence pipeline:
- Manual trigger for relationship inference
- Batch processing of substrate blocks
- Semantic relationship discovery via LLM

V3.1 Features:
- Semantic search for relationship candidates
- LLM verification (gpt-4o-mini) for causal relationships
- Confidence-based governance (>0.90 auto-accept, 0.70-0.90 propose)
- 4 causal types: addresses, supports, contradicts, depends_on
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.utils.supabase import supabase_admin
from app.utils.jwt import verify_jwt
from app.agents.pipeline.graph_agent import P2GraphAgent, RelationshipMappingRequest

router = APIRouter(prefix="/p2", tags=["p2-graph"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class InferRelationshipsRequest(BaseModel):
    basket_id: str = Field(..., description="Target basket UUID")


class InferRelationshipsResponse(BaseModel):
    basket_id: str
    relationships_created: int
    substrate_analyzed: int
    avg_confidence: float
    processing_time_ms: int


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/infer-relationships", response_model=InferRelationshipsResponse)
async def infer_relationships(
    request: InferRelationshipsRequest,
    user_id: str = Depends(verify_jwt),
    background_tasks: BackgroundTasks = None
):
    """
    Trigger P2 relationship inference for a basket.

    Process:
    1. Validates basket has sufficient blocks (>= 2)
    2. Triggers P2 Graph Agent to infer relationships
    3. Returns inference statistics

    Relationships are created with confidence-based governance:
    - High confidence (>0.90): Auto-accepted
    - Medium confidence (0.70-0.90): Proposed for user review
    - Low confidence (<0.70): Skipped
    """
    supabase = supabase_admin()

    try:
        # Validate basket exists and user has access
        basket_result = supabase.table('baskets').select(
            'id, workspace_id, user_id'
        ).eq('id', request.basket_id).maybe_single().execute()

        if not basket_result.data:
            raise HTTPException(status_code=404, detail="Basket not found")

        basket = basket_result.data
        workspace_id = basket['workspace_id']

        # Verify access (user owns basket or workspace)
        # Simplified access check - should integrate with workspace membership
        if basket['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check basket has sufficient blocks
        blocks_result = supabase.table('blocks').select('id').eq(
            'basket_id', request.basket_id
        ).in_('state', ['ACCEPTED', 'LOCKED', 'CONSTANT']).execute()

        if not blocks_result.data or len(blocks_result.data) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least 2 blocks for relationship inference. Found: {len(blocks_result.data or [])}"
            )

        # Trigger P2 Graph Agent
        agent = P2GraphAgent()
        agent_request = RelationshipMappingRequest(
            workspace_id=UUID(workspace_id),
            basket_id=UUID(request.basket_id),
            substrate_ids=[],  # Process all blocks in basket
            agent_id=f"manual-trigger-{user_id}-{datetime.utcnow().isoformat()}"
        )

        result = await agent.map_relationships(agent_request)

        return InferRelationshipsResponse(
            basket_id=request.basket_id,
            relationships_created=len(result.relationships_created),
            substrate_analyzed=result.substrate_analyzed,
            avg_confidence=result.connection_strength_avg,
            processing_time_ms=result.processing_time_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to infer relationships: {str(e)}"
        )
