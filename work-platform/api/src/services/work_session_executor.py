"""
Work Session Executor: Orchestrates agent execution lifecycle.

This service manages the full execution flow:
1. Validate work session is ready for execution
2. Create and initialize agent
3. Provision context envelope
4. Execute agent task
5. Handle outputs (artifacts, checkpoints)
6. Update work session status
7. Handle errors and retries

Phase 2: Agent Execution & Checkpoints
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from supabase import create_client
import os

from services.agent_sdk_client import AgentSDKClient
from services.checkpoint_handler import CheckpointHandler
from clients.substrate_client import SubstrateClient

logger = logging.getLogger(__name__)


class WorkSessionExecutionError(Exception):
    """Raised when work session execution fails."""
    pass


class WorkSessionExecutor:
    """
    Orchestrates work session execution via Agent SDK.

    Responsibilities:
    - Status transitions (initialized → in_progress → completed/failed)
    - Agent instantiation and execution
    - Artifact creation and storage
    - Checkpoint handling
    - Error handling and logging
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None
    ):
        """
        Initialize work session executor.

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
        self.agent_client = AgentSDKClient()
        self.checkpoint_handler = CheckpointHandler(
            supabase_url=self.supabase_url,
            supabase_key=self.supabase_key
        )

        logger.info("[WORK SESSION EXECUTOR] Initialized")

    async def execute_work_session(self, session_id: str | UUID) -> Dict[str, Any]:
        """
        Execute a work session end-to-end.

        Args:
            session_id: UUID of work session to execute

        Returns:
            Execution result dictionary with:
            - session_id: UUID
            - status: "completed" | "checkpoint_required" | "failed"
            - artifacts_count: Number of artifacts created
            - checkpoint_id: UUID of checkpoint (if status=checkpoint_required)
            - error: Error message (if status=failed)

        Raises:
            WorkSessionExecutionError: If execution fails critically
        """
        session_id = str(session_id)
        logger.info(f"[WORK SESSION EXECUTOR] Starting execution for session {session_id}")

        try:
            # ================================================================
            # Step 1: Fetch and validate work session
            # ================================================================
            session = await self._fetch_work_session(session_id)

            if session["status"] not in ["initialized", "paused"]:
                raise WorkSessionExecutionError(
                    f"Work session {session_id} is not in executable state. "
                    f"Current status: {session['status']}"
                )

            # ================================================================
            # Step 2: Transition to in_progress
            # ================================================================
            await self._update_session_status(session_id, "in_progress")

            # ================================================================
            # Step 3: Create agent instance
            # ================================================================
            agent = self.agent_client.create_agent(
                agent_type=session["task_type"],
                basket_id=session["basket_id"],
                workspace_id=session["workspace_id"],
                user_id=session["initiated_by_user_id"]
            )

            # ================================================================
            # Step 4: Provision context envelope (if available)
            # ================================================================
            context_envelope = {}
            if session.get("task_document_id"):
                context_envelope = await self.agent_client.provision_context_envelope(
                    agent=agent,
                    task_document_id=UUID(session["task_document_id"]),
                    basket_id=UUID(session["basket_id"])
                )

            # ================================================================
            # Step 5: Execute agent task
            # ================================================================
            status, artifacts, checkpoint_reason = await self.agent_client.execute_task(
                agent=agent,
                task_description=session["task_intent"],
                task_configuration=session.get("task_configuration", {}),
                context_envelope=context_envelope
            )

            # ================================================================
            # Step 6: Handle execution result
            # ================================================================
            if status == "failed":
                await self._handle_execution_failure(session_id, checkpoint_reason)
                return {
                    "session_id": session_id,
                    "status": "failed",
                    "error": checkpoint_reason,
                    "artifacts_count": 0
                }

            # Save artifacts to database
            artifact_ids = await self._save_artifacts(session_id, artifacts)

            # ================================================================
            # Step 7: Handle checkpoints or completion
            # ================================================================
            if status == "checkpoint_required":
                checkpoint_id = await self.checkpoint_handler.create_checkpoint(
                    work_session_id=session_id,
                    reason=checkpoint_reason,
                    artifact_ids=artifact_ids
                )

                await self._update_session_status(
                    session_id,
                    "pending_review",
                    metadata={"checkpoint_id": checkpoint_id}
                )

                logger.info(
                    f"[WORK SESSION EXECUTOR] ✅ Execution paused at checkpoint: "
                    f"session={session_id}, checkpoint={checkpoint_id}"
                )

                return {
                    "session_id": session_id,
                    "status": "checkpoint_required",
                    "artifacts_count": len(artifact_ids),
                    "checkpoint_id": checkpoint_id
                }

            else:  # status == "completed"
                await self._update_session_status(
                    session_id,
                    "completed",
                    metadata={
                        "artifacts_count": len(artifact_ids),
                        "completed_at": datetime.utcnow().isoformat()
                    }
                )

                logger.info(
                    f"[WORK SESSION EXECUTOR] ✅ Execution completed: "
                    f"session={session_id}, artifacts={len(artifact_ids)}"
                )

                return {
                    "session_id": session_id,
                    "status": "completed",
                    "artifacts_count": len(artifact_ids)
                }

        except Exception as e:
            logger.error(
                f"[WORK SESSION EXECUTOR] ❌ Execution failed for session {session_id}: {e}",
                exc_info=True
            )
            await self._handle_execution_failure(session_id, str(e))
            raise WorkSessionExecutionError(f"Execution failed: {str(e)}") from e

    async def _fetch_work_session(self, session_id: str) -> Dict[str, Any]:
        """Fetch work session from database."""
        response = self.supabase.table("work_sessions").select(
            "id, project_id, basket_id, workspace_id, initiated_by_user_id, "
            "task_type, task_intent, task_configuration, task_document_id, "
            "approval_strategy, status, metadata"
        ).eq("id", session_id).single().execute()

        if not response.data:
            raise WorkSessionExecutionError(f"Work session {session_id} not found")

        return response.data

    async def _update_session_status(
        self,
        session_id: str,
        status: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Update work session status and metadata."""
        update_data = {"status": status}

        if metadata:
            # Merge with existing metadata
            current = self.supabase.table("work_sessions").select("metadata").eq(
                "id", session_id
            ).single().execute()

            existing_metadata = current.data.get("metadata", {}) if current.data else {}
            existing_metadata.update(metadata)
            update_data["metadata"] = existing_metadata

        self.supabase.table("work_sessions").update(update_data).eq(
            "id", session_id
        ).execute()

        logger.info(f"[WORK SESSION EXECUTOR] Updated session {session_id}: status={status}")

    async def _save_artifacts(
        self,
        session_id: str,
        artifacts: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Save artifacts to work_artifacts table.

        Args:
            session_id: Work session ID
            artifacts: List of artifact dicts from agent execution

        Returns:
            List of created artifact UUIDs
        """
        if not artifacts:
            return []

        artifact_records = [
            {
                "work_session_id": session_id,
                "artifact_type": artifact["artifact_type"],
                "content": artifact["content"],
                "agent_confidence": artifact.get("metadata", {}).get("confidence"),
                "agent_reasoning": artifact.get("metadata", {}).get("reasoning"),
                "status": "pending"
            }
            for artifact in artifacts
        ]

        response = self.supabase.table("work_artifacts").insert(
            artifact_records
        ).execute()

        artifact_ids = [record["id"] for record in response.data]

        logger.info(
            f"[WORK SESSION EXECUTOR] Saved {len(artifact_ids)} artifacts for session {session_id}"
        )

        return artifact_ids

    async def _handle_execution_failure(self, session_id: str, error_message: str):
        """Handle execution failure by updating status and logging."""
        await self._update_session_status(
            session_id,
            "failed",
            metadata={
                "error": error_message,
                "failed_at": datetime.utcnow().isoformat()
            }
        )

        logger.error(f"[WORK SESSION EXECUTOR] Session {session_id} failed: {error_message}")

    async def resume_from_checkpoint(
        self,
        session_id: str | UUID,
        checkpoint_id: str | UUID,
        user_feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resume execution from a checkpoint after user approval.

        Args:
            session_id: Work session UUID
            checkpoint_id: Checkpoint UUID
            user_feedback: Optional user feedback/instructions

        Returns:
            Execution result (same format as execute_work_session)

        Note:
            This will be implemented after basic execution works.
            For Phase 2, we'll focus on checkpoint creation first.
        """
        # TODO: Implement checkpoint resumption
        # 1. Validate checkpoint is approved
        # 2. Load checkpoint context
        # 3. Resume agent execution with user feedback
        # 4. Continue normal execution flow
        raise NotImplementedError("Checkpoint resumption coming in Phase 2.2")
