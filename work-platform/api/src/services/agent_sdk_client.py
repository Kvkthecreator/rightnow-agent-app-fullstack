"""
Agent SDK Client: Wrapper for Claude Agent SDK with work session context.

This service bridges work sessions with agent execution:
1. Creates agents via factory with substrate adapters
2. Provisions context envelopes to agents
3. Executes agents with task-specific configurations
4. Captures outputs and artifacts
5. Handles checkpoint detection

Phase 2: Agent Execution & Checkpoints
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from agents.factory import (
    create_research_agent,
    create_content_agent,
    create_reporting_agent,
)
from clients.substrate_client import SubstrateClient

logger = logging.getLogger(__name__)


class AgentSDKClient:
    """
    Client for executing work sessions via Claude Agent SDK.

    Responsibilities:
    - Agent instantiation with substrate adapters
    - Context envelope provision
    - Task execution orchestration
    - Output capture and artifact creation
    - Checkpoint detection
    """

    def __init__(self, substrate_client: Optional[SubstrateClient] = None):
        """
        Initialize Agent SDK client.

        Args:
            substrate_client: Optional substrate client (creates one if not provided)
        """
        self.substrate_client = substrate_client or SubstrateClient()
        logger.info("[AGENT SDK CLIENT] Initialized")

    def create_agent(
        self,
        agent_type: str,
        basket_id: str | UUID,
        workspace_id: str,
        user_id: str,
    ):
        """
        Create agent instance for work session execution.

        Args:
            agent_type: Type of agent (research, content, reporting)
            basket_id: Basket ID for agent context
            workspace_id: Workspace ID for authorization
            user_id: User ID for governance operations

        Returns:
            Agent instance (ResearchAgent, ContentCreatorAgent, or ReportingAgent)

        Raises:
            ValueError: If agent_type is invalid
            ImportError: If SDK not available
        """
        logger.info(
            f"[AGENT SDK CLIENT] Creating {agent_type} agent for basket {basket_id}"
        )

        if agent_type == "research":
            return create_research_agent(
                basket_id=basket_id,
                workspace_id=workspace_id,
                user_id=user_id
            )
        elif agent_type == "content":
            return create_content_agent(
                basket_id=basket_id,
                workspace_id=workspace_id,
                user_id=user_id
            )
        elif agent_type == "reporting":
            return create_reporting_agent(
                basket_id=basket_id,
                workspace_id=workspace_id,
                user_id=user_id
            )
        else:
            raise ValueError(
                f"Unknown agent type: {agent_type}. "
                f"Supported: research, content, reporting"
            )

    async def provision_context_envelope(
        self,
        agent,
        task_document_id: UUID,
        basket_id: UUID
    ) -> Dict[str, Any]:
        """
        Fetch and provision context envelope to agent.

        Args:
            agent: Agent instance
            task_document_id: UUID of P4 context envelope document
            basket_id: Basket ID

        Returns:
            Context envelope dictionary

        Note:
            The agent SDK agents have memory adapters that can query substrate.
            This method fetches the pre-generated context envelope and provides
            it as initial context to the agent.
        """
        logger.info(
            f"[AGENT SDK CLIENT] Provisioning context envelope {task_document_id}"
        )

        try:
            # Fetch context envelope P4 document from substrate
            envelope_doc = await self.substrate_client.get_document(
                basket_id=str(basket_id),
                document_id=str(task_document_id)
            )

            if not envelope_doc:
                logger.warning(
                    f"[AGENT SDK CLIENT] Context envelope {task_document_id} not found. "
                    f"Agent will query substrate directly."
                )
                return {}

            # Extract context from P4 document composition
            context_data = envelope_doc.get("composition", {})

            logger.info(
                f"[AGENT SDK CLIENT] ✅ Context envelope provisioned: "
                f"{len(context_data.get('narrative_sections', []))} sections, "
                f"{len(context_data.get('substrate_references', []))} references"
            )

            return context_data

        except Exception as e:
            logger.error(
                f"[AGENT SDK CLIENT] Failed to fetch context envelope: {e}. "
                f"Agent will query substrate directly."
            )
            return {}

    async def execute_task(
        self,
        agent,
        task_description: str,
        task_configuration: Dict[str, Any],
        context_envelope: Dict[str, Any]
    ) -> Tuple[str, List[Dict[str, Any]], Optional[str]]:
        """
        Execute agent task with configuration and context.

        Args:
            agent: Agent instance (from create_agent)
            task_description: Natural language task description
            task_configuration: Agent-specific configuration dict
            context_envelope: Context envelope from provision_context_envelope

        Returns:
            Tuple of (status, artifacts, checkpoint_reason)
            - status: "completed" | "checkpoint_required" | "failed"
            - artifacts: List of artifact dicts with content, type, metadata
            - checkpoint_reason: Reason for checkpoint (if status=checkpoint_required)

        Example:
            status, artifacts, checkpoint = await client.execute_task(
                agent=research_agent,
                task_description="Research AI agent market trends",
                task_configuration={"research_scope": {...}, "output_preferences": {...}},
                context_envelope={...}
            )
        """
        logger.info(
            f"[AGENT SDK CLIENT] Executing task: {task_description[:100]}..."
        )

        try:
            # Build agent execution context
            execution_context = {
                "task": task_description,
                "configuration": task_configuration,
                "context_envelope": context_envelope,
            }

            # Execute agent (SDK method - this is synchronous in current SDK)
            # NOTE: The Claude Agent SDK archetypes have an .execute() method
            # that returns structured output based on agent type

            # For research agents: Returns research findings
            # For content agents: Returns content variations
            # For reporting agents: Returns formatted reports

            logger.info(f"[AGENT SDK CLIENT] Calling agent.execute()...")

            # Execute agent with context
            # The agent will use its memory adapter to query substrate for additional context
            # and use the context envelope as initial briefing
            result = agent.execute(
                task=task_description,
                context=execution_context
            )

            # Parse agent output into artifacts
            artifacts = self._parse_agent_output(result)

            # Check if checkpoint required (based on agent signals)
            checkpoint_reason = self._detect_checkpoint_need(result, task_configuration)

            if checkpoint_reason:
                status = "checkpoint_required"
                logger.info(
                    f"[AGENT SDK CLIENT] 🔔 Checkpoint required: {checkpoint_reason}"
                )
            else:
                status = "completed"
                logger.info(
                    f"[AGENT SDK CLIENT] ✅ Task completed: {len(artifacts)} artifacts"
                )

            return status, artifacts, checkpoint_reason

        except Exception as e:
            logger.error(f"[AGENT SDK CLIENT] ❌ Task execution failed: {e}", exc_info=True)
            return "failed", [], f"Agent execution error: {str(e)}"

    def _parse_agent_output(self, result: Any) -> List[Dict[str, Any]]:
        """
        Parse agent SDK output into work_artifacts format.

        Args:
            result: Agent execution result (structure depends on agent type)

        Returns:
            List of artifact dictionaries with:
            - artifact_type: "research_findings" | "content_draft" | "report"
            - content: Main output content
            - metadata: Agent-specific metadata
        """
        artifacts = []

        # Handle different agent output formats
        # Research agents return findings with sources
        if hasattr(result, "findings"):
            for idx, finding in enumerate(result.findings):
                artifacts.append({
                    "artifact_type": "research_finding",
                    "content": finding.get("content", ""),
                    "metadata": {
                        "finding_index": idx,
                        "confidence": finding.get("confidence", 0.0),
                        "sources": finding.get("sources", []),
                        "domain": finding.get("domain"),
                    }
                })

        # Content agents return variations/drafts
        elif hasattr(result, "variations"):
            for idx, variation in enumerate(result.variations):
                artifacts.append({
                    "artifact_type": "content_draft",
                    "content": variation.get("text", ""),
                    "metadata": {
                        "variation_index": idx,
                        "platform": variation.get("platform"),
                        "tone": variation.get("tone"),
                        "word_count": len(variation.get("text", "").split()),
                    }
                })

        # Reporting agents return formatted reports
        elif hasattr(result, "report"):
            artifacts.append({
                "artifact_type": "report",
                "content": result.report.get("content", ""),
                "metadata": {
                    "report_type": result.report.get("type"),
                    "sections": result.report.get("sections", []),
                    "charts": result.report.get("charts", []),
                }
            })

        # Generic output fallback
        else:
            artifacts.append({
                "artifact_type": "generic_output",
                "content": str(result),
                "metadata": {"raw_result": True}
            })

        logger.debug(f"[AGENT SDK CLIENT] Parsed {len(artifacts)} artifacts")
        return artifacts

    def _detect_checkpoint_need(
        self,
        result: Any,
        task_configuration: Dict[str, Any]
    ) -> Optional[str]:
        """
        Detect if checkpoint is needed based on agent output and configuration.

        Args:
            result: Agent execution result
            task_configuration: Task configuration with approval_strategy

        Returns:
            Checkpoint reason string if checkpoint needed, None otherwise

        Checkpoint triggers:
        - Low confidence findings (research)
        - Complex multi-step tasks (all)
        - High-impact outputs (content, reporting)
        - Agent explicitly requests review
        """
        # Check if agent flagged need for review
        if hasattr(result, "needs_review") and result.needs_review:
            return result.get("review_reason", "Agent requested human review")

        # Research: Low confidence findings
        if hasattr(result, "findings"):
            low_confidence = [
                f for f in result.findings
                if f.get("confidence", 1.0) < 0.7
            ]
            if low_confidence:
                return f"Found {len(low_confidence)} low-confidence findings requiring review"

        # Content: High-impact or sensitive content
        if hasattr(result, "variations"):
            if any(v.get("requires_review") for v in result.variations):
                return "Content flagged for review (sensitive topics detected)"

        # No checkpoint needed
        return None
