"""
Permissions utility: Work request authorization and trial enforcement.

Phase 5: Enforces 10 total trial work requests globally across all agents.
After trial exhausted → user must subscribe to specific agent for unlimited requests.

Architecture:
- check_agent_work_request_allowed(): Pre-flight permission check
- record_work_request(): Create work request record (trial or paid)
- update_work_request_status(): Update request after execution
- get_trial_status(): Get remaining trial requests for user
"""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from clients.supabase_client import get_supabase_client
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class PermissionDeniedError(Exception):
    """Raised when user doesn't have permission to make work request."""

    def __init__(self, message: str, remaining_trials: Optional[int] = None, agent_type: Optional[str] = None):
        super().__init__(message)
        self.remaining_trials = remaining_trials
        self.agent_type = agent_type


async def check_agent_work_request_allowed(
    user_id: str,
    workspace_id: str,
    agent_type: str
) -> dict:
    """
    Check if user can make a work request for specified agent.

    Business Rules:
    - 10 FREE trial requests total (across ALL agents)
    - After trial exhausted → must subscribe to agent
    - Subscription = unlimited requests for that agent

    Args:
        user_id: User ID from JWT
        workspace_id: Workspace ID for context
        agent_type: Agent type ('research', 'content', 'reporting')

    Returns:
        Permission info dict with:
        - can_request: bool (True if allowed)
        - is_subscribed: bool (True if has subscription)
        - subscription_id: UUID or None
        - remaining_trial_requests: int or None (None if subscribed)

    Raises:
        PermissionDeniedError: If user cannot make request
        HTTPException: If validation fails
    """
    logger.info(f"Checking work request permission: user={user_id}, agent={agent_type}")

    # Validate agent type
    valid_agents = {"research", "content", "reporting"}
    if agent_type not in valid_agents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid agent_type: {agent_type}. Must be one of {valid_agents}"
        )

    # Call Supabase function to check trial limit
    supabase = get_supabase_client()

    try:
        # Call check_trial_limit() function
        response = supabase.rpc(
            "check_trial_limit",
            {
                "p_user_id": user_id,
                "p_workspace_id": workspace_id,
                "p_agent_type": agent_type
            }
        ).execute()

        if not response.data:
            logger.error(f"check_trial_limit returned no data for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to check trial limit"
            )

        permission_info = response.data

        # Log result
        if permission_info.get("is_subscribed"):
            logger.info(f"User {user_id} has subscription for {agent_type}")
        else:
            remaining = permission_info.get("remaining_trial_requests", 0)
            logger.info(f"User {user_id} has {remaining}/10 trial requests remaining")

        # Check if request allowed
        if not permission_info.get("can_request", False):
            remaining = permission_info.get("remaining_trial_requests", 0)
            raise PermissionDeniedError(
                f"Trial limit exhausted (0/{10} remaining). "
                f"Subscribe to {agent_type} agent for unlimited requests.",
                remaining_trials=remaining,
                agent_type=agent_type
            )

        return permission_info

    except PermissionDeniedError:
        raise
    except Exception as e:
        logger.error(f"Error checking work request permission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check permissions: {str(e)}"
        )


async def record_work_request(
    user_id: str,
    workspace_id: str,
    basket_id: str,
    agent_type: str,
    work_mode: str,
    request_payload: dict,
    permission_info: dict
) -> str:
    """
    Record work request in database.

    Args:
        user_id: User ID from JWT
        workspace_id: Workspace ID for context
        basket_id: Basket ID for work context
        agent_type: Agent type ('research', 'content', 'reporting')
        work_mode: Work mode ('governance_proposal', etc.)
        request_payload: Original request parameters
        permission_info: Result from check_agent_work_request_allowed()

    Returns:
        Work request ID (UUID string)

    Raises:
        HTTPException: If insertion fails
    """
    logger.info(f"Recording work request: user={user_id}, agent={agent_type}, mode={work_mode}")

    supabase = get_supabase_client()

    # Determine if trial request or paid
    is_trial = not permission_info.get("is_subscribed", False)
    subscription_id = permission_info.get("subscription_id")

    try:
        response = supabase.table("agent_work_requests").insert({
            "user_id": user_id,
            "workspace_id": workspace_id,
            "basket_id": basket_id,
            "agent_type": agent_type,
            "work_mode": work_mode,
            "request_payload": request_payload,
            "is_trial_request": is_trial,
            "subscription_id": subscription_id,
            "status": "pending"
        }).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record work request"
            )

        work_request_id = response.data[0]["id"]
        logger.info(f"Recorded work request {work_request_id} (trial={is_trial})")

        return work_request_id

    except Exception as e:
        logger.error(f"Error recording work request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record work request: {str(e)}"
        )


async def update_work_request_status(
    work_request_id: str,
    status: str,
    result_summary: Optional[str] = None,
    error_message: Optional[str] = None
) -> None:
    """
    Update work request status after execution.

    Args:
        work_request_id: Work request ID
        status: New status ('running', 'completed', 'failed')
        result_summary: Brief summary of result (optional)
        error_message: Error message if failed (optional)

    Raises:
        HTTPException: If update fails
    """
    logger.info(f"Updating work request {work_request_id}: status={status}")

    supabase = get_supabase_client()

    # Validate status
    valid_statuses = {"running", "completed", "failed"}
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {status}. Must be one of {valid_statuses}"
        )

    try:
        update_data = {"status": status}

        if status == "completed":
            update_data["completed_at"] = "now()"
            if result_summary:
                update_data["result_summary"] = result_summary

        elif status == "failed":
            update_data["completed_at"] = "now()"
            if error_message:
                update_data["error_message"] = error_message

        response = supabase.table("agent_work_requests").update(
            update_data
        ).eq("id", work_request_id).execute()

        if not response.data:
            logger.warning(f"No work request found with id {work_request_id}")

        logger.debug(f"Updated work request {work_request_id} to {status}")

    except Exception as e:
        logger.error(f"Error updating work request status: {e}")
        # Don't raise - this is non-critical, just log the error


async def get_trial_status(user_id: str, workspace_id: str) -> dict:
    """
    Get trial status for user (remaining trial requests).

    Args:
        user_id: User ID from JWT
        workspace_id: Workspace ID for context

    Returns:
        Trial status dict with:
        - used_trial_requests: int (0-10)
        - remaining_trial_requests: int (0-10)
        - total_trial_limit: int (10)
        - subscribed_agents: list of agent types with active subscriptions

    Raises:
        HTTPException: If query fails
    """
    logger.info(f"Getting trial status: user={user_id}")

    supabase = get_supabase_client()

    try:
        # Count used trial requests (global across all agents)
        trial_response = supabase.table("agent_work_requests").select(
            "id", count="exact"
        ).eq("user_id", user_id).eq(
            "workspace_id", workspace_id
        ).eq("is_trial_request", True).execute()

        used_count = trial_response.count or 0
        remaining = max(0, 10 - used_count)

        # Get active subscriptions
        subs_response = supabase.table("user_agent_subscriptions").select(
            "agent_type"
        ).eq("user_id", user_id).eq(
            "workspace_id", workspace_id
        ).eq("status", "active").execute()

        subscribed_agents = [sub["agent_type"] for sub in subs_response.data] if subs_response.data else []

        logger.debug(f"Trial status: {used_count}/10 used, subscriptions: {subscribed_agents}")

        return {
            "used_trial_requests": used_count,
            "remaining_trial_requests": remaining,
            "total_trial_limit": 10,
            "subscribed_agents": subscribed_agents
        }

    except Exception as e:
        logger.error(f"Error getting trial status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trial status: {str(e)}"
        )


async def create_agent_subscription(
    user_id: str,
    workspace_id: str,
    agent_type: str,
    stripe_subscription_id: Optional[str] = None,
    stripe_customer_id: Optional[str] = None
) -> str:
    """
    Create agent subscription for user (unlocks unlimited work requests).

    Args:
        user_id: User ID from JWT
        workspace_id: Workspace ID for context
        agent_type: Agent type to subscribe to
        stripe_subscription_id: Stripe subscription ID (optional for now)
        stripe_customer_id: Stripe customer ID (optional for now)

    Returns:
        Subscription ID (UUID string)

    Raises:
        HTTPException: If creation fails or subscription already exists
    """
    logger.info(f"Creating subscription: user={user_id}, agent={agent_type}")

    supabase = get_supabase_client()

    # Validate agent type
    valid_agents = {"research", "content", "reporting"}
    if agent_type not in valid_agents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid agent_type: {agent_type}. Must be one of {valid_agents}"
        )

    try:
        # Check if subscription already exists
        existing = supabase.table("user_agent_subscriptions").select("id").eq(
            "user_id", user_id
        ).eq("workspace_id", workspace_id).eq(
            "agent_type", agent_type
        ).eq("status", "active").execute()

        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Active subscription already exists for {agent_type} agent"
            )

        # Get agent pricing from catalog
        catalog = supabase.table("agent_catalog").select("monthly_price_cents").eq(
            "agent_type", agent_type
        ).eq("is_active", True).single().execute()

        if not catalog.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent '{agent_type}' not found in catalog"
            )

        monthly_price = catalog.data["monthly_price_cents"]

        # Create subscription
        response = supabase.table("user_agent_subscriptions").insert({
            "user_id": user_id,
            "workspace_id": workspace_id,
            "agent_type": agent_type,
            "status": "active",
            "monthly_price_cents": monthly_price,
            "stripe_subscription_id": stripe_subscription_id,
            "stripe_customer_id": stripe_customer_id
        }).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create subscription"
            )

        subscription_id = response.data[0]["id"]
        logger.info(f"Created subscription {subscription_id} for {agent_type} (${monthly_price/100:.2f}/mo)")

        return subscription_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subscription: {str(e)}"
        )
