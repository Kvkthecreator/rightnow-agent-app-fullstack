"""
Work Bundle - In-memory context package for specialist agent execution.

This is NOT a database model - it's a transient data structure created during
TP's staging phase and passed to specialist agents for execution.

Purpose: Bundle all necessary context (substrate + assets + config) so agents
don't need to make their own queries.
"""

from typing import Any, Dict, List, Optional


class WorkBundle:
    """
    Complete context bundle for specialist agent execution.

    Created by TP during staging phase (work_orchestration tool).
    Contains everything agent needs - no additional substrate queries required.

    This is an in-memory structure, not persisted to database.
    """

    def __init__(
        self,
        # Work tracking IDs
        work_request_id: str,
        work_ticket_id: str,
        basket_id: str,
        workspace_id: str,
        user_id: str,
        # Task definition
        task: str,
        agent_type: str,
        priority: str = "medium",
        # Pre-loaded context from staging
        substrate_blocks: Optional[List[Dict[str, Any]]] = None,
        reference_assets: Optional[List[Dict[str, Any]]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
        user_requirements: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize work bundle.

        Args:
            work_request_id: Work request UUID
            work_ticket_id: Work ticket UUID
            basket_id: Basket UUID
            workspace_id: Workspace UUID
            user_id: User UUID
            task: Task description from user
            agent_type: "research" | "content" | "reporting"
            priority: "high" | "medium" | "low"
            substrate_blocks: Pre-loaded blocks from substrate (long-term knowledge)
            reference_assets: Pre-loaded assets for agent (task-specific resources)
            agent_config: Agent configuration from database
            user_requirements: Additional requirements from chat collection
        """
        self.work_request_id = work_request_id
        self.work_ticket_id = work_ticket_id
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.user_id = user_id
        self.task = task
        self.agent_type = agent_type
        self.priority = priority
        self.substrate_blocks = substrate_blocks or []
        self.reference_assets = reference_assets or []
        self.agent_config = agent_config or {}
        self.user_requirements = user_requirements or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for JSON serialization."""
        return {
            "work_request_id": self.work_request_id,
            "work_ticket_id": self.work_ticket_id,
            "basket_id": self.basket_id,
            "workspace_id": self.workspace_id,
            "user_id": self.user_id,
            "task": self.task,
            "agent_type": self.agent_type,
            "priority": self.priority,
            "substrate_blocks": self.substrate_blocks,
            "reference_assets": self.reference_assets,
            "agent_config": self.agent_config,
            "user_requirements": self.user_requirements,
        }

    def get_context_summary(self) -> str:
        """Get human-readable summary of bundle context."""
        return f"""Work Bundle Summary:
- Task: {self.task[:100]}...
- Agent: {self.agent_type}
- Substrate Blocks: {len(self.substrate_blocks)}
- Reference Assets: {len(self.reference_assets)}
- Config Keys: {list(self.agent_config.keys())}
"""

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WorkBundle":
        """Create WorkBundle from dict."""
        return cls(
            work_request_id=data["work_request_id"],
            work_ticket_id=data["work_ticket_id"],
            basket_id=data["basket_id"],
            workspace_id=data["workspace_id"],
            user_id=data["user_id"],
            task=data["task"],
            agent_type=data["agent_type"],
            priority=data.get("priority", "medium"),
            substrate_blocks=data.get("substrate_blocks"),
            reference_assets=data.get("reference_assets"),
            agent_config=data.get("agent_config"),
            user_requirements=data.get("user_requirements"),
        )
