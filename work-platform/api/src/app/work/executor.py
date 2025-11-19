"""Work session executor - orchestrates agent execution with lifecycle hooks.

Phase 1: Agent execution with output collection and checkpoints.
- Fetches basket context from substrate
- Creates agent via factory
- Hooks into SDK lifecycle events
- Generates work outputs
- Creates checkpoints for user review
- Updates work session status
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import UUID

from ..deps import get_db
from .models import WorkTicket, WorkTicketStatus
from .substrate_client import SubstrateClient, get_basket_context_for_session

logger = logging.getLogger(__name__)


# ============================================================================
# Artifact & Checkpoint Models
# ============================================================================


class WorkOutputData:
    """Data for creating a work output."""

    def __init__(
        self,
        output_type: str,
        content: Dict[str, Any],
        agent_confidence: Optional[float] = None,
        agent_reasoning: Optional[str] = None,
    ):
        self.output_type = output_type
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


class WorkTicketExecutor:
    """Orchestrates work session execution with agent and lifecycle hooks.

    Phase 1: Simplified execution WITHOUT substrate application.
    - Fetches basket context
    - Executes agent with task
    - Collects outputs (stored as pending)
    - Creates checkpoints for user review
    - Updates session status

    Phase 2+: Will add output→substrate governance bridge.
    """

    def __init__(self, ticket_id: UUID, db=None):
        """Initialize executor for a work session.

        Args:
            ticket_id: Work session UUID
            db: Database connection (from get_db dependency)
        """
        self.ticket_id = ticket_id
        self.db = db
        self.session: Optional[WorkTicket] = None
        self.substrate_client: Optional[SubstrateClient] = None

        # Execution state
        self.outputs: List[WorkOutputData] = []
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

    async def load_session(self) -> WorkTicket:
        """Load work session from database.

        Returns:
            Work session model

        Raises:
            ValueError: If session not found
        """
        query = """
            SELECT * FROM work_tickets
            WHERE id = :ticket_id
        """
        result = await self.db.fetch_one(query, {"ticket_id": str(self.ticket_id)})

        if not result:
            raise ValueError(f"Work session {self.ticket_id} not found")

        self.session = WorkTicket(**dict(result))
        return self.session

    async def update_session_status(
        self,
        status: WorkTicketStatus,
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
            "ticket_id": str(self.ticket_id),
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
            UPDATE work_tickets
            SET {', '.join(update_fields)}
            WHERE id = :ticket_id
            RETURNING *
        """

        result = await self.db.fetch_one(query, values)
        if result:
            self.session = WorkTicket(**dict(result))

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
            f"(session {self.ticket_id})"
        )

        context = await get_basket_context_for_session(
            self.session.basket_id, self.substrate_client
        )

        logger.debug(f"Fetched context: {len(context)} characters")
        return context

    # ========================================================================
    # Artifact & Checkpoint Management
    # ========================================================================

    async def create_output(
        self,
        output_type: str,
        content: Dict[str, Any],
        agent_confidence: Optional[float] = None,
        agent_reasoning: Optional[str] = None,
    ) -> UUID:
        """Create a work output.

        Args:
            output_type: Type of output (research_plan, web_findings, content_draft, etc.)
            content: Artifact content (JSONB)
            agent_confidence: Agent's confidence score (0.0-1.0)
            agent_reasoning: Agent's reasoning for this output

        Returns:
            Created output UUID
        """
        query = """
            INSERT INTO work_outputs (
                work_ticket_id,
                output_type,
                content,
                agent_confidence,
                agent_reasoning,
                status,
                created_at
            )
            VALUES (
                :work_ticket_id,
                :output_type,
                :content,
                :agent_confidence,
                :agent_reasoning,
                'pending',
                NOW()
            )
            RETURNING id
        """

        values = {
            "work_ticket_id": str(self.ticket_id),
            "output_type": output_type,
            "content": content,
            "agent_confidence": agent_confidence,
            "agent_reasoning": agent_reasoning,
        }

        result = await self.db.fetch_one(query, values)
        output_id = UUID(result["id"])

        logger.info(
            f"Created output {output_id} (type: {output_type}) "
            f"for session {self.ticket_id}"
        )

        return output_id

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
                work_ticket_id,
                checkpoint_type,
                status,
                reason,
                metadata,
                created_at
            )
            VALUES (
                :work_ticket_id,
                :checkpoint_type,
                'pending',
                :reason,
                :metadata,
                NOW()
            )
            RETURNING id
        """

        values = {
            "work_ticket_id": str(self.ticket_id),
            "checkpoint_type": checkpoint_type,
            "reason": reason,
            "metadata": metadata or {},
        }

        result = await self.db.fetch_one(query, values)
        checkpoint_id = UUID(result["id"])

        logger.info(
            f"Created checkpoint {checkpoint_id} (type: {checkpoint_type}) "
            f"for session {self.ticket_id}: {reason}"
        )

        return checkpoint_id

    # ========================================================================
    # Agent Execution (Placeholder for Phase 1)
    # ========================================================================

    async def execute(self) -> WorkTicket:
        """Execute work session with agent.

        Phase 1: Simplified execution flow
        1. Load session
        2. Update status to RUNNING
        3. Fetch basket context
        4. Create agent (via factory)
        5. Execute agent with lifecycle hooks
        6. Collect outputs and checkpoints
        7. Update status to PAUSED (if checkpoints) or COMPLETED

        Returns:
            Updated work session

        Raises:
            ValueError: If execution fails
        """
        # Load session
        await self.load_session()

        logger.info(
            f"Starting execution for session {self.ticket_id} "
            f"(project: {self.session.project_id}, task: {self.session.task_type})"
        )

        try:
            # Update to RUNNING
            await self.update_session_status(
                WorkTicketStatus.RUNNING,
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
            # - on_step_end: Capture step outputs as outputs
            # - on_checkpoint_opportunity: Create checkpoint
            # - on_interrupt_signal: Handle user interruption

            # PLACEHOLDER: For Phase 1, create a simple output
            # In real implementation, agent will generate outputs during execution
            await self.create_output(
                output_type="execution_placeholder",
                content={
                    "message": "Phase 1: Agent execution not yet fully implemented",
                    "task_type": self.session.task_type.value,
                    "task_intent": self.session.task_intent,
                    "context_length": len(context),
                },
                agent_confidence=0.0,
                agent_reasoning="Placeholder output for Phase 1 implementation",
            )

            # PLACEHOLDER: Create checkpoint for user review
            checkpoint_id = await self.create_checkpoint(
                checkpoint_type="agent_offered",
                reason="Review execution results before completion",
                metadata={"step": "final_review"},
            )

            # Update status to PAUSED (waiting for checkpoint resolution)
            await self.update_session_status(
                WorkTicketStatus.PAUSED,
                executed_by_agent_id=f"{self.session.task_type.value}_agent",
                metadata={
                    "execution_step": "awaiting_checkpoint_resolution",
                    "checkpoint_id": str(checkpoint_id),
                },
            )

            logger.info(
                f"Session {self.ticket_id} execution paused at checkpoint {checkpoint_id}"
            )

            return self.session

        except Exception as e:
            logger.exception(f"Execution failed for session {self.ticket_id}: {e}")

            # Update status to FAILED
            await self.update_session_status(
                WorkTicketStatus.FAILED,
                ended_at=datetime.utcnow(),
                metadata={"error": str(e), "error_type": type(e).__name__},
            )

            raise ValueError(f"Work session execution failed: {str(e)}") from e


# ============================================================================
# Helper Functions
# ============================================================================


async def start_work_ticket_execution(ticket_id: UUID, db) -> WorkTicket:
    """Start work session execution.

    Convenience function for starting a session execution.

    Args:
        ticket_id: Work session UUID
        db: Database connection

    Returns:
        Updated work session after execution

    Raises:
        ValueError: If execution fails
    """
    async with WorkTicketExecutor(ticket_id, db) as executor:
        return await executor.execute()
