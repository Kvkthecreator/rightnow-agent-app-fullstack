"""Unified approval orchestrator for work sessions.

This module implements Layer 3: Unified Governance
Single user review → dual effect (work quality + substrate mutation)
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel
from supabase import Client

from shared.substrate.models.block import Block
from shared.substrate.models.document import Document
from app.work.models import (
    WorkSession,
    WorkArtifact,
    WorkArtifactType,
    WorkArtifactStatus,
    WorkContextMutation,
    WorkMutationType,
    SubstrateType,
    RiskLevel,
)


class ArtifactDecision(str, Enum):
    """Decision for individual artifact."""

    APPLY_TO_SUBSTRATE = "apply_to_substrate"
    SAVE_AS_DRAFT = "save_as_draft"
    REJECT = "reject"


class WorkReviewDecision(BaseModel):
    """User's review decision for work session."""

    work_quality: str  # 'approved' or 'rejected'
    feedback: Optional[str] = None
    artifacts: Dict[UUID, ArtifactDecision]  # per-artifact decisions
    artifact_feedback: Dict[UUID, str] = {}  # optional feedback per artifact


class WorkReviewResult(BaseModel):
    """Result of work review."""

    status: str  # 'approved', 'rejected', or 'partial'
    reason: Optional[str] = None
    artifacts_applied: int
    substrate_mutations: List[UUID]
    rejected_artifacts: List[UUID] = []


class UnifiedApprovalOrchestrator:
    """
    Orchestrates unified approval for work sessions.

    Single user review handles both:
    1. Work quality assessment
    2. Substrate mutation application

    This removes the need for double-approval (work + substrate).
    """

    def __init__(self, db: Client):
        """Initialize orchestrator with database client."""
        self.db = db

    async def review_work_session(
        self,
        work_session_id: UUID,
        user_id: UUID,
        decision: WorkReviewDecision,
    ) -> WorkReviewResult:
        """
        Review work session and apply approved artifacts to substrate.

        Args:
            work_session_id: Work session to review
            user_id: User performing review
            decision: Review decision

        Returns:
            WorkReviewResult with outcome details
        """
        # Fetch session and artifacts
        session = await self._get_work_session(work_session_id)
        artifacts = await self._get_artifacts(work_session_id)

        # Step 1: Work Quality Assessment
        if decision.work_quality != "approved":
            await self._reject_work_session(session, decision.feedback, user_id)
            return WorkReviewResult(
                status="rejected",
                reason=decision.feedback or "Work quality did not meet standards",
                artifacts_applied=0,
                substrate_mutations=[],
                rejected_artifacts=[a.id for a in artifacts],
            )

        # Step 2: Per-Artifact Processing
        applied_artifacts = []
        rejected_artifacts = []
        substrate_mutations = []

        for artifact in artifacts:
            artifact_decision = decision.artifacts.get(
                artifact.id, ArtifactDecision.APPLY_TO_SUBSTRATE
            )

            if artifact_decision == ArtifactDecision.APPLY_TO_SUBSTRATE:
                # Apply to substrate based on artifact type
                substrate_id = await self._apply_artifact_to_substrate(
                    artifact, session, user_id
                )
                if substrate_id:
                    applied_artifacts.append(artifact.id)
                    substrate_mutations.append(substrate_id)

            elif artifact_decision == ArtifactDecision.SAVE_AS_DRAFT:
                # Mark approved but don't apply to substrate
                await self._update_artifact_status(
                    artifact.id,
                    WorkArtifactStatus.APPROVED,
                    user_id,
                    decision.artifact_feedback.get(artifact.id),
                )
                applied_artifacts.append(artifact.id)

            elif artifact_decision == ArtifactDecision.REJECT:
                # Reject artifact
                await self._update_artifact_status(
                    artifact.id,
                    WorkArtifactStatus.REJECTED,
                    user_id,
                    decision.artifact_feedback.get(artifact.id),
                )
                rejected_artifacts.append(artifact.id)

        # Step 3: Update Session Status
        await self._complete_work_session(
            session,
            len(applied_artifacts) > 0,
            user_id,
        )

        # Step 4: Emit Timeline Events
        await self._emit_work_completion_event(
            session, applied_artifacts, substrate_mutations
        )

        return WorkReviewResult(
            status="approved" if len(applied_artifacts) > 0 else "rejected",
            artifacts_applied=len(applied_artifacts),
            substrate_mutations=substrate_mutations,
            rejected_artifacts=rejected_artifacts,
        )

    async def _apply_artifact_to_substrate(
        self,
        artifact: WorkArtifact,
        session: WorkSession,
        user_id: UUID,
    ) -> Optional[UUID]:
        """
        Apply artifact to substrate based on type.

        Returns substrate ID if applied, None otherwise.
        """
        if artifact.artifact_type == WorkArtifactType.BLOCK_PROPOSAL:
            return await self._create_block_from_artifact(artifact, session, user_id)

        elif artifact.artifact_type == WorkArtifactType.BLOCK_UPDATE:
            return await self._supersede_block_from_artifact(artifact, session, user_id)

        elif artifact.artifact_type == WorkArtifactType.DOCUMENT_CREATION:
            return await self._create_document_from_artifact(artifact, session, user_id)

        elif artifact.artifact_type == WorkArtifactType.EXTERNAL_DELIVERABLE:
            # External artifacts don't affect substrate
            await self._store_external_artifact(artifact)
            return None

        return None

    async def _create_block_from_artifact(
        self,
        artifact: WorkArtifact,
        session: WorkSession,
        user_id: UUID,
    ) -> UUID:
        """
        Create block from artifact.

        Work was already reviewed, so block goes directly to ACCEPTED state.
        """
        # Extract block data from artifact content
        block_data = {
            "basket_id": str(session.basket_id),
            "workspace_id": str(session.workspace_id),
            "content": artifact.content.get("content"),
            "semantic_type": artifact.content.get("semantic_type", "general"),
            "state": "ACCEPTED",  # Direct acceptance - work already reviewed
            "scope": artifact.content.get("scope", "BASKET"),
            "version": 1,
            "metadata": {
                "created_from_work_session": str(session.id),
                "created_from_artifact": str(artifact.id),
                "agent_confidence": artifact.agent_confidence,
                "agent_reasoning": artifact.agent_reasoning,
            },
        }

        # Insert block
        result = self.db.table("blocks").insert(block_data).execute()
        block_id = UUID(result.data[0]["id"])

        # Update artifact with block link
        await self._update_artifact(
            artifact.id,
            {
                "becomes_block_id": str(block_id),
                "status": WorkArtifactStatus.APPLIED_TO_SUBSTRATE.value,
                "applied_at": datetime.utcnow().isoformat(),
                "reviewed_by_user_id": str(user_id),
                "reviewed_at": datetime.utcnow().isoformat(),
                "review_decision": "approved",
            },
        )

        # Log substrate mutation
        await self._log_context_mutation(
            work_session_id=session.id,
            artifact_id=artifact.id,
            mutation_type=WorkMutationType.BLOCK_CREATED,
            substrate_id=block_id,
            substrate_type=SubstrateType.BLOCK,
            after_state=block_data,
            risk_level=artifact.risk_level,
        )

        return block_id

    async def _supersede_block_from_artifact(
        self,
        artifact: WorkArtifact,
        session: WorkSession,
        user_id: UUID,
    ) -> UUID:
        """Update/supersede existing block from artifact."""
        parent_block_id = artifact.content.get("supersedes_block_id")

        if not parent_block_id:
            raise ValueError("Block update artifact missing supersedes_block_id")

        # Fetch parent block for before_state
        parent_result = self.db.table("blocks").select("*").eq("id", str(parent_block_id)).execute()
        parent_block = parent_result.data[0] if parent_result.data else None

        # Create new version
        block_data = {
            "basket_id": str(session.basket_id),
            "workspace_id": str(session.workspace_id),
            "parent_block_id": str(parent_block_id),
            "content": artifact.content.get("content"),
            "semantic_type": artifact.content.get("semantic_type"),
            "state": "ACCEPTED",
            "scope": artifact.content.get("scope", parent_block.get("scope")),
            "version": (parent_block.get("version", 0) + 1) if parent_block else 1,
            "metadata": {
                "created_from_work_session": str(session.id),
                "created_from_artifact": str(artifact.id),
                "supersedes": str(parent_block_id),
            },
        }

        result = self.db.table("blocks").insert(block_data).execute()
        new_block_id = UUID(result.data[0]["id"])

        # Mark parent as superseded
        self.db.table("blocks").update({"state": "SUPERSEDED"}).eq("id", str(parent_block_id)).execute()

        # Update artifact
        await self._update_artifact(
            artifact.id,
            {
                "becomes_block_id": str(new_block_id),
                "supersedes_block_id": str(parent_block_id),
                "status": WorkArtifactStatus.APPLIED_TO_SUBSTRATE.value,
                "applied_at": datetime.utcnow().isoformat(),
                "reviewed_by_user_id": str(user_id),
                "reviewed_at": datetime.utcnow().isoformat(),
            },
        )

        # Log mutation
        await self._log_context_mutation(
            work_session_id=session.id,
            artifact_id=artifact.id,
            mutation_type=WorkMutationType.BLOCK_SUPERSEDED,
            substrate_id=new_block_id,
            substrate_type=SubstrateType.BLOCK,
            before_state=parent_block,
            after_state=block_data,
            risk_level=artifact.risk_level or RiskLevel.MEDIUM,
        )

        return new_block_id

    async def _create_document_from_artifact(
        self,
        artifact: WorkArtifact,
        session: WorkSession,
        user_id: UUID,
    ) -> UUID:
        """Create document from artifact."""
        doc_data = {
            "basket_id": str(session.basket_id),
            "workspace_id": str(session.workspace_id),
            "title": artifact.content.get("title", "Untitled"),
            "content_raw": artifact.content.get("content"),
            "doc_type": artifact.content.get("doc_type", "artifact_other"),
            "state": "PUBLISHED",
            "metadata": {
                "created_from_work_session": str(session.id),
                "created_from_artifact": str(artifact.id),
            },
        }

        result = self.db.table("documents").insert(doc_data).execute()
        doc_id = UUID(result.data[0]["id"])

        await self._update_artifact(
            artifact.id,
            {
                "creates_document_id": str(doc_id),
                "status": WorkArtifactStatus.APPLIED_TO_SUBSTRATE.value,
                "applied_at": datetime.utcnow().isoformat(),
                "reviewed_by_user_id": str(user_id),
                "reviewed_at": datetime.utcnow().isoformat(),
            },
        )

        await self._log_context_mutation(
            work_session_id=session.id,
            artifact_id=artifact.id,
            mutation_type=WorkMutationType.DOCUMENT_CREATED,
            substrate_id=doc_id,
            substrate_type=SubstrateType.DOCUMENT,
            after_state=doc_data,
            risk_level=artifact.risk_level or RiskLevel.LOW,
        )

        return doc_id

    async def _store_external_artifact(self, artifact: WorkArtifact) -> None:
        """Store reference to external artifact (no substrate impact)."""
        await self._update_artifact(
            artifact.id,
            {
                "status": WorkArtifactStatus.APPROVED.value,
                "applied_at": datetime.utcnow().isoformat(),
            },
        )

    async def _log_context_mutation(
        self,
        work_session_id: UUID,
        artifact_id: UUID,
        mutation_type: WorkMutationType,
        substrate_id: UUID,
        substrate_type: SubstrateType,
        after_state: Dict[str, Any],
        before_state: Optional[Dict[str, Any]] = None,
        risk_level: Optional[RiskLevel] = None,
    ) -> None:
        """Log substrate mutation to work_context_mutations."""
        mutation_data = {
            "work_session_id": str(work_session_id),
            "artifact_id": str(artifact_id),
            "mutation_type": mutation_type.value,
            "substrate_id": str(substrate_id),
            "substrate_type": substrate_type.value,
            "before_state": before_state,
            "after_state": after_state,
            "mutation_risk": risk_level.value if risk_level else None,
        }
        self.db.table("work_context_mutations").insert(mutation_data).execute()

    async def _update_artifact_status(
        self,
        artifact_id: UUID,
        status: WorkArtifactStatus,
        user_id: UUID,
        feedback: Optional[str] = None,
    ) -> None:
        """Update artifact status."""
        await self._update_artifact(
            artifact_id,
            {
                "status": status.value,
                "reviewed_by_user_id": str(user_id),
                "reviewed_at": datetime.utcnow().isoformat(),
                "review_feedback": feedback,
            },
        )

    async def _update_artifact(self, artifact_id: UUID, updates: Dict[str, Any]) -> None:
        """Update artifact in database."""
        self.db.table("work_artifacts").update(updates).eq("id", str(artifact_id)).execute()

    async def _reject_work_session(
        self, session: WorkSession, reason: Optional[str], user_id: UUID
    ) -> None:
        """Mark work session as rejected."""
        self.db.table("work_sessions").update(
            {
                "status": "rejected",
                "ended_at": datetime.utcnow().isoformat(),
                "metadata": {
                    **(session.metadata or {}),
                    "rejection_reason": reason,
                    "rejected_by": str(user_id),
                    "rejected_at": datetime.utcnow().isoformat(),
                },
            }
        ).eq("id", str(session.id)).execute()

    async def _complete_work_session(
        self, session: WorkSession, approved: bool, user_id: UUID
    ) -> None:
        """Mark work session as complete."""
        self.db.table("work_sessions").update(
            {
                "status": "approved" if approved else "rejected",
                "ended_at": datetime.utcnow().isoformat(),
                "metadata": {
                    **(session.metadata or {}),
                    "approved_by": str(user_id),
                    "approved_at": datetime.utcnow().isoformat(),
                },
            }
        ).eq("id", str(session.id)).execute()

    async def _get_work_session(self, session_id: UUID) -> WorkSession:
        """Fetch work session from database."""
        result = self.db.table("work_sessions").select("*").eq("id", str(session_id)).execute()
        if not result.data:
            raise ValueError(f"Work session {session_id} not found")
        return WorkSession(**result.data[0])

    async def _get_artifacts(self, session_id: UUID) -> List[WorkArtifact]:
        """Fetch all artifacts for work session."""
        result = (
            self.db.table("work_artifacts")
            .select("*")
            .eq("work_session_id", str(session_id))
            .execute()
        )
        return [WorkArtifact(**data) for data in result.data]

    async def _emit_work_completion_event(
        self,
        session: WorkSession,
        artifact_ids: List[UUID],
        substrate_ids: List[UUID],
    ) -> None:
        """Emit timeline event for work completion."""
        event_data = {
            "workspace_id": str(session.workspace_id),
            "basket_id": str(session.basket_id),
            "event_type": "work_session_completed",
            "event_subtype": session.task_type,
            "description": f"Work session completed: {session.task_intent}",
            "metadata": {
                "work_session_id": str(session.id),
                "artifacts_applied": len(artifact_ids),
                "substrate_mutations": len(substrate_ids),
                "agent_id": session.executed_by_agent_id,
            },
        }
        self.db.table("timeline_events").insert(event_data).execute()
