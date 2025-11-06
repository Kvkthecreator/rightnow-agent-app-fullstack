"""Work session executor - orchestrates agent execution with lifecycle hooks.

Phase 1: Agent execution with artifact collection and checkpoints.
- Fetches basket context from substrate
- Creates agent via factory
- Hooks into SDK lifecycle events
- Generates work artifacts
- Creates checkpoints for user review
- Updates work session status
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import UUID

from ..deps import get_db
from .models import WorkSession, WorkSessionStatus
from .substrate_client import SubstrateClient, get_basket_context_for_session

logger = logging.getLogger(__name__)


# ============================================================================
# Artifact & Checkpoint Models
# ============================================================================


class WorkArtifactData:
    """Data for creating a work artifact."""

    def __init__(
        self,
        artifact_type: str,
        content: Dict[str, Any],
        agent_confidence: Optional[float] = None,
        agent_reasoning: Optional[str] = None,
    ):
        self.artifact_type = artifact_type
        self.content = content
        self.agent_confidence = agent_confidence
        self.agent_reasoning = agent_reasoning


class WorkCheckpointData:
    """Data for creating a work checkpoint."""

    def __init__(
        self,
        checkpoint_type: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.checkpoint_type = checkpoint_type
        self.reason = reason
        self.metadata = metadata or {}


# ============================================================================
# Work Session Executor
# ============================================================================


class WorkSessionExecutor:
    """Orchestrates work session execution with agent and lifecycle hooks.

    Phase 1: Simplified execution WITHOUT substrate application.
    - Fetches basket context
    - Executes agent with task
    - Collects artifacts (stored as pending)
    - Creates checkpoints for user review
    - Updates session status

    Phase 2+: Will add artifact→substrate governance bridge.
    """

    def __init__(self, session_id: UUID, db=None):
        """Initialize executor for a work session.

        Args:
            session_id: Work session UUID
            db: Database connection (from get_db dependency)
        """
        self.session_id = session_id
        self.db = db
        self.session: Optional[WorkSession] = None
        self.substrate_client: Optional[SubstrateClient] = None

        # Execution state
        self.artifacts: List[WorkArtifactData] = []
        self.checkpoints: List[WorkCheckpointData] = []
        self.execution_metadata: Dict[str, Any] = {}

    async def __aenter__(self):
        """Async context manager entry."""
        # Initialize substrate client
        self.substrate_client = SubstrateClient()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        # Close substrate client
        if self.substrate_client:
            await self.substrate_client.close()

    # ========================================================================
    # Session Management
    # ========================================================================

    async def load_session(self) -> WorkSession:
        """Load work session from database.

        Returns:
            Work session model

        Raises:
            ValueError: If session not found
        """
        query = """
            SELECT * FROM work_sessions
            WHERE id = :session_id
        """
        result = await self.db.fetch_one(query, {"session_id": str(self.session_id)})

        if not result:
            raise ValueError(f"Work session {self.session_id} not found")

        self.session = WorkSession(**dict(result))
        return self.session

    async def update_session_status(
        self,
        status: WorkSessionStatus,
        executed_by_agent_id: Optional[str] = None,
        started_at: Optional[datetime] = None,
        ended_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Update work session status and metadata.

        Args:
            status: New session status
            executed_by_agent_id: Agent ID that executed the session
            started_at: Execution start time
            ended_at: Execution end time
            metadata: Additional execution metadata
        """
        update_fields = ["status = :status"]
        values = {
            "session_id": str(self.session_id),
            "status": status.value,
        }

        if executed_by_agent_id:
            update_fields.append("executed_by_agent_id = :executed_by_agent_id")
            values["executed_by_agent_id"] = executed_by_agent_id

        if started_at:
            update_fields.append("started_at = :started_at")
            values["started_at"] = started_at

        if ended_at:
            update_fields.append("ended_at = :ended_at")
            values["ended_at"] = ended_at

        if metadata:
            update_fields.append("metadata = :metadata")
            values["metadata"] = metadata

        query = f"""
            UPDATE work_sessions
            SET {', '.join(update_fields)}
            WHERE id = :session_id
            RETURNING *
        """

        result = await self.db.fetch_one(query, values)
        if result:
            self.session = WorkSession(**dict(result))

    # ========================================================================
    # Context Assembly
    # ========================================================================

    async def get_basket_context(self) -> str:
        """Fetch and assemble basket context for agent.

        Returns:
            Formatted context string

        Raises:
            ValueError: If session not loaded or basket context unavailable
        """
        if not self.session:
            raise ValueError("Session not loaded. Call load_session() first.")

        logger.info(
            f"Fetching context for basket {self.session.basket_id} "
            f"(session {self.session_id})"
        )

        context = await get_basket_context_for_session(
            self.session.basket_id, self.substrate_client
        )

        logger.debug(f"Fetched context: {len(context)} characters")
        return context

    # ========================================================================
    # Artifact & Checkpoint Management
    # ========================================================================

    async def create_artifact(
        self,
        artifact_type: str,
        content: Dict[str, Any],
        agent_confidence: Optional[float] = None,
        agent_reasoning: Optional[str] = None,
    ) -> UUID:
        """Create a work artifact.

        Args:
            artifact_type: Type of artifact (research_plan, web_findings, content_draft, etc.)
            content: Artifact content (JSONB)
            agent_confidence: Agent's confidence score (0.0-1.0)
            agent_reasoning: Agent's reasoning for this artifact

        Returns:
            Created artifact UUID
        """
        query = """
            INSERT INTO work_artifacts (
                work_session_id,
                artifact_type,
                content,
                agent_confidence,
                agent_reasoning,
                status,
                created_at
            )
            VALUES (
                :work_session_id,
                :artifact_type,
                :content,
                :agent_confidence,
                :agent_reasoning,
                'pending',
                NOW()
            )
            RETURNING id
        """

        values = {
            "work_session_id": str(self.session_id),
            "artifact_type": artifact_type,
            "content": content,
            "agent_confidence": agent_confidence,
            "agent_reasoning": agent_reasoning,
        }

        result = await self.db.fetch_one(query, values)
        artifact_id = UUID(result["id"])

        logger.info(
            f"Created artifact {artifact_id} (type: {artifact_type}) "
            f"for session {self.session_id}"
        )

        return artifact_id

    async def create_checkpoint(
        self,
        checkpoint_type: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> UUID:
        """Create a work checkpoint.

        Args:
            checkpoint_type: Type of checkpoint (agent_offered, user_requested)
            reason: Why this checkpoint was created
            metadata: Additional checkpoint metadata

        Returns:
            Created checkpoint UUID
        """
        query = """
            INSERT INTO work_checkpoints (
                work_session_id,
                checkpoint_type,
                status,
                reason,
                metadata,
                created_at
            )
            VALUES (
                :work_session_id,
                :checkpoint_type,
                'pending',
                :reason,
                :metadata,
                NOW()
            )
            RETURNING id
        """

        values = {
            "work_session_id": str(self.session_id),
            "checkpoint_type": checkpoint_type,
            "reason": reason,
            "metadata": metadata or {},
        }

        result = await self.db.fetch_one(query, values)
        checkpoint_id = UUID(result["id"])

        logger.info(
            f"Created checkpoint {checkpoint_id} (type: {checkpoint_type}) "
            f"for session {self.session_id}: {reason}"
        )

        return checkpoint_id

    # ========================================================================
    # Agent Execution (Placeholder for Phase 1)
    # ========================================================================

    async def execute(self) -> WorkSession:
        """Execute work session with agent.

        Phase 1: Simplified execution flow
        1. Load session
        2. Update status to RUNNING
        3. Fetch basket context
        4. Create agent (via factory)
        5. Execute agent with lifecycle hooks
        6. Collect artifacts and checkpoints
        7. Update status to PAUSED (if checkpoints) or COMPLETED

        Returns:
            Updated work session

        Raises:
            ValueError: If execution fails
        """
        # Load session
        await self.load_session()

        logger.info(
            f"Starting execution for session {self.session_id} "
            f"(project: {self.session.project_id}, task: {self.session.task_type})"
        )

        try:
            # Update to RUNNING
            await self.update_session_status(
                WorkSessionStatus.RUNNING,
                started_at=datetime.utcnow(),
            )

            # Fetch context
            context = await self.get_basket_context()

            # TODO: Create agent via factory based on task_type
            # agent = create_agent_from_task_type(
            #     self.session.task_type,
            #     self.session.basket_id,
            #     self.session.workspace_id
            # )

            # TODO: Execute agent with lifecycle hooks
            # - on_step_start: Log step execution
            # - on_step_end: Capture step outputs as artifacts
            # - on_checkpoint_opportunity: Create checkpoint
            # - on_interrupt_signal: Handle user interruption

            # PLACEHOLDER: For Phase 1, create a simple artifact
            # In real implementation, agent will generate artifacts during execution
            await self.create_artifact(
                artifact_type="execution_placeholder",
                content={
                    "message": "Phase 1: Agent execution not yet fully implemented",
                    "task_type": self.session.task_type.value,
                    "task_intent": self.session.task_intent,
                    "context_length": len(context),
                },
                agent_confidence=0.0,
                agent_reasoning="Placeholder artifact for Phase 1 implementation",
            )

            # PLACEHOLDER: Create checkpoint for user review
            checkpoint_id = await self.create_checkpoint(
                checkpoint_type="agent_offered",
                reason="Review execution results before completion",
                metadata={"step": "final_review"},
            )

            # Update status to PAUSED (waiting for checkpoint resolution)
            await self.update_session_status(
                WorkSessionStatus.PAUSED,
                executed_by_agent_id=f"{self.session.task_type.value}_agent",
                metadata={
                    "execution_step": "awaiting_checkpoint_resolution",
                    "checkpoint_id": str(checkpoint_id),
                },
            )

            logger.info(
                f"Session {self.session_id} execution paused at checkpoint {checkpoint_id}"
            )

            return self.session

        except Exception as e:
            logger.exception(f"Execution failed for session {self.session_id}: {e}")

            # Update status to FAILED
            await self.update_session_status(
                WorkSessionStatus.FAILED,
                ended_at=datetime.utcnow(),
                metadata={"error": str(e), "error_type": type(e).__name__},
            )

            raise ValueError(f"Work session execution failed: {str(e)}") from e


# ============================================================================
# Helper Functions
# ============================================================================


async def start_work_session_execution(session_id: UUID, db) -> WorkSession:
    """Start work session execution.

    Convenience function for starting a session execution.

    Args:
        session_id: Work session UUID
        db: Database connection

    Returns:
        Updated work session after execution

    Raises:
        ValueError: If execution fails
    """
    async with WorkSessionExecutor(session_id, db) as executor:
        return await executor.execute()
