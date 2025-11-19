"""
Work Supervision API - Proxy routes to substrate-API for work output supervision.

This is a proxy layer that forwards supervision requests to substrate-API,
which owns the work_outputs table. Follows the BFF pattern:
- work-platform: orchestration and proxy
- substrate-api: data ownership and business logic

Endpoints:
- GET /supervision/baskets/{basket_id}/outputs - List outputs for review
- GET /supervision/baskets/{basket_id}/outputs/{output_id} - Get single output
- POST /supervision/baskets/{basket_id}/outputs/{output_id}/approve - Approve output
- POST /supervision/baskets/{basket_id}/outputs/{output_id}/reject - Reject output
- POST /supervision/baskets/{basket_id}/outputs/{output_id}/request-revision - Request revision
- GET /supervision/baskets/{basket_id}/stats - Get supervision statistics
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from app.utils.jwt import verify_jwt
from clients.substrate_client import get_substrate_client, SubstrateAPIError

router = APIRouter(prefix="/api/supervision", tags=["work-supervision"])
logger = logging.getLogger(__name__)


# ========================================================================
# Request/Response Models
# ========================================================================


class ApproveOutputRequest(BaseModel):
    """Request to approve an output."""
    notes: Optional[str] = Field(None, description="Optional approval notes")


class RejectOutputRequest(BaseModel):
    """Request to reject an output."""
    notes: str = Field(..., description="Reason for rejection (required)")


class RequestRevisionRequest(BaseModel):
    """Request to ask for revision."""
    feedback: str = Field(..., description="Revision feedback (required)")


class SupervisionActionResponse(BaseModel):
    """Response after supervision action."""
    output_id: str
    supervision_status: str
    message: str


# ========================================================================
# Proxy Endpoints - Forward to substrate-API
# ========================================================================


@router.get("/baskets/{basket_id}/outputs")
async def list_outputs(
    basket_id: str,
    supervision_status: Optional[str] = Query(None, description="Filter by status"),
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    output_type: Optional[str] = Query(None, description="Filter by output type"),
    work_ticket_id: Optional[str] = Query(None, description="Filter by session"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user: dict = Depends(verify_jwt),
):
    """
    List work outputs for a basket (proxy to substrate-API).

    Returns outputs pending user review with filtering options.
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Listing outputs for basket {basket_id}")

    try:
        client = get_substrate_client()
        result = client.list_work_outputs(
            basket_id=basket_id,
            work_ticket_id=work_ticket_id,
            supervision_status=supervision_status,
            agent_type=agent_type,
            output_type=output_type,
            limit=limit,
            offset=offset,
        )

        return result

    except SubstrateAPIError as e:
        logger.error(f"[SUPERVISION] Failed to list outputs: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=e.message)
    except Exception as e:
        logger.exception(f"[SUPERVISION] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/baskets/{basket_id}/outputs/{output_id}")
async def get_output(
    basket_id: str,
    output_id: str,
    user: dict = Depends(verify_jwt),
):
    """
    Get a specific work output (proxy to substrate-API).

    Returns detailed output information for review.
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Getting output {output_id} from basket {basket_id}")

    try:
        client = get_substrate_client()
        result = client.get_work_output(basket_id=basket_id, output_id=output_id)
        return result

    except SubstrateAPIError as e:
        logger.error(f"[SUPERVISION] Failed to get output: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=e.message)
    except Exception as e:
        logger.exception(f"[SUPERVISION] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/baskets/{basket_id}/stats")
async def get_supervision_stats(
    basket_id: str,
    user: dict = Depends(verify_jwt),
):
    """
    Get supervision statistics for a basket (proxy to substrate-API).

    Returns counts of outputs by status for dashboard display.
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Getting stats for basket {basket_id}")

    try:
        client = get_substrate_client()
        result = client.get_supervision_stats(basket_id=basket_id)
        return result

    except SubstrateAPIError as e:
        logger.error(f"[SUPERVISION] Failed to get stats: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=e.message)
    except Exception as e:
        logger.exception(f"[SUPERVISION] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/baskets/{basket_id}/outputs/{output_id}/approve",
    response_model=SupervisionActionResponse,
)
async def approve_output(
    basket_id: str,
    output_id: str,
    request: ApproveOutputRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Approve a work output (proxy to substrate-API).

    Marks output as approved for user's knowledge base.
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Approving output {output_id} by user {user_id}")

    try:
        client = get_substrate_client()
        client.update_work_output_status(
            basket_id=basket_id,
            output_id=output_id,
            supervision_status="approved",
            reviewer_notes=request.notes,
            reviewer_id=user_id,
        )

        logger.info(f"[SUPERVISION] ✅ Output {output_id} approved")

        return SupervisionActionResponse(
            output_id=output_id,
            supervision_status="approved",
            message="Output approved successfully",
        )

    except SubstrateAPIError as e:
        logger.error(f"[SUPERVISION] Failed to approve output: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=e.message)
    except Exception as e:
        logger.exception(f"[SUPERVISION] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/baskets/{basket_id}/outputs/{output_id}/reject",
    response_model=SupervisionActionResponse,
)
async def reject_output(
    basket_id: str,
    output_id: str,
    request: RejectOutputRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Reject a work output (proxy to substrate-API).

    Marks output as rejected with required notes explaining why.
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    if not request.notes or len(request.notes.strip()) == 0:
        raise HTTPException(status_code=400, detail="Rejection notes are required")

    logger.info(f"[SUPERVISION] Rejecting output {output_id}: {request.notes}")

    try:
        client = get_substrate_client()
        client.update_work_output_status(
            basket_id=basket_id,
            output_id=output_id,
            supervision_status="rejected",
            reviewer_notes=request.notes,
            reviewer_id=user_id,
        )

        logger.info(f"[SUPERVISION] ❌ Output {output_id} rejected")

        return SupervisionActionResponse(
            output_id=output_id,
            supervision_status="rejected",
            message=f"Output rejected: {request.notes}",
        )

    except SubstrateAPIError as e:
        logger.error(f"[SUPERVISION] Failed to reject output: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=e.message)
    except Exception as e:
        logger.exception(f"[SUPERVISION] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/baskets/{basket_id}/outputs/{output_id}/request-revision",
    response_model=SupervisionActionResponse,
)
async def request_revision(
    basket_id: str,
    output_id: str,
    request: RequestRevisionRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Request revision for a work output (proxy to substrate-API).

    Marks output as needing revision with feedback for the agent.
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    if not request.feedback or len(request.feedback.strip()) == 0:
        raise HTTPException(status_code=400, detail="Revision feedback is required")

    logger.info(f"[SUPERVISION] Requesting revision for {output_id}: {request.feedback}")

    try:
        client = get_substrate_client()
        client.update_work_output_status(
            basket_id=basket_id,
            output_id=output_id,
            supervision_status="revision_requested",
            reviewer_notes=request.feedback,
            reviewer_id=user_id,
        )

        logger.info(f"[SUPERVISION] 🔄 Revision requested for output {output_id}")

        return SupervisionActionResponse(
            output_id=output_id,
            supervision_status="revision_requested",
            message=f"Revision requested: {request.feedback}",
        )

    except SubstrateAPIError as e:
        logger.error(f"[SUPERVISION] Failed to request revision: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=e.message)
    except Exception as e:
        logger.exception(f"[SUPERVISION] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
