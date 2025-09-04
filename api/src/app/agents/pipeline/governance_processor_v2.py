"""
Governance Dump Processor v2 - Blocks as Data Ingredients
Integrates P1SubstrateAgentV2 with governance workflow for structured knowledge extraction.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID

from app.agents.pipeline.substrate_agent_v2 import P1SubstrateAgentV2
from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")


class GovernanceDumpProcessorV2:
    """
    Governance processor using P1SubstrateAgentV2 for structured knowledge extraction.
    
    Creates governance proposals with structured knowledge ingredients instead of text chunks.
    """
    
    def __init__(self):
        self.logger = logger
        try:
            self.p1_agent = P1SubstrateAgentV2()
        except RuntimeError as e:
            self.logger.error(f"Failed to initialize P1SubstrateAgentV2: {e}")
            # Fall back to None - governance processor will handle gracefully
            self.p1_agent = None
        
    async def process_batch_dumps(self, dump_ids: List[UUID], basket_id: UUID, workspace_id: UUID) -> Dict[str, Any]:
        """
        Process multiple dumps through comprehensive governance review for Share Updates.
        
        Creates unified proposal from cross-content analysis of all provided dumps.
        """
        start_time = datetime.utcnow()
        
        try:
            # Validate P1 agent is available
            if not self.p1_agent:
                raise RuntimeError("P1SubstrateAgentV2 not initialized - likely missing OPENAI_API_KEY")
            
            # Check governance settings for workspace
            governance_enabled = await self._check_governance_enabled(workspace_id)
            
            if not governance_enabled:
                # Direct substrate creation (legacy path) - process first dump only
                return await self._direct_substrate_creation(
                    dump_ids[0], basket_id, workspace_id, 20
                )
            
            # Create comprehensive governance proposal with structured ingredients
            proposals_result = await self._create_batch_ingredient_proposals(
                dump_ids, basket_id, workspace_id, 20
            )
            
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            self.logger.info(
                f"Governance batch processing v2 completed: {len(dump_ids)} dumps, "
                f"proposals={proposals_result['proposals_created']}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return {
                **proposals_result,
                "processing_time_ms": processing_time_ms,
                "batch_mode": True,
                "source_dumps": len(dump_ids)
            }
            
        except Exception as e:
            self.logger.error(f"Governance batch processing v2 failed for dumps {dump_ids}: {e}")
            raise
        
    async def process_dump(
        self, 
        dump_id: UUID, 
        basket_id: UUID, 
        workspace_id: UUID,
        max_blocks: int = 10
    ) -> Dict[str, Any]:
        """
        Process dump through governance with structured knowledge extraction.
        
        Creates governance proposals containing structured data ingredients.
        """
        start_time = datetime.utcnow()
        
        try:
            # Validate P1 agent is available
            if not self.p1_agent:
                raise RuntimeError("P1SubstrateAgentV2 not initialized - likely missing OPENAI_API_KEY")
            
            # Check governance settings for workspace
            governance_enabled = await self._check_governance_enabled(workspace_id)
            
            if not governance_enabled:
                # Direct substrate creation (legacy path)
                return await self._direct_substrate_creation(
                    dump_id, basket_id, workspace_id, max_blocks
                )
            
            # Create governance proposals with structured ingredients
            proposals_result = await self._create_ingredient_proposals(
                dump_id, basket_id, workspace_id, max_blocks
            )
            
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            self.logger.info(
                f"Governance dump processing v2 completed: dump_id={dump_id}, "
                f"proposals={proposals_result['proposals_created']}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return {
                "dump_id": str(dump_id),
                "proposals_created": proposals_result["proposals_created"],
                "proposal_ids": proposals_result["proposal_ids"],
                "processing_time_ms": processing_time_ms,
                "confidence": proposals_result.get("avg_confidence", 0.0),
                "method": "structured_knowledge_governance_v2"
            }
            
        except Exception as e:
            self.logger.error(f"Governance dump processing v2 failed for dump {dump_id}: {e}")
            raise
    
    async def _check_governance_enabled(self, workspace_id: UUID) -> bool:
        """Check if governance is enabled for workspace."""
        try:
            response = supabase.table("workspace_governance_settings").select(
                "governance_enabled"
            ).eq("workspace_id", str(workspace_id)).single().execute()
            
            if response.data:
                return response.data.get("governance_enabled", False)
            else:
                # Default to governance enabled for new workspaces
                return True
                
        except Exception as e:
            self.logger.warning(f"Failed to check governance settings: {e}")
            return True  # Fail safe to governance
    
    async def _create_ingredient_proposals(
        self,
        dump_id: UUID,
        basket_id: UUID, 
        workspace_id: UUID,
        max_blocks: int
    ) -> Dict[str, Any]:
        """
        Create governance proposals containing structured knowledge ingredients.
        """
        try:
            # Use P1 Agent v2 to extract structured ingredients
            substrate_result = await self.p1_agent.create_substrate({
                "dump_id": dump_id,
                "workspace_id": workspace_id,
                "basket_id": basket_id,
                "max_blocks": max_blocks,
                "agent_id": "governance_processor_v2"
            })
            
            # Convert substrate results into governance proposals
            proposals = []
            proposal_ids = []
            
            # Create proposals for each block ingredient
            for block_data in substrate_result["blocks_created"]:
                proposal_data = {
                    "basket_id": str(basket_id),
                    "workspace_id": str(workspace_id),
                    "proposal_kind": "Extraction",
                    "origin": "agent",
                    "provenance": [{"dump_id": str(dump_id), "method": "structured_extraction_v2"}],
                    "ops": [{
                        "type": "CreateBlock",
                        "data": {
                            "title": block_data["title"],
                            "semantic_type": block_data["semantic_type"],
                            "metadata": block_data["metadata"],
                            "confidence": block_data["confidence_score"]
                        }
                    }],
                    "blast_radius": "Local",
                    "validator_report": {
                        "confidence": block_data["confidence_score"],
                        "method": "structured_knowledge_extraction",
                        "ingredients_count": len(block_data["metadata"].get("knowledge_ingredients", {}).get("entities", [])),
                        "extraction_quality": "high" if block_data["confidence_score"] > 0.7 else "medium"
                    },
                    "status": "PROPOSED"
                }
                
                # Insert proposal
                response = supabase.table("proposals").insert(proposal_data).select().execute()
                if response.data:
                    proposals.extend(response.data)
                    proposal_ids.extend([p["id"] for p in response.data])
            
            return {
                "proposals_created": len(proposals),
                "proposal_ids": proposal_ids,
                "avg_confidence": substrate_result.get("agent_confidence", 0.0)
            }
            
        except Exception as e:
            self.logger.error(f"Failed to create ingredient proposals: {e}")
            return {
                "proposals_created": 0,
                "proposal_ids": [],
                "avg_confidence": 0.0
            }
    
    async def _create_batch_ingredient_proposals(
        self,
        dump_ids: List[UUID], 
        basket_id: UUID, 
        workspace_id: UUID, 
        max_blocks: int
    ) -> Dict[str, Any]:
        """Create unified governance proposal from comprehensive batch analysis."""
        
        try:
            # Use P1 Agent v2 batch mode for comprehensive analysis
            agent_request = {
                "dump_ids": [str(did) for did in dump_ids],
                "workspace_id": str(workspace_id),
                "basket_id": str(basket_id),
                "agent_id": f"governance_v2_batch_{uuid4().hex[:8]}",
                "max_blocks": max_blocks
            }
            
            substrate_result = await self.p1_agent.create_substrate(agent_request)
            blocks_created = substrate_result.get("blocks_created", [])
            
            if not blocks_created:
                return {
                    "proposals_created": 0,
                    "status": "no_substrate_from_batch",
                    "message": f"No structured ingredients extracted from {len(dump_ids)} dumps"
                }
            
            # Create single unified proposal
            proposal_id = await self._create_unified_governance_proposal(
                basket_id, workspace_id, blocks_created, dump_ids
            )
            
            return {
                "proposals_created": 1,
                "proposal_ids": [str(proposal_id)],
                "substrate_candidates": len(blocks_created),
                "comprehensive_analysis": True,
                "source_dumps": len(dump_ids)
            }
            
        except Exception as e:
            self.logger.error(f"Failed to create batch ingredient proposals: {e}")
            return {
                "proposals_created": 0,
                "proposal_ids": [],
                "comprehensive_analysis": False
            }
    
    async def _direct_substrate_creation(
        self,
        dump_id: UUID,
        basket_id: UUID,
        workspace_id: UUID,
        max_blocks: int
    ) -> Dict[str, Any]:
        """
        Direct substrate creation when governance is disabled.
        Uses v2 agent but bypasses proposal workflow.
        """
        try:
            # Use P1 Agent v2 directly
            result = await self.p1_agent.create_substrate({
                "dump_id": dump_id,
                "workspace_id": workspace_id,
                "basket_id": basket_id,
                "max_blocks": max_blocks,
                "agent_id": "direct_processor_v2"
            })
            
            return {
                "dump_id": str(dump_id),
                "proposals_created": 0,  # No proposals, direct creation
                "blocks_created": len(result["blocks_created"]),
                "context_items_created": len(result["context_items_created"]),
                "processing_time_ms": result["processing_time_ms"],
                "confidence": result["agent_confidence"],
                "method": "direct_structured_ingredients_v2"
            }
            
        except Exception as e:
            self.logger.error(f"Direct substrate creation v2 failed: {e}")
            raise
    
    async def _create_unified_governance_proposal(
        self,
        basket_id: UUID,
        workspace_id: UUID, 
        blocks_created: List[Dict[str, Any]],
        dump_ids: List[UUID]
    ) -> UUID:
        """Create single unified proposal for comprehensive batch processing."""
        
        # Generate comprehensive summary
        summary_parts = []
        total_goals = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("goals", [])) for block in blocks_created)
        total_constraints = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("constraints", [])) for block in blocks_created)
        total_metrics = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("metrics", [])) for block in blocks_created)
        total_entities = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("entities", [])) for block in blocks_created)
        
        summary_parts.append(f"Comprehensive analysis of {len(dump_ids)} content sources")
        if total_goals > 0:
            summary_parts.append(f"{total_goals} strategic goals identified")
        if total_constraints > 0:
            summary_parts.append(f"{total_constraints} operational constraints") 
        if total_metrics > 0:
            summary_parts.append(f"{total_metrics} measurable success criteria")
        if total_entities > 0:
            summary_parts.append(f"{total_entities} key stakeholders and systems")
            
        ops_summary = "; ".join(summary_parts)
        
        # Create unified proposal data
        proposal_data = {
            "id": str(uuid4()),
            "workspace_id": str(workspace_id),
            "basket_id": str(basket_id),
            "proposal_kind": "create_blocks",
            "origin": "agent",
            "status": "PROPOSED",
            "ops": {
                "operation": "batch_create_blocks",
                "blocks": blocks_created,
                "source_dumps": [str(did) for did in dump_ids],
                "comprehensive_analysis": True,
                "extraction_method": "comprehensive_structured_ingredients",
                "summary": ops_summary
            },
            "metadata": {
                "batch_mode": True,
                "source_dumps": len(dump_ids),
                "comprehensive_review": True,
                "processing_method": "share_updates_batch"
            }
        }
        
        # Insert unified proposal
        response = supabase.table("proposals").insert(proposal_data).select().execute()
        
        if not response.data:
            raise RuntimeError("Failed to create unified governance proposal")
            
        proposal_id = UUID(response.data[0]["id"])
        self.logger.info(f"Created unified proposal {proposal_id} from {len(dump_ids)} dumps")
        
        return proposal_id
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get processor information."""
        return {
            "name": "GovernanceDumpProcessorV2",
            "pipeline": "P1_GOVERNANCE_V2",
            "type": "governance_processor",
            "status": "active",
            "substrate_agent": self.p1_agent.agent_name,
            "extraction_method": "structured_knowledge_ingredients",
            "version": "2.0_data_ingredients"
        }