"""
Onboarding Scaffolder - Phase 6: Deterministic Basket-First Setup

Orchestrates creation of basket + raw_dump + work_request for NEW users.

This is a WRAPPER for new user onboarding, NOT a replacement for existing
agent execution flows. No inference, no basket selection logic - just
deterministic scaffolding.

Future: Smart work orchestration with basket inference will be separate.
"""

from __future__ import annotations

import logging
from typing import Optional

from clients.substrate_client import get_substrate_client
from utils.permissions import (
    check_agent_work_request_allowed,
    record_work_request,
    PermissionDeniedError,
)
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class ScaffoldingError(Exception):
    """Raised when onboarding scaffolding fails at a specific step."""

    def __init__(
        self,
        message: str,
        step: str,
        details: Optional[dict] = None,
        basket_id: Optional[str] = None,
        dump_id: Optional[str] = None,
    ):
        self.message = message
        self.step = step  # "create_basket", "create_dump", "create_work_request"
        self.details = details or {}
        self.basket_id = basket_id
        self.dump_id = dump_id
        super().__init__(message)


async def scaffold_new_user_onboarding(
    user_id: str,
    workspace_id: str,
    agent_type: str,
    initial_context: str,
    work_mode: str = "general",
    basket_name: Optional[str] = None,
) -> dict:
    """
    Scaffold new work request with basket-first approach (NEW users only).

    Phase 6: Deterministic onboarding flow - always creates new basket.
    No inference, no basket selection, no "which basket?" logic.

    Future: Smart orchestration for existing users will be separate service.

    Args:
        user_id: User ID from JWT
        workspace_id: Workspace ID for context
        agent_type: Agent type ('research', 'content', 'reporting')
        initial_context: Raw text input to seed basket
        work_mode: Work mode (default: "general")
        basket_name: Optional basket name (auto-generated if not provided)

    Returns:
        {
            "work_request_id": "...",
            "basket_id": "...",
            "basket_name": "...",
            "dump_id": "...",
            "status": "scaffolded",
            "is_trial_request": true/false,
            "remaining_trials": 7,
            "next_step": "Use POST /api/agents/run to execute agent"
        }

    Raises:
        PermissionDeniedError: If trial exhausted and not subscribed
        ScaffoldingError: If scaffolding fails at any step
        HTTPException: If validation fails
    """
    logger.info(
        f"[ONBOARDING] Scaffolding for NEW user: user={user_id}, agent={agent_type}"
    )

    basket_id = None
    dump_id = None
    work_request_id = None

    try:
        # ================================================================
        # Step 1: Check Permissions (Phase 5 trial/subscription)
        # ================================================================
        try:
            permission_info = await check_agent_work_request_allowed(
                user_id=user_id,
                workspace_id=workspace_id,
                agent_type=agent_type,
            )
            logger.debug(
                f"[ONBOARDING] Permission check passed: "
                f"subscribed={permission_info.get('is_subscribed')}, "
                f"remaining_trials={permission_info.get('remaining_trial_requests')}"
            )
        except PermissionDeniedError as e:
            logger.warning(f"[ONBOARDING] Permission denied: {e}")
            raise

        # ================================================================
        # Step 2: Create Basket (substrate-api via HTTP - Phase 3 BFF)
        # ================================================================
        substrate_client = get_substrate_client()

        # Auto-generate basket name if not provided
        if not basket_name:
            basket_name = f"{agent_type.capitalize()} Work - {user_id[:8]}"

        basket_metadata = {
            "agent_type": agent_type,
            "created_via": "onboarding_scaffolder",
            "work_mode": work_mode,
        }

        try:
            logger.debug(f"[ONBOARDING] Creating basket: {basket_name}")
            basket_response = substrate_client.create_basket(
                workspace_id=workspace_id,
                name=basket_name,
                metadata=basket_metadata,
                user_id=user_id,
            )
            basket_id = basket_response["basket_id"]
            logger.info(f"[ONBOARDING] Created basket {basket_id} via substrate-api")

        except Exception as e:
            logger.error(f"[ONBOARDING] Failed to create basket: {e}")
            raise ScaffoldingError(
                message=f"Failed to create basket: {str(e)}",
                step="create_basket",
                details={"error": str(e), "basket_name": basket_name},
            )

        # ================================================================
        # Step 3: Create Raw Dump (substrate-api via HTTP)
        # ================================================================
        dump_metadata = {
            "source": "onboarding_scaffolder",
            "agent_type": agent_type,
            "work_mode": work_mode,
        }

        try:
            logger.debug(
                f"[ONBOARDING] Creating raw_dump for basket {basket_id}"
            )
            dump_response = substrate_client.create_dump(
                basket_id=basket_id,
                content=initial_context,
                metadata=dump_metadata,
            )
            dump_id = dump_response.get("dump_id") or dump_response.get("id")
            logger.info(
                f"[ONBOARDING] Created raw_dump {dump_id} for basket {basket_id}"
            )

        except Exception as e:
            logger.error(f"[ONBOARDING] Failed to create raw_dump: {e}")
            raise ScaffoldingError(
                message=f"Failed to create raw_dump: {str(e)}",
                step="create_dump",
                details={"error": str(e)},
                basket_id=basket_id,
            )

        # ================================================================
        # Step 4: Create Agent Work Request (work-platform DB)
        # ================================================================
        request_payload = {
            "initial_context": initial_context[:200],  # Truncate for storage
            "basket_name": basket_name,
            "scaffolding_timestamp": "now()",
            "dump_id": dump_id,
        }

        try:
            logger.debug(
                f"[ONBOARDING] Recording work_request for basket {basket_id}"
            )
            work_request_id = await record_work_request(
                user_id=user_id,
                workspace_id=workspace_id,
                basket_id=basket_id,
                agent_type=agent_type,
                work_mode=work_mode,
                request_payload=request_payload,
                permission_info=permission_info,
            )
            logger.info(
                f"[ONBOARDING] Recorded work_request {work_request_id} "
                f"(trial={not permission_info.get('is_subscribed')})"
            )

        except Exception as e:
            logger.error(f"[ONBOARDING] Failed to create work_request: {e}")
            raise ScaffoldingError(
                message=f"Failed to create work_request: {str(e)}",
                step="create_work_request",
                details={"error": str(e)},
                basket_id=basket_id,
                dump_id=dump_id,
            )

        # ================================================================
        # Step 5: Return Orchestration Result
        # ================================================================
        # TODO: Agent scaffolding decision point (deferred to future phase)
        # if should_scaffold_agent_context(agent_type, work_mode):
        #     await initialize_agent_context(basket_id, agent_type)

        logger.info(
            f"[ONBOARDING] ✅ SUCCESS: work_request={work_request_id}, "
            f"basket={basket_id}, dump={dump_id}"
        )

        return {
            "work_request_id": work_request_id,
            "basket_id": basket_id,
            "basket_name": basket_name,
            "dump_id": dump_id,
            "status": "scaffolded",
            "is_trial_request": not permission_info.get("is_subscribed", False),
            "remaining_trials": permission_info.get("remaining_trial_requests"),
            "next_step": f"Use POST /api/agents/run with basket_id={basket_id} to execute {agent_type} agent",
        }

    except PermissionDeniedError:
        # Re-raise permission errors as-is (handled by endpoint)
        raise

    except ScaffoldingError:
        # Re-raise scaffolding errors as-is (handled by endpoint)
        raise

    except Exception as e:
        logger.exception(f"[ONBOARDING] Unexpected error during scaffolding: {e}")
        raise ScaffoldingError(
            message=f"Unexpected scaffolding error: {str(e)}",
            step="unknown",
            details={"error": str(e), "type": type(e).__name__},
            basket_id=basket_id,
            dump_id=dump_id,
        )
