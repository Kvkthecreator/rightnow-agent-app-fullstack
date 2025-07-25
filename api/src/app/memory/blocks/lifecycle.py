"""Block lifecycle enforcement and state transition validation."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Dict, Set, Optional
from uuid import UUID, uuid4

from fastapi import HTTPException
from pydantic import BaseModel

from ...models.block import block_state
from ...utils.supabase_client import supabase_client as supabase
from ...utils.db import as_json


class StateTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""
    pass


class BlockLifecycleService:
    """Handles block state transitions and lifecycle enforcement."""
    
    # Valid state transitions based on canonical memory model
    VALID_TRANSITIONS: Dict[str, Set[str]] = {
        "PROPOSED": {"ACCEPTED", "REJECTED"},
        "ACCEPTED": {"LOCKED", "SUPERSEDED"},
        "LOCKED": {"CONSTANT", "SUPERSEDED"},
        "CONSTANT": set(),  # Terminal state
        "SUPERSEDED": set(),  # Terminal state  
        "REJECTED": set(),  # Terminal state
    }
    
    # States that can only be set by users (not agents)
    USER_ONLY_STATES = {"ACCEPTED", "LOCKED", "CONSTANT", "REJECTED"}
    
    # States that agents can propose
    AGENT_PROPOSABLE_STATES = {"PROPOSED", "SUPERSEDED"}

    @classmethod
    def validate_transition(
        cls, 
        from_state: str, 
        to_state: str, 
        actor_type: str = "user"
    ) -> None:
        """Validate that a state transition is allowed."""
        if from_state not in cls.VALID_TRANSITIONS:
            raise StateTransitionError(f"Invalid current state: {from_state}")
            
        if to_state not in cls.VALID_TRANSITIONS[from_state]:
            raise StateTransitionError(
                f"Cannot transition from {from_state} to {to_state}. "
                f"Valid transitions: {cls.VALID_TRANSITIONS[from_state]}"
            )
        
        # Enforce user-only state restrictions
        if actor_type == "agent" and to_state in cls.USER_ONLY_STATES:
            raise StateTransitionError(
                f"Agents cannot set state to {to_state}. Only users can accept/lock blocks."
            )

    @classmethod
    def can_modify_content(cls, state: str, actor_type: str = "user") -> bool:
        """Check if content can be modified in the given state."""
        if state in {"LOCKED", "CONSTANT"}:
            return False
        if state == "REJECTED":
            return False
        if actor_type == "agent" and state != "PROPOSED":
            return False
        return True

    @classmethod
    async def transition_block_state(
        cls,
        block_id: UUID,
        new_state: str,
        actor_id: str,
        actor_type: str = "user",
        reason: Optional[str] = None
    ) -> Dict:
        """Perform a validated state transition with audit trail."""
        
        # Get current block state
        current_resp = (
            supabase.table("blocks")
            .select("id,state,version,workspace_id")
            .eq("id", str(block_id))
            .maybe_single()
            .execute()
        )
        
        if not current_resp.data:
            raise HTTPException(404, "Block not found")
            
        current_block = current_resp.data
        current_state = current_block["state"]
        
        # Validate transition
        cls.validate_transition(current_state, new_state, actor_type)
        
        # Create revision record
        revision_id = str(uuid4())
        revision_data = {
            "id": revision_id,
            "block_id": str(block_id),
            "workspace_id": current_block["workspace_id"],
            "actor_id": actor_id,
            "summary": f"State transition: {current_state} → {new_state}",
            "diff_json": {
                "state": {"from": current_state, "to": new_state},
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("block_revisions").insert(as_json(revision_data)).execute()
        
        # Update block state and increment version
        update_resp = (
            supabase.table("blocks")
            .update({
                "state": new_state,
                "version": current_block["version"] + 1,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("id", str(block_id))
            .execute()
        )
        
        # Create event
        event_data = {
            "id": str(uuid4()),
            "basket_id": current_block.get("basket_id"),
            "block_id": str(block_id),
            "kind": f"block.state_changed",
            "payload": {
                "from_state": current_state,
                "to_state": new_state,
                "actor_id": actor_id,
                "actor_type": actor_type,
                "revision_id": revision_id
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()
        
        return update_resp.data[0] if update_resp.data else {}


class BlockProposalService:
    """Handles agent block proposals and user approval workflow."""
    
    @classmethod
    async def propose_block(
        cls,
        basket_id: UUID,
        semantic_type: str,
        content: str,
        agent_id: str,
        origin_ref: Optional[UUID] = None,
        scope: Optional[str] = None
    ) -> Dict:
        """Create a new block in PROPOSED state from agent."""
        
        block_id = uuid4()
        block_data = {
            "id": str(block_id),
            "basket_id": str(basket_id),
            "semantic_type": semantic_type,
            "content": content,
            "version": 1,
            "state": "PROPOSED",
            "scope": scope,
            "origin_ref": str(origin_ref) if origin_ref else None,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Get workspace_id from basket
        basket_resp = (
            supabase.table("baskets")
            .select("workspace_id")
            .eq("id", str(basket_id))
            .maybe_single()
            .execute()
        )
        
        if basket_resp.data:
            block_data["workspace_id"] = basket_resp.data["workspace_id"]
        
        # Insert block
        insert_resp = supabase.table("blocks").insert(as_json(block_data)).execute()
        
        # Create proposal event
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(basket_id),
            "block_id": str(block_id),
            "kind": "block.proposed",
            "payload": {
                "agent_id": agent_id,
                "semantic_type": semantic_type,
                "origin_ref": str(origin_ref) if origin_ref else None
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()
        
        return insert_resp.data[0] if insert_resp.data else block_data

    @classmethod
    async def approve_proposal(
        cls,
        block_id: UUID,
        user_id: str,
        feedback: Optional[str] = None
    ) -> Dict:
        """User approves a proposed block."""
        return await BlockLifecycleService.transition_block_state(
            block_id=block_id,
            new_state="ACCEPTED",
            actor_id=user_id,
            actor_type="user",
            reason=f"User approval: {feedback}" if feedback else "User approval"
        )

    @classmethod
    async def reject_proposal(
        cls,
        block_id: UUID,
        user_id: str,
        reason: Optional[str] = None
    ) -> Dict:
        """User rejects a proposed block."""
        return await BlockLifecycleService.transition_block_state(
            block_id=block_id,
            new_state="REJECTED", 
            actor_id=user_id,
            actor_type="user",
            reason=f"User rejection: {reason}" if reason else "User rejection"
        )


# Request/Response models for API endpoints
class StateTransitionRequest(BaseModel):
    new_state: block_state
    reason: Optional[str] = None

class BlockProposalRequest(BaseModel):
    semantic_type: str
    content: str
    origin_ref: Optional[UUID] = None
    scope: Optional[str] = None

class ProposalActionRequest(BaseModel):
    feedback: Optional[str] = None