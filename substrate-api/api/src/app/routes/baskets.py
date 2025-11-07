import json
import os
import sys
from uuid import uuid4, UUID
from typing import Optional

# CRITICAL: Add src to path BEFORE any other imports that depend on it
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from contracts.basket import BasketChangeRequest, BasketDelta
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError
from ..baskets.schemas import BasketWorkRequest
from typing import Union
from infra.substrate.services.deltas import list_deltas, persist_delta, try_apply_delta
from infra.substrate.services.idempotency import (
    already_processed,
    fetch_delta_by_request_id,
    mark_processed,
)
# Legacy manager removed - use canonical queue processor
from src.services.canonical_queue_processor import CanonicalQueueProcessor, get_canonical_queue_health

# Import deps AFTER path setup
from ..deps import get_db
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/api/baskets", tags=["baskets"])


# ========================================================================
# Phase 6: Basket Creation Models
# ========================================================================


class CreateBasketRequest(BaseModel):
    """Request model for creating a new basket."""

    workspace_id: str = Field(..., description="Workspace ID for basket")
    name: str = Field(..., min_length=1, max_length=200, description="Basket name")
    metadata: Optional[dict] = Field(default_factory=dict, description="Metadata (stored in tags as JSON)")
    user_id: Optional[str] = Field(None, description="User ID (for audit trail)")


class CreateBasketResponse(BaseModel):
    """Response model for basket creation."""

    basket_id: str
    name: str
    workspace_id: str
    status: str
    user_id: Optional[str]
    created_at: str


# ========================================================================
# Phase 6: Basket Creation Endpoint
# ========================================================================


@router.post("", response_model=CreateBasketResponse, status_code=201)
async def create_basket(
    request: CreateBasketRequest,
    db=Depends(get_db),  # noqa: B008
):
    """
    Create a new basket.

    Phase 6: Called by work-platform's onboarding_scaffolder via substrate_client.
    This endpoint is part of the Phase 3 BFF architecture - work-platform never
    touches substrate tables directly.

    Args:
        request: Basket creation parameters
        db: Database connection

    Returns:
        Created basket information

    Raises:
        HTTPException 400: Invalid workspace_id or validation error
        HTTPException 500: Database error
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        # Validate workspace_id is valid UUID
        try:
            workspace_uuid = UUID(request.workspace_id)
        except (ValueError, AttributeError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid workspace_id format: {request.workspace_id}",
            ) from e

        # Validate user_id if provided
        user_uuid = None
        if request.user_id:
            try:
                user_uuid = UUID(request.user_id)
            except (ValueError, AttributeError) as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid user_id format: {request.user_id}",
                ) from e

        # Generate basket ID
        basket_id = uuid4()

        # Prepare tags array with metadata
        tags = []
        if request.metadata:
            # Store metadata keys as tags for searchability
            for key, value in request.metadata.items():
                tags.append(f"{key}:{str(value)}")

        # Insert basket using actual production schema
        query = """
            INSERT INTO baskets (id, name, workspace_id, user_id, status, tags, origin_template)
            VALUES (:id, :name, :workspace_id, :user_id, :status, :tags, :origin_template)
            RETURNING id, name, workspace_id, user_id, status, created_at
        """

        result = await db.fetch_one(
            query,
            values={
                "id": str(basket_id),
                "name": request.name,
                "workspace_id": str(workspace_uuid),
                "user_id": str(user_uuid) if user_uuid else None,
                "status": "INIT",  # basket_state enum default
                "tags": tags,
                "origin_template": "work_platform_onboarding",  # origin_template for tracking
            },
        )

        if not result:
            raise HTTPException(status_code=500, detail="Failed to create basket")

        logger.info(
            f"[BASKET CREATE] Created basket {result['id']} "
            f"for workspace {result['workspace_id']} via Phase 6 onboarding"
        )

        return CreateBasketResponse(
            basket_id=str(result["id"]),
            name=result["name"],
            workspace_id=str(result["workspace_id"]),
            user_id=str(result["user_id"]) if result["user_id"] else None,
            status=str(result["status"]),
            created_at=result["created_at"].isoformat(),
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise

    except Exception as e:
        logger.exception(f"Failed to create basket: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create basket: {str(e)}"
        ) from e


@router.post("/{basket_id}/work", response_model=BasketDelta)
async def post_basket_work(
    basket_id: str,
    request: Request,
    user: dict = Depends(verify_jwt),  # noqa: B008
    db=Depends(get_db),  # noqa: B008
):
    """Process basket work request with mode support"""
    
    # Parse request body to determine format
    try:
        body = await request.json()
    except Exception as err:
        raise HTTPException(400, "Invalid JSON") from err

    workspace_id = get_or_create_workspace(user["user_id"])
    trace_req_id = request.headers.get("X-Req-Id")

    if "mode" in body:
        # New BasketWorkRequest format
        from ..baskets.schemas import BasketWorkRequest
        try:
            work_req = BasketWorkRequest.model_validate(body)
        except ValidationError as err:
            raise HTTPException(422, err.errors())

        # Attach trace ID (don't lose it)
        work_req.options.trace_req_id = trace_req_id

        # Idempotency for new mode - prioritize trace_req_id for deduplication
        request_id = (work_req.options.trace_req_id
                      or request.headers.get("X-Req-Id")
                      or f"work_{uuid4().hex[:8]}")
        if await already_processed(db, request_id):
            cached_delta = await fetch_delta_by_request_id(db, request_id)
            if not cached_delta:
                raise HTTPException(409, "Duplicate request but missing delta")
            return BasketDelta(**json.loads(cached_delta["payload"]))

        # ✅ Call canonical queue processor for basket work
        processor = CanonicalQueueProcessor()
        delta = await processor.process_basket_work(basket_id, work_req, workspace_id)

        await persist_delta(db, delta, request_id)
        await mark_processed(db, request_id, delta.delta_id)
        return delta

    else:
        # Legacy BasketChangeRequest format
        try:
            req = BasketChangeRequest.model_validate(body)
        except ValidationError as err:
            raise HTTPException(422, err.errors())
        if req.basket_id != basket_id:
            raise HTTPException(400, "basket_id mismatch")

        if await already_processed(db, req.request_id):
            cached_delta = await fetch_delta_by_request_id(db, req.request_id)
            if not cached_delta:
                raise HTTPException(409, "Duplicate request but missing delta")
            return BasketDelta(**json.loads(cached_delta["payload"]))

        # Legacy path with basket_id - use canonical queue processor
        processor = CanonicalQueueProcessor()
        delta = await processor.process_basket_change(basket_id, req, workspace_id)

        await persist_delta(db, delta, req.request_id)
        await mark_processed(db, req.request_id, delta.delta_id)
        return delta


@router.get("/{basket_id}/deltas")
async def get_basket_deltas(basket_id: str, db=Depends(get_db)):  # noqa: B008
    """Get all deltas for a basket"""
    return await list_deltas(db, basket_id)


@router.post("/{basket_id}/apply/{delta_id}")
async def apply_basket_delta(
    basket_id: str,
    delta_id: str,
    db=Depends(get_db),  # noqa: B008
):
    """Apply a specific delta"""
    success = await try_apply_delta(db, basket_id, delta_id)
    if not success:
        raise HTTPException(409, "Version conflict or delta not found")

    return {"status": "applied", "basket_id": basket_id, "delta_id": delta_id}
