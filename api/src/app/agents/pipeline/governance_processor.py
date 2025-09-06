"""
Governance-Aware Dump Processor - YARNNN Canon v2.0 Compliant

Sacred Rule: All substrate mutations flow through governed proposals
Pipeline: P1_SUBSTRATE (Governance Evolution)

This processor extracts substrate candidates from raw_dumps and creates
governance proposals instead of direct substrate writes.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel
import hashlib

from app.utils.supabase_client import supabase_admin_client as supabase
from app.agents.pipeline.validator_agent import P1ValidatorAgent, ProposalOperation, ProposalValidationRequest

logger = logging.getLogger("uvicorn.error")


class SubstrateCandidate(BaseModel):
    """Extracted substrate candidate from dump."""
    type: str  # 'block' | 'context_item'
    content: str
    semantic_type: Optional[str] = None
    canonical_value: Optional[str] = None
    label: Optional[str] = None
    synonyms: List[str] = []
    confidence: float = 0.7


class GovernanceProposal(BaseModel):
    """Generated governance proposal."""
    proposal_kind: str
    operations: List[ProposalOperation]
    confidence: float
    impact_summary: str


class GovernanceDumpProcessor:
    """
    Governance-aware dump processor that creates proposals instead of direct substrate writes.
    
    Replaces legacy direct substrate creation with governance workflow.
    Sacred Rule: All substrate mutations flow through governed proposals.
    """
    
    pipeline = "P1_SUBSTRATE"
    agent_name = "GovernanceDumpProcessor"
    
    def __init__(self):
        self.logger = logger
        self.validator = P1ValidatorAgent()
        
    async def process_batch_dumps(self, dump_ids: List[UUID], basket_id: UUID, workspace_id: UUID) -> Dict[str, Any]:
        """
        Process multiple raw dumps through comprehensive governance review.
        
        Share Updates workflow: multiple dumps → unified proposal → comprehensive review
        
        Flow:
        1. Extract substrate candidates from all dumps with cross-content analysis
        2. Generate single unified proposal with comprehensive operations
        3. Validate unified operations with P1 Validator
        4. Create single governance proposal for all changes
        5. Return proposal ID for comprehensive human review
        """
        try:
            # Get all dump contents
            dump_data = []
            for dump_id in dump_ids:
                dump_response = supabase.table("raw_dumps").select(
                    "id,text_dump,file_url,source_meta"
                ).eq("id", str(dump_id)).single().execute()
                
                if dump_response.data:
                    dump_data.append(dump_response.data)
            
            if not dump_data:
                raise ValueError(f"No valid dumps found in {dump_ids}")
            
            # Extract substrate candidates with comprehensive analysis
            candidates = await self._extract_batch_candidates(dump_data)
            
            if not candidates:
                self.logger.info(f"No substrate candidates found in batch dumps {dump_ids}")
                return {
                    'proposals_created': 0,
                    'status': 'no_candidates', 
                    'message': 'No substrate candidates found in batch dumps'
                }
            
            # Create unified governance proposal
            proposal_id = await self._create_comprehensive_proposal(
                candidates, basket_id, workspace_id, dump_ids
            )
            
            self.logger.info(f"Comprehensive proposal created: {proposal_id} from {len(dump_ids)} dumps")
            
            return {
                'proposals_created': 1,
                'proposal_ids': [proposal_id],
                'batch_mode': True,
                'source_dumps': len(dump_ids),
                'status': 'comprehensive_proposal_created'
            }
            
        except Exception as e:
            self.logger.error(f"Batch governance processing failed for dumps {dump_ids}: {e}")
            raise
        
    async def process_dump(self, dump_id: UUID, basket_id: UUID, workspace_id: UUID) -> Dict[str, Any]:
        """
        Process a raw dump by creating governance proposals for substrate creation.
        
        Flow:
        1. Extract substrate candidates from dump
        2. Convert candidates to proposal operations
        3. Validate operations with P1 Validator
        4. Create governance proposal(s)
        5. Return proposal IDs for human review
        """
        try:
            # Get dump content
            dump_response = supabase.table("raw_dumps").select(
                "id,text_dump,file_url,source_meta"
            ).eq("id", str(dump_id)).single().execute()
            
            if not dump_response.data:
                raise ValueError(f"Dump {dump_id} not found")
            
            dump = dump_response.data
            
            # Extract substrate candidates
            candidates = await self._extract_candidates(dump)
            
            if not candidates:
                self.logger.info(f"No substrate candidates found in dump {dump_id}")
                return {
                    'proposals_created': 0,
                    'status': 'no_candidates',
                    'message': 'No substrate candidates found in dump'
                }
            
            # Convert candidates to operations
            operations = self._candidates_to_operations(candidates)
            
            # Create validation request
            validation_request = ProposalValidationRequest(
                basket_id=basket_id,
                workspace_id=workspace_id,
                ops=operations,
                origin='agent',
                provenance=[dump_id]
            )
            
            # Validate with P1 Validator
            validation_report = await self.validator.validate_proposal(validation_request)
            
            # Create governance proposal
            proposal_id = await self._create_governance_proposal(
                basket_id=basket_id,
                workspace_id=workspace_id,
                operations=operations,
                validation_report=validation_report,
                provenance=[dump_id]
            )
            
            # Queue state management handled by canonical queue processor
            logger.info(f"P1 Governance processing completed for dump {dump_id}, proposal {proposal_id}")
            
            return {
                'proposals_created': 1,
                'proposal_id': str(proposal_id),
                'status': 'proposal_created',
                'operations_count': len(operations),
                'confidence': validation_report.confidence
            }
            
        except Exception as e:
            self.logger.error(f"Dump processing failed for {dump_id}: {e}")
            # Queue state management handled by canonical queue processor
            raise
    
    async def _extract_candidates(self, dump: Dict[str, Any]) -> List[SubstrateCandidate]:
        """Extract substrate candidates from dump content."""
        candidates = []
        text_content = dump.get('text_dump', '')
        
        if not text_content or len(text_content.strip()) < 10:
            return candidates
        
        # Simple extraction logic (in production, use LLM)
        # This creates basic blocks and context items for demonstration
        
        # Extract blocks from paragraphs
        paragraphs = [p.strip() for p in text_content.split('\n\n') if p.strip()]
        
        for para in paragraphs:
            if len(para) > 20:  # Minimum viable block
                candidates.append(SubstrateCandidate(
                    type='block',
                    content=para,
                    semantic_type='note',
                    confidence=0.6
                ))
        
        # Extract context items from capitalized phrases
        import re
        capitalized_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text_content)
        
        for phrase in set(capitalized_phrases):
            if len(phrase) > 3 and len(phrase) < 50:
                candidates.append(SubstrateCandidate(
                    type='context_item',
                    label=phrase,
                    content=f"Concept extracted from dump: {phrase}",
                    confidence=0.5
                ))
        
        return candidates[:10]  # Limit to prevent overwhelming governance
    
    def _candidates_to_operations(self, candidates: List[SubstrateCandidate]) -> List[ProposalOperation]:
        """Convert substrate candidates to proposal operations."""
        operations = []
        
        for candidate in candidates:
            if candidate.type == 'block':
                operations.append(ProposalOperation(
                    type='CreateBlock',
                    data={
                        'content': candidate.content,
                        'semantic_type': candidate.semantic_type,
                        'canonical_value': candidate.canonical_value,
                        'confidence': candidate.confidence
                    }
                ))
            elif candidate.type == 'context_item':
                operations.append(ProposalOperation(
                    type='CreateContextItem',
                    data={
                        'label': candidate.label,
                        'content': candidate.content,
                        'synonyms': candidate.synonyms,
                        'confidence': candidate.confidence
                    }
                ))
        
        return operations
    
    async def _create_governance_proposal(
        self,
        basket_id: UUID,
        workspace_id: UUID,
        operations: List[ProposalOperation],
        validation_report: Any,
        provenance: List[UUID]
    ) -> UUID:
        """Create governance proposal from validated operations."""
        
        # Convert operations to JSON-serializable format
        ops_data = [op.dict() for op in operations]
        
        # Create proposal - split insert and select for Supabase client compatibility
        insert_response = supabase.table("proposals").insert({
            'basket_id': str(basket_id),
            'workspace_id': str(workspace_id),
            'proposal_kind': 'Extraction',
            'origin': 'agent',
            'provenance': [str(p) for p in provenance],
            'ops': ops_data,
            'validator_report': validation_report.dict(),
            'status': 'PROPOSED',
            'blast_radius': 'Local'  # Default for agent extractions
        }).execute()
        
        if not insert_response.data:
            raise ValueError("Failed to create governance proposal")
        
        # Get the inserted proposal with all fields
        inserted_id = insert_response.data[0]["id"]
        proposal_response = supabase.table("proposals").select("*").eq("id", inserted_id).single().execute()
        
        if not proposal_response.data:
            raise ValueError("Failed to retrieve created governance proposal")
            
        proposal_id = proposal_response.data['id']
        
        # Emit timeline event
        supabase.rpc('emit_timeline_event', {
            'p_basket_id': str(basket_id),
            'p_event_type': 'proposal.submitted',
            'p_event_data': {
                'proposal_id': proposal_id,
                'proposal_kind': 'Extraction',
                'origin': 'agent',
                'operations_count': len(operations)
            },
            'p_workspace_id': str(workspace_id),
            'p_actor_id': None  # Agent-originated
        }).execute()
        
        return UUID(proposal_id)
    
    # Queue state management removed - handled by canonical queue processor
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information."""
        return {
            "name": self.agent_name,
            "pipeline": self.pipeline,
            "type": "processor",
            "status": "active",
            "sacred_rule": "All substrate mutations flow through governed proposals"
        }