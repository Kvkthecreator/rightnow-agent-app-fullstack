"""
Checkpoint Handler: Manages execution checkpoints for user review.

This service handles:
1. Checkpoint creation (pause points in agent execution)
2. Checkpoint approval/rejection
3. Intermediate output storage
4. Resume context management

Phase 2: Agent Execution & Checkpoints
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from supabase import create_client
import os

logger = logging.getLogger(__name__)


class CheckpointHandler:
    """
    Handles execution checkpoints for work sessions.

    Checkpoints are pause points where:
    - Agent pauses execution
    - Intermediate outputs are saved
    - User reviews progress
    - User approves/rejects/provides feedback
    - Execution resumes (or fails)
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None
    ):
        """
        Initialize checkpoint handler.

        Args:
            supabase_url: Supabase project URL (defaults to env var)
            supabase_key: Supabase service role key (defaults to env var)
        """
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required"
            )

        self.supabase = create_client(self.supabase_url, self.supabase_key)
        logger.info("[CHECKPOINT HANDLER] Initialized")

    async def create_checkpoint(
        self,
        work_ticket_id: str | UUID,
        reason: str,
        output_ids: List[str]
    ) -> str:
        """
        Create a checkpoint for user review.

        Args:
            work_ticket_id: Work session UUID
            reason: Reason for checkpoint (why agent paused)
            output_ids: List of output UUIDs created at this checkpoint

        Returns:
            Created checkpoint UUID

        Example:
            checkpoint_id = await handler.create_checkpoint(
                work_ticket_id="uuid",
                reason="Low confidence findings require review",
                output_ids=["output_uuid_1", "output_uuid_2"]
            )
        """
        work_ticket_id = str(work_ticket_id)

        logger.info(
            f"[CHECKPOINT HANDLER] Creating checkpoint for session {work_ticket_id}: "
            f"{reason}"
        )

        checkpoint_data = {
            "work_ticket_id": work_ticket_id,
            "reason": reason,
            "status": "pending_review",  # pending_review | approved | rejected
            "metadata": {
                "output_ids": output_ids,
                "output_count": len(output_ids),
                "created_at": datetime.utcnow().isoformat(),
            }
        }

        response = self.supabase.table("work_checkpoints").insert(
            checkpoint_data
        ).execute()

        if not response.data:
            raise Exception("Failed to create checkpoint")

        checkpoint_id = response.data[0]["id"]

        logger.info(
            f"[CHECKPOINT HANDLER] ✅ Created checkpoint {checkpoint_id} "
            f"with {len(output_ids)} outputs"
        )

        return checkpoint_id

    async def approve_checkpoint(
        self,
        checkpoint_id: str | UUID,
        reviewed_by_user_id: str,
        feedback: Optional[str] = None
    ) -> bool:
        """
        Approve a checkpoint, allowing execution to resume.

        Args:
            checkpoint_id: Checkpoint UUID
            reviewed_by_user_id: User ID who approved
            feedback: Optional feedback/notes from user

        Returns:
            True if approval successful

        Side effects:
            - Updates checkpoint status to "approved"
            - Records reviewer and timestamp
            - Work session executor can now resume
        """
        checkpoint_id = str(checkpoint_id)

        logger.info(
            f"[CHECKPOINT HANDLER] Approving checkpoint {checkpoint_id} "
            f"by user {reviewed_by_user_id}"
        )

        update_data = {
            "status": "approved",
            "reviewed_by_user_id": reviewed_by_user_id,
            "reviewed_at": datetime.utcnow().isoformat(),
            "metadata": {
                "feedback": feedback,
                "approved_at": datetime.utcnow().isoformat()
            }
        }

        response = self.supabase.table("work_checkpoints").update(
            update_data
        ).eq("id", checkpoint_id).execute()

        success = bool(response.data)

        if success:
            logger.info(f"[CHECKPOINT HANDLER] ✅ Checkpoint {checkpoint_id} approved")
        else:
            logger.error(f"[CHECKPOINT HANDLER] ❌ Failed to approve checkpoint {checkpoint_id}")

        return success

    async def reject_checkpoint(
        self,
        checkpoint_id: str | UUID,
        reviewed_by_user_id: str,
        rejection_reason: str
    ) -> bool:
        """
        Reject a checkpoint, failing the work session.

        Args:
            checkpoint_id: Checkpoint UUID
            reviewed_by_user_id: User ID who rejected
            rejection_reason: Reason for rejection

        Returns:
            True if rejection successful

        Side effects:
            - Updates checkpoint status to "rejected"
            - Records reviewer and timestamp
            - Work session should be marked as failed
        """
        checkpoint_id = str(checkpoint_id)

        logger.info(
            f"[CHECKPOINT HANDLER] Rejecting checkpoint {checkpoint_id}: "
            f"{rejection_reason}"
        )

        update_data = {
            "status": "rejected",
            "reviewed_by_user_id": reviewed_by_user_id,
            "reviewed_at": datetime.utcnow().isoformat(),
            "metadata": {
                "rejection_reason": rejection_reason,
                "rejected_at": datetime.utcnow().isoformat()
            }
        }

        response = self.supabase.table("work_checkpoints").update(
            update_data
        ).eq("id", checkpoint_id).execute()

        success = bool(response.data)

        if success:
            logger.info(f"[CHECKPOINT HANDLER] ✅ Checkpoint {checkpoint_id} rejected")

            # Also mark work session as failed
            checkpoint = response.data[0]
            await self._fail_work_ticket(
                checkpoint["work_ticket_id"],
                f"Checkpoint rejected: {rejection_reason}"
            )
        else:
            logger.error(f"[CHECKPOINT HANDLER] ❌ Failed to reject checkpoint {checkpoint_id}")

        return success

    async def get_checkpoint(self, checkpoint_id: str | UUID) -> Dict[str, Any]:
        """
        Fetch checkpoint details.

        Args:
            checkpoint_id: Checkpoint UUID

        Returns:
            Checkpoint data dictionary

        Raises:
            Exception: If checkpoint not found
        """
        checkpoint_id = str(checkpoint_id)

        response = self.supabase.table("work_checkpoints").select(
            "id, work_ticket_id, reason, status, "
            "reviewed_by_user_id, reviewed_at, metadata, created_at"
        ).eq("id", checkpoint_id).single().execute()

        if not response.data:
            raise Exception(f"Checkpoint {checkpoint_id} not found")

        return response.data

    async def list_session_checkpoints(
        self,
        work_ticket_id: str | UUID
    ) -> List[Dict[str, Any]]:
        """
        List all checkpoints for a work session.

        Args:
            work_ticket_id: Work session UUID

        Returns:
            List of checkpoint dictionaries, ordered by creation time
        """
        work_ticket_id = str(work_ticket_id)

        response = self.supabase.table("work_checkpoints").select(
            "id, reason, status, reviewed_by_user_id, reviewed_at, metadata, created_at"
        ).eq("work_ticket_id", work_ticket_id).order(
            "created_at", desc=False
        ).execute()

        return response.data or []

    async def _fail_work_ticket(self, work_ticket_id: str, error_message: str):
        """Mark work session as failed due to checkpoint rejection."""
        self.supabase.table("work_tickets").update({
            "status": "failed",
            "metadata": {
                "error": error_message,
                "failed_at": datetime.utcnow().isoformat(),
                "failure_reason": "checkpoint_rejected"
            }
        }).eq("id", work_ticket_id).execute()

        logger.info(
            f"[CHECKPOINT HANDLER] Work session {work_ticket_id} failed "
            f"due to checkpoint rejection"
        )
