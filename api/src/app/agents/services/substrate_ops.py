"""Agent-callable substrate operations for memory manipulation."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from uuid import UUID, uuid4
from enum import Enum

from pydantic import BaseModel, Field

from ...memory.blocks import BlockLifecycleService, BlockProposalService, StateTransitionError
from ...models.context import ContextItemType
from ...utils.supabase_client import supabase_client as supabase
from ...utils.db import as_json

logger = logging.getLogger("uvicorn.error")


class SubstrateOperationType(str, Enum):
    """Types of substrate operations agents can perform."""
    PROPOSE_BLOCK = "propose_block"
    TAG_CONTEXT = "tag_context"
    ANALYZE_MEMORY = "analyze_memory"
    FLAG_INCONSISTENCY = "flag_inconsistency"
    SUGGEST_RELATIONSHIP = "suggest_relationship"
    # Composition intelligence operations
    ANALYZE_COMPOSITION_INTELLIGENCE = "analyze_composition_intelligence"
    ASSESS_COMPOSITION_READINESS = "assess_composition_readiness"
    DISCOVER_RELEVANT_MEMORY = "discover_relevant_memory"
    PROMOTE_CONTEXT_HIERARCHY = "promote_context_hierarchy"


class AgentSubstrateRequest(BaseModel):
    """Generic request for agent substrate operations."""
    operation_type: SubstrateOperationType
    agent_id: str
    agent_type: str = Field(..., pattern="^(orch_|tasks_|infra_).+")
    target_id: Optional[UUID] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    reasoning: Optional[str] = None


class SubstrateOperationResult(BaseModel):
    """Result of a substrate operation."""
    operation_id: UUID
    operation_type: SubstrateOperationType
    success: bool
    result_data: Dict[str, Any]
    error_message: Optional[str] = None
    created_objects: List[Dict[str, Any]] = Field(default_factory=list)
    audit_events: List[str] = Field(default_factory=list)


class AgentMemoryAnalysis(BaseModel):
    """Memory analysis result for agent insights."""
    basket_id: UUID
    total_blocks: int
    blocks_by_state: Dict[str, int]
    context_coverage: float  # Percentage of blocks with context items
    semantic_gaps: List[str]
    consistency_issues: List[Dict[str, Any]]
    recommendations: List[str]


class AgentSubstrateService:
    """Service providing agent-callable substrate operations."""
    
    @classmethod
    async def execute_operation(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> SubstrateOperationResult:
        """Execute a substrate operation on behalf of an agent."""
        
        operation_id = uuid4()
        
        try:
            # Validate agent permissions
            await cls._validate_agent_permissions(request.agent_type, request.operation_type)
            
            # Route to specific operation handler
            if request.operation_type == SubstrateOperationType.PROPOSE_BLOCK:
                result = await cls._handle_propose_block(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.TAG_CONTEXT:
                result = await cls._handle_tag_context(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.ANALYZE_MEMORY:
                result = await cls._handle_analyze_memory(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.FLAG_INCONSISTENCY:
                result = await cls._handle_flag_inconsistency(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.SUGGEST_RELATIONSHIP:
                result = await cls._handle_suggest_relationship(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.ANALYZE_COMPOSITION_INTELLIGENCE:
                result = await cls._handle_analyze_composition_intelligence(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.ASSESS_COMPOSITION_READINESS:
                result = await cls._handle_assess_composition_readiness(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.DISCOVER_RELEVANT_MEMORY:
                result = await cls._handle_discover_relevant_memory(request, workspace_id)
            elif request.operation_type == SubstrateOperationType.PROMOTE_CONTEXT_HIERARCHY:
                result = await cls._handle_promote_context_hierarchy(request, workspace_id)
            else:
                raise ValueError(f"Unsupported operation type: {request.operation_type}")
            
            # Log the operation
            await cls._log_substrate_operation(
                operation_id=operation_id,
                request=request,
                result=result,
                workspace_id=workspace_id
            )
            
            return SubstrateOperationResult(
                operation_id=operation_id,
                operation_type=request.operation_type,
                success=True,
                result_data=result,
                created_objects=result.get("created_objects", []),
                audit_events=result.get("audit_events", [])
            )
            
        except Exception as e:
            logger.exception(f"Substrate operation failed: {e}")
            
            return SubstrateOperationResult(
                operation_id=operation_id,
                operation_type=request.operation_type,
                success=False,
                result_data={},
                error_message=str(e)
            )
    
    @classmethod
    async def _validate_agent_permissions(
        cls,
        agent_type: str,
        operation_type: SubstrateOperationType
    ) -> None:
        """Validate that agent type can perform the requested operation."""
        
        # Define operation permissions by agent category
        permissions = {
            "orch_": {
                SubstrateOperationType.PROPOSE_BLOCK,
                SubstrateOperationType.TAG_CONTEXT,
                SubstrateOperationType.ANALYZE_MEMORY,
                SubstrateOperationType.ANALYZE_COMPOSITION_INTELLIGENCE,
                SubstrateOperationType.ASSESS_COMPOSITION_READINESS,
                SubstrateOperationType.DISCOVER_RELEVANT_MEMORY,
                SubstrateOperationType.PROMOTE_CONTEXT_HIERARCHY
            },
            "tasks_": {
                SubstrateOperationType.ANALYZE_MEMORY,
                SubstrateOperationType.SUGGEST_RELATIONSHIP,
                SubstrateOperationType.ANALYZE_COMPOSITION_INTELLIGENCE,
                SubstrateOperationType.DISCOVER_RELEVANT_MEMORY
            },
            "infra_": {
                SubstrateOperationType.ANALYZE_MEMORY,
                SubstrateOperationType.FLAG_INCONSISTENCY,
                SubstrateOperationType.TAG_CONTEXT,
                SubstrateOperationType.ASSESS_COMPOSITION_READINESS
            }
        }
        
        # Get agent category prefix
        category = None
        for prefix in permissions.keys():
            if agent_type.startswith(prefix):
                category = prefix
                break
        
        if not category:
            raise ValueError(f"Invalid agent type: {agent_type}")
        
        if operation_type not in permissions[category]:
            raise ValueError(f"Agent type '{agent_type}' not permitted to perform '{operation_type}'")
    
    @classmethod
    async def _handle_propose_block(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle block proposal operation."""
        
        params = request.parameters
        required_fields = ["basket_id", "semantic_type", "content"]
        
        for field in required_fields:
            if field not in params:
                raise ValueError(f"Missing required parameter: {field}")
        
        # Use the block proposal service from Chapter 1
        proposed_block = await BlockProposalService.propose_block(
            basket_id=UUID(params["basket_id"]),
            semantic_type=params["semantic_type"],
            content=params["content"],
            agent_id=request.agent_id,
            origin_ref=UUID(params.get("origin_ref")) if params.get("origin_ref") else None,
            scope=params.get("scope")
        )
        
        return {
            "created_objects": [proposed_block],
            "audit_events": [f"Block proposed by {request.agent_type}"],
            "block_id": proposed_block["id"]
        }
    
    @classmethod
    async def _handle_tag_context(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle context tagging operation."""
        
        from .context_tagger import ContextTaggerService, ContextTagRequest
        
        params = request.parameters
        required_fields = ["target_id", "target_type", "context_type", "content"]
        
        for field in required_fields:
            if field not in params:
                raise ValueError(f"Missing required parameter: {field}")
        
        tag_request = ContextTagRequest(
            target_id=UUID(params["target_id"]),
            target_type=params["target_type"],
            context_type=ContextItemType(params["context_type"]),
            content=params["content"],
            confidence=params.get("confidence", 0.8),
            agent_id=request.agent_id,
            meta_notes=request.reasoning
        )
        
        context_item = await ContextTaggerService.tag_memory_object(tag_request, workspace_id)
        
        return {
            "created_objects": [context_item],
            "audit_events": [f"Context tagged by {request.agent_type}"],
            "context_item_id": context_item["id"]
        }
    
    @classmethod
    async def _handle_analyze_memory(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle memory analysis operation."""
        
        params = request.parameters
        basket_id = UUID(params.get("basket_id")) if params.get("basket_id") else request.target_id
        
        if not basket_id:
            raise ValueError("basket_id required for memory analysis")
        
        analysis = await cls._perform_memory_analysis(basket_id, workspace_id)
        
        return {
            "analysis": analysis.model_dump(),
            "audit_events": [f"Memory analyzed by {request.agent_type}"]
        }
    
    @classmethod
    async def _handle_flag_inconsistency(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle inconsistency flagging operation."""
        
        params = request.parameters
        
        # Create an event to flag the inconsistency
        flag_event = {
            "id": str(uuid4()),
            "basket_id": params.get("basket_id"),
            "block_id": str(request.target_id) if request.target_id else None,
            "kind": "memory.inconsistency_flagged",
            "payload": {
                "agent_id": request.agent_id,
                "agent_type": request.agent_type,
                "inconsistency_type": params.get("inconsistency_type", "unknown"),
                "description": params.get("description", ""),
                "severity": params.get("severity", "medium"),
                "reasoning": request.reasoning,
                "suggested_action": params.get("suggested_action"),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(flag_event)).execute()
        
        return {
            "flag_event_id": flag_event["id"],
            "audit_events": [f"Inconsistency flagged by {request.agent_type}"]
        }
    
    @classmethod
    async def _handle_suggest_relationship(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle relationship suggestion operation."""
        
        params = request.parameters
        
        # Create a suggestion event (not direct creation)
        suggestion_event = {
            "id": str(uuid4()),
            "basket_id": params.get("basket_id"),
            "kind": "memory.relationship_suggested",
            "payload": {
                "agent_id": request.agent_id,
                "agent_type": request.agent_type,
                "source_id": str(request.target_id),
                "target_id": params.get("related_id"),
                "relationship_type": params.get("relationship_type", "related_to"),
                "confidence": params.get("confidence", 0.7),
                "reasoning": request.reasoning,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(suggestion_event)).execute()
        
        return {
            "suggestion_event_id": suggestion_event["id"],
            "audit_events": [f"Relationship suggested by {request.agent_type}"]
        }
    
    @classmethod
    async def _perform_memory_analysis(
        cls,
        basket_id: UUID,
        workspace_id: str
    ) -> AgentMemoryAnalysis:
        """Perform comprehensive memory analysis for a basket."""
        
        # Get all blocks in basket
        blocks_resp = (
            supabase.table("blocks")
            .select("id,state,semantic_type,content")
            .eq("basket_id", str(basket_id))
            .eq("workspace_id", workspace_id)
            .execute()
        )
        
        blocks = blocks_resp.data or []
        
        # Get context items
        context_resp = (
            supabase.table("context_items")
            .select("id,block_id,document_id,type")
            .eq("basket_id", str(basket_id))
            .eq("status", "active")
            .execute()
        )
        
        context_items = context_resp.data or []
        
        # Analyze block states
        blocks_by_state = {}
        for block in blocks:
            state = block.get("state", "UNKNOWN")
            blocks_by_state[state] = blocks_by_state.get(state, 0) + 1
        
        # Calculate context coverage
        blocks_with_context = len(set(
            item.get("block_id") for item in context_items 
            if item.get("block_id")
        ))
        context_coverage = blocks_with_context / len(blocks) if blocks else 0.0
        
        # Identify semantic gaps
        semantic_gaps = []
        semantic_types = set(block.get("semantic_type") for block in blocks)
        expected_types = {"goal", "insight", "constraint", "audience"}
        missing_types = expected_types - semantic_types
        if missing_types:
            semantic_gaps.extend([f"Missing {stype} blocks" for stype in missing_types])
        
        # Check for consistency issues
        consistency_issues = []
        
        # Too many proposed blocks might indicate review backlog
        proposed_count = blocks_by_state.get("PROPOSED", 0)
        if proposed_count > 10:
            consistency_issues.append({
                "type": "review_backlog",
                "description": f"{proposed_count} blocks awaiting review",
                "severity": "medium"
            })
        
        # Low context coverage indicates tagging gaps
        if context_coverage < 0.3:
            consistency_issues.append({
                "type": "low_context_coverage",
                "description": f"Only {context_coverage:.1%} of blocks have context tags",
                "severity": "low"
            })
        
        # Generate recommendations
        recommendations = []
        if semantic_gaps:
            recommendations.append("Consider adding blocks for missing semantic types")
        if consistency_issues:
            recommendations.append("Review flagged consistency issues")
        if context_coverage < 0.5:
            recommendations.append("Increase semantic tagging of blocks")
        
        return AgentMemoryAnalysis(
            basket_id=basket_id,
            total_blocks=len(blocks),
            blocks_by_state=blocks_by_state,
            context_coverage=context_coverage,
            semantic_gaps=semantic_gaps,
            consistency_issues=consistency_issues,
            recommendations=recommendations
        )
    
    @classmethod
    async def _log_substrate_operation(
        cls,
        operation_id: UUID,
        request: AgentSubstrateRequest,
        result: Dict[str, Any],
        workspace_id: str
    ) -> None:
        """Log substrate operation for audit trail."""
        
        event_data = {
            "id": str(uuid4()),
            "basket_id": request.parameters.get("basket_id"),
            "kind": "agent.substrate_operation",
            "payload": {
                "operation_id": str(operation_id),
                "operation_type": request.operation_type.value,
                "agent_id": request.agent_id,
                "agent_type": request.agent_type,
                "target_id": str(request.target_id) if request.target_id else None,
                "parameters": request.parameters,
                "reasoning": request.reasoning,
                "success": "error_message" not in result,
                "created_objects_count": len(result.get("created_objects", [])),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()
    
    # Composition Intelligence Operation Handlers
    
    @classmethod
    async def _handle_analyze_composition_intelligence(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle composition intelligence analysis operation."""
        
        from ...context.services.composition_intelligence import CompositionIntelligenceService
        
        params = request.parameters
        basket_id = UUID(params.get("basket_id")) if params.get("basket_id") else request.target_id
        
        if not basket_id:
            raise ValueError("basket_id required for composition intelligence analysis")
        
        analysis_focus = params.get("analysis_focus", "comprehensive")
        
        report = await CompositionIntelligenceService.analyze_composition_intelligence(
            basket_id=basket_id,
            workspace_id=workspace_id,
            analysis_focus=analysis_focus
        )
        
        return {
            "composition_report": report.model_dump(),
            "audit_events": [f"Composition intelligence analyzed by {request.agent_type}"],
            "readiness_score": report.overall_composition_readiness,
            "opportunities_count": len(report.composition_opportunities)
        }
    
    @classmethod
    async def _handle_assess_composition_readiness(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle composition readiness assessment operation."""
        
        from ...context.services.composition_intelligence import CompositionIntelligenceService
        
        params = request.parameters
        basket_id = UUID(params.get("basket_id")) if params.get("basket_id") else request.target_id
        
        if not basket_id:
            raise ValueError("basket_id required for composition readiness assessment")
        
        assessment = await CompositionIntelligenceService.assess_composition_readiness(
            basket_id=basket_id,
            workspace_id=workspace_id
        )
        
        return {
            "readiness_assessment": assessment.model_dump(),
            "audit_events": [f"Composition readiness assessed by {request.agent_type}"],
            "readiness_score": assessment.readiness_score,
            "improvement_areas": assessment.improvement_areas
        }
    
    @classmethod
    async def _handle_discover_relevant_memory(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle relevant memory discovery operation."""
        
        from ...context.services.context_discovery import ContextDiscoveryService
        
        params = request.parameters
        basket_id = UUID(params.get("basket_id")) if params.get("basket_id") else request.target_id
        
        if not basket_id:
            raise ValueError("basket_id required for memory discovery")
        
        composition_intent = params.get("composition_intent", "general_composition")
        max_results = params.get("max_results", 15)
        
        discovery_result = await ContextDiscoveryService.discover_composition_relevant_memory(
            basket_id=basket_id,
            composition_intent=composition_intent,
            workspace_id=workspace_id,
            max_results=max_results
        )
        
        return {
            "discovery_result": discovery_result.model_dump(),
            "audit_events": [f"Relevant memory discovered by {request.agent_type}"],
            "blocks_found": len(discovery_result.discovered_blocks),
            "average_relevance": discovery_result.average_relevance_score
        }
    
    @classmethod
    async def _handle_promote_context_hierarchy(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle context hierarchy promotion operation."""
        
        from ...context.services.context_hierarchy import ContextHierarchyService
        
        params = request.parameters
        context_id = UUID(params.get("context_id")) if params.get("context_id") else request.target_id
        
        if not context_id:
            raise ValueError("context_id required for hierarchy promotion")
        
        new_level = params.get("new_level")
        if not new_level:
            raise ValueError("new_level required for hierarchy promotion")
        
        reasoning = request.reasoning or f"Promoted by {request.agent_type}"
        
        result = await ContextHierarchyService.promote_context_level(
            context_id=context_id,
            new_level=new_level,
            workspace_id=workspace_id,
            reasoning=reasoning
        )
        
        return {
            "promotion_result": result,
            "audit_events": [f"Context hierarchy promoted by {request.agent_type}"],
            "new_hierarchy_level": result["new_hierarchy_level"],
            "new_composition_weight": result["new_composition_weight"]
        }


# Convenience functions for common agent operations
class AgentMemoryOperations:
    """High-level convenience functions for common agent memory operations."""
    
    @classmethod
    async def quick_propose_block(
        cls,
        basket_id: UUID,
        content: str,
        agent_id: str,
        semantic_type: str = "insight",
        workspace_id: str = None
    ) -> Dict[str, Any]:
        """Quick block proposal for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROPOSE_BLOCK,
            agent_id=agent_id,
            agent_type="orch_generic",  # Default agent type
            parameters={
                "basket_id": str(basket_id),
                "semantic_type": semantic_type,
                "content": content
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_analyze_composition_intelligence(
        cls,
        basket_id: UUID,
        agent_id: str,
        workspace_id: str,
        analysis_focus: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Quick composition intelligence analysis for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.ANALYZE_COMPOSITION_INTELLIGENCE,
            agent_id=agent_id,
            agent_type="orch_intelligence",  # Default agent type
            target_id=basket_id,
            parameters={
                "basket_id": str(basket_id),
                "analysis_focus": analysis_focus
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_assess_composition_readiness(
        cls,
        basket_id: UUID,
        agent_id: str,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Quick composition readiness assessment for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.ASSESS_COMPOSITION_READINESS,
            agent_id=agent_id,
            agent_type="infra_assessor",  # Default agent type
            target_id=basket_id,
            parameters={
                "basket_id": str(basket_id)
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_discover_relevant_memory(
        cls,
        basket_id: UUID,
        composition_intent: str,
        agent_id: str,
        workspace_id: str,
        max_results: int = 15
    ) -> Dict[str, Any]:
        """Quick relevant memory discovery for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.DISCOVER_RELEVANT_MEMORY,
            agent_id=agent_id,
            agent_type="tasks_discoverer",  # Default agent type
            target_id=basket_id,
            parameters={
                "basket_id": str(basket_id),
                "composition_intent": composition_intent,
                "max_results": max_results
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_promote_context_hierarchy(
        cls,
        context_id: UUID,
        new_level: str,
        agent_id: str,
        workspace_id: str,
        reasoning: str = None
    ) -> Dict[str, Any]:
        """Quick context hierarchy promotion for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROMOTE_CONTEXT_HIERARCHY,
            agent_id=agent_id,
            agent_type="orch_hierarchy",  # Default agent type
            target_id=context_id,
            parameters={
                "context_id": str(context_id),
                "new_level": new_level
            },
            reasoning=reasoning or f"Promoted by agent {agent_id}"
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_tag_context(
        cls,
        target_id: UUID,
        target_type: str,
        context_type: str,
        content: str,
        agent_id: str,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Quick context tagging for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.TAG_CONTEXT,
            agent_id=agent_id,
            agent_type="infra_tagger",  # Default agent type
            target_id=target_id,
            parameters={
                "target_id": str(target_id),
                "target_type": target_type,
                "context_type": context_type,
                "content": content,
                "confidence": 0.8
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_analyze_composition_intelligence(
        cls,
        basket_id: UUID,
        agent_id: str,
        workspace_id: str,
        analysis_focus: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Quick composition intelligence analysis for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.ANALYZE_COMPOSITION_INTELLIGENCE,
            agent_id=agent_id,
            agent_type="orch_intelligence",  # Default agent type
            target_id=basket_id,
            parameters={
                "basket_id": str(basket_id),
                "analysis_focus": analysis_focus
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_assess_composition_readiness(
        cls,
        basket_id: UUID,
        agent_id: str,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Quick composition readiness assessment for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.ASSESS_COMPOSITION_READINESS,
            agent_id=agent_id,
            agent_type="infra_assessor",  # Default agent type
            target_id=basket_id,
            parameters={
                "basket_id": str(basket_id)
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_discover_relevant_memory(
        cls,
        basket_id: UUID,
        composition_intent: str,
        agent_id: str,
        workspace_id: str,
        max_results: int = 15
    ) -> Dict[str, Any]:
        """Quick relevant memory discovery for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.DISCOVER_RELEVANT_MEMORY,
            agent_id=agent_id,
            agent_type="tasks_discoverer",  # Default agent type
            target_id=basket_id,
            parameters={
                "basket_id": str(basket_id),
                "composition_intent": composition_intent,
                "max_results": max_results
            }
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)
    
    @classmethod
    async def quick_promote_context_hierarchy(
        cls,
        context_id: UUID,
        new_level: str,
        agent_id: str,
        workspace_id: str,
        reasoning: str = None
    ) -> Dict[str, Any]:
        """Quick context hierarchy promotion for agents."""
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROMOTE_CONTEXT_HIERARCHY,
            agent_id=agent_id,
            agent_type="orch_hierarchy",  # Default agent type
            target_id=context_id,
            parameters={
                "context_id": str(context_id),
                "new_level": new_level
            },
            reasoning=reasoning or f"Promoted by agent {agent_id}"
        )
        
        return await AgentSubstrateService.execute_operation(request, workspace_id)