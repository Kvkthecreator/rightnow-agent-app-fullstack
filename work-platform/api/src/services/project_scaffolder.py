"""
Project Scaffolder - Phase 6 Refactor: Project-First Onboarding

Creates user-facing PROJECTS (not just work requests) with underlying basket infrastructure.

DOMAIN SEPARATION:
- Projects = User-facing containers (work-platform domain)
- Baskets = Storage infrastructure (substrate domain)
- Currently 1:1 mapping, but architecturally decoupled

This is for NEW user onboarding. Existing agent execution flows remain unchanged.
"""

from __future__ import annotations

import logging
from typing import Optional
from datetime import datetime

from clients.substrate_client import get_substrate_client
from app.utils.supabase_client import supabase_client, supabase_admin_client
from utils.permissions import (
    check_agent_work_request_allowed,
    record_work_request,
    PermissionDeniedError,
)
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class ProjectScaffoldingError(Exception):
    """Raised when project scaffolding fails at a specific step."""

    def __init__(
        self,
        message: str,
        step: str,
        details: Optional[dict] = None,
        project_id: Optional[str] = None,
        basket_id: Optional[str] = None,
        dump_id: Optional[str] = None,
    ):
        self.message = message
        self.step = step  # "create_basket", "create_dump", "create_project", "create_work_request"
        self.details = details or {}
        self.project_id = project_id
        self.basket_id = basket_id
        self.dump_id = dump_id
        super().__init__(message)


async def scaffold_new_project(
    user_id: str,
    workspace_id: str,
    project_name: str,
    project_type: str,  # 'research', 'content_creation', 'reporting', 'analysis', 'general'
    initial_context: str,
    description: Optional[str] = None,
) -> dict:
    """
    Scaffold new project with basket-first infrastructure (NEW users).

    Phase 6 Refactor: Creates PROJECT (user-facing) with underlying BASKET (storage).

    Flow:
    1. Check permissions (trial/subscription)
    2. Create basket (substrate-api) with origin_template='project_onboarding'
    3. Create raw_dump (substrate-api) with initial context
    4. Create project (work-platform DB) linking to basket
    5. Record work_request (for trial tracking)

    Args:
        user_id: User ID from JWT
        workspace_id: Workspace ID for context
        project_name: User-provided project name
        project_type: Project type (research, content_creation, reporting, analysis, general)
        initial_context: Initial context/notes to seed project
        description: Optional project description

    Returns:
        {
            "project_id": "...",
            "project_name": "...",
            "basket_id": "...",
            "dump_id": "...",
            "work_request_id": "...",
            "status": "active",
            "is_trial_request": true/false,
            "remaining_trials": 7,
            "next_step": "Navigate to project dashboard to begin work"
        }

    Raises:
        PermissionDeniedError: If trial exhausted and not subscribed
        ProjectScaffoldingError: If scaffolding fails at any step
    """
    logger.info(
        f"[PROJECT SCAFFOLDING] Creating project for user={user_id}, "
        f"type={project_type}, workspace={workspace_id}"
    )

    basket_id = None
    dump_id = None
    project_id = None
    work_request_id = None

    try:
        # ================================================================
        # Step 1: Check Permissions (Phase 5 trial/subscription)
        # ================================================================
        try:
            # Map project_type to agent_type for permission check
            agent_type_map = {
                "research": "research",
                "content_creation": "content",
                "reporting": "reporting",
                "analysis": "research",  # Analysis uses research agent
                "general": "research",    # General defaults to research
            }
            agent_type = agent_type_map.get(project_type, "research")

            permission_info = await check_agent_work_request_allowed(
                user_id=user_id,
                workspace_id=workspace_id,
                agent_type=agent_type,
            )
            logger.debug(
                f"[PROJECT SCAFFOLDING] Permission check passed: "
                f"subscribed={permission_info.get('is_subscribed')}, "
                f"remaining_trials={permission_info.get('remaining_trial_requests')}"
            )
        except PermissionDeniedError as e:
            logger.warning(f"[PROJECT SCAFFOLDING] Permission denied: {e}")
            raise

        # ================================================================
        # Step 2: Create Basket (substrate-api via HTTP - Phase 3 BFF)
        # ================================================================
        substrate_client = get_substrate_client()

        basket_metadata = {
            "project_type": project_type,
            "created_via": "project_scaffolder",
            "origin": "new_project_onboarding",
            "origin_template": "project_onboarding",
        }

        try:
            logger.debug(f"[PROJECT SCAFFOLDING] Creating basket: {project_name}")
            basket_response = substrate_client.create_basket(
                workspace_id=workspace_id,
                name=project_name,
                metadata=basket_metadata,
                user_id=user_id,
            )
            basket_id = basket_response["basket_id"]
            logger.info(
                f"[PROJECT SCAFFOLDING] Created basket {basket_id} via substrate-api"
            )

        except Exception as e:
            logger.error(f"[PROJECT SCAFFOLDING] Failed to create basket: {e}")
            raise ProjectScaffoldingError(
                message=f"Failed to create basket: {str(e)}",
                step="create_basket",
                details={"error": str(e), "basket_name": project_name},
            )

        # ================================================================
        # Step 3: Create Raw Dump (substrate-api via HTTP)
        # ================================================================
        dump_metadata = {
            "source": "project_scaffolder",
            "project_type": project_type,
            "is_initial_context": True,
        }

        try:
            logger.debug(
                f"[PROJECT SCAFFOLDING] Creating raw_dump for basket {basket_id}"
            )
            dump_response = substrate_client.create_dump(
                basket_id=basket_id,
                content=initial_context,
                metadata=dump_metadata,
            )
            dump_id = dump_response.get("dump_id") or dump_response.get("id")
            logger.info(
                f"[PROJECT SCAFFOLDING] Created raw_dump {dump_id} for basket {basket_id}"
            )

        except Exception as e:
            logger.error(f"[PROJECT SCAFFOLDING] Failed to create raw_dump: {e}")
            raise ProjectScaffoldingError(
                message=f"Failed to create raw_dump: {str(e)}",
                step="create_dump",
                details={"error": str(e)},
                basket_id=basket_id,
            )

        # ================================================================
        # Step 4: Create Project (work-platform DB)
        # ================================================================

        # CRITICAL: PostgREST schema cache is completely stale for projects table
        # Only insert absolute minimum required fields until cache is reloaded
        project_data = {
            "workspace_id": workspace_id,
            "user_id": user_id,
            "name": project_name,
            "basket_id": basket_id,
            # All other fields commented out due to PostgREST PGRST204 errors
            # Uncomment after reloading schema cache in Supabase Dashboard
            # "description": description,
            # "project_type": project_type,
            # "status": "active",
            # "origin_template": "onboarding_v1",
            # "onboarded_at": datetime.utcnow().isoformat(),
            # "metadata": {...},
        }

        try:
            logger.debug(
                f"[PROJECT SCAFFOLDING] Creating project record for basket {basket_id}"
            )
            response = supabase_admin_client.table("projects").insert(project_data).execute()

            if not response.data or len(response.data) == 0:
                raise Exception("No project created in database")

            project_id = response.data[0]["id"]
            logger.info(
                f"[PROJECT SCAFFOLDING] Created project {project_id} linking to basket {basket_id}"
            )

        except Exception as e:
            logger.error(f"[PROJECT SCAFFOLDING] Failed to create project: {e}")
            raise ProjectScaffoldingError(
                message=f"Failed to create project: {str(e)}",
                step="create_project",
                details={"error": str(e)},
                basket_id=basket_id,
                dump_id=dump_id,
            )

        # ================================================================
        # Step 5: Create Agent Work Request (for trial tracking)
        # ================================================================
        request_payload = {
            "project_id": project_id,
            "project_name": project_name,
            "initial_context": initial_context[:200],  # Truncate for storage
            "scaffolding_timestamp": "now()",
            "dump_id": dump_id,
        }

        try:
            logger.debug(
                f"[PROJECT SCAFFOLDING] Recording work_request for project {project_id}"
            )
            work_request_id = await record_work_request(
                user_id=user_id,
                workspace_id=workspace_id,
                basket_id=basket_id,
                agent_type=agent_type,
                work_mode="general",
                request_payload=request_payload,
                permission_info=permission_info,
            )
            logger.info(
                f"[PROJECT SCAFFOLDING] Recorded work_request {work_request_id} "
                f"(trial={not permission_info.get('is_subscribed')})"
            )

        except Exception as e:
            logger.error(f"[PROJECT SCAFFOLDING] Failed to create work_request: {e}")
            raise ProjectScaffoldingError(
                message=f"Failed to create work_request: {str(e)}",
                step="create_work_request",
                details={"error": str(e)},
                project_id=project_id,
                basket_id=basket_id,
                dump_id=dump_id,
            )

        # ================================================================
        # Step 6: Return Orchestration Result
        # ================================================================
        logger.info(
            f"[PROJECT SCAFFOLDING] ✅ SUCCESS: project={project_id}, "
            f"basket={basket_id}, work_request={work_request_id}"
        )

        return {
            "project_id": project_id,
            "project_name": project_name,
            "basket_id": basket_id,
            "dump_id": dump_id,
            "work_request_id": work_request_id,
            "status": "active",
            "is_trial_request": not permission_info.get("is_subscribed", False),
            "remaining_trials": permission_info.get("remaining_trial_requests"),
            "next_step": f"Navigate to /projects/{project_id} to begin work",
        }

    except PermissionDeniedError:
        # Re-raise permission errors as-is (handled by endpoint)
        raise

    except ProjectScaffoldingError:
        # Re-raise scaffolding errors as-is (handled by endpoint)
        raise

    except Exception as e:
        logger.exception(f"[PROJECT SCAFFOLDING] Unexpected error during scaffolding: {e}")
        raise ProjectScaffoldingError(
            message=f"Unexpected scaffolding error: {str(e)}",
            step="unknown",
            details={"error": str(e), "type": type(e).__name__},
            project_id=project_id,
            basket_id=basket_id,
            dump_id=dump_id,
        )
