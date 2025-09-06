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
    type: str  # 'block' | 'context_item' | 'update_block' | 'update_context_item' | 'merge_context_items'
    content: Optional[str] = None
    semantic_type: Optional[str] = None
    canonical_value: Optional[str] = None
    label: Optional[str] = None
    kind: Optional[str] = None
    synonyms: List[str] = []
    confidence: float = 0.7
    target_id: Optional[str] = None  # For update/merge operations


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
            candidates = await self._extract_candidates(dump, basket_id)
            
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
    
    async def _extract_candidates(self, dump: Dict[str, Any], basket_id: UUID) -> List[SubstrateCandidate]:
        """Extract substrate evolution candidates by analyzing new dump against existing substrate."""
        candidates = []
        
        # Get actual content from dump (fix: read body_md field properly)
        text_content = dump.get('body_md', '') or dump.get('text_dump', '')
        
        if not text_content or len(text_content.strip()) < 10:
            self.logger.info("No meaningful content in dump to process")
            return candidates
        
        # CRITICAL: Read existing substrate in this basket for evolution decisions
        existing_substrate = await self._load_existing_substrate(basket_id)
        
        self.logger.info(f"Analyzing new content against {len(existing_substrate['blocks'])} existing blocks, {len(existing_substrate['context_items'])} existing context items")
        
        # Extract concepts from new content
        extracted_concepts = self._extract_concepts_from_content(text_content)
        
        # Make evolution decisions: Create vs Update vs Merge
        for concept in extracted_concepts:
            evolution_decision = self._decide_evolution_action(concept, existing_substrate)
            candidates.append(evolution_decision)
            
        self.logger.info(f"Generated {len(candidates)} substrate evolution candidates")
        return candidates
    
    async def _load_existing_substrate(self, basket_id: UUID) -> Dict[str, List]:
        """Load existing substrate in basket for evolution analysis."""
        try:
            # Load existing blocks
            blocks_response = supabase.table("blocks").select(
                "id, content, body_md, semantic_type, confidence_score, normalized_label"
            ).eq("basket_id", str(basket_id)).execute()
            
            # Load existing context items  
            items_response = supabase.table("context_items").select(
                "id, normalized_label, type, confidence_score, metadata"
            ).eq("basket_id", str(basket_id)).execute()
            
            return {
                'blocks': blocks_response.data or [],
                'context_items': items_response.data or []
            }
            
        except Exception as e:
            self.logger.error(f"Failed to load existing substrate: {e}")
            return {'blocks': [], 'context_items': []}
    
    def _extract_concepts_from_content(self, content: str) -> List[Dict]:
        """Extract meaningful concepts from new content using actual analysis."""
        concepts = []
        
        # Split content into meaningful chunks for blocks
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip() and len(p.strip()) > 50]
        
        for para in paragraphs:
            concepts.append({
                'type': 'block_concept',
                'content': para,
                'semantic_type': self._classify_semantic_type(para),
                'confidence': 0.8
            })
        
        # Extract entities/concepts for context items
        import re
        # Find capitalized phrases (potential entities)
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
        
        # Find quoted concepts
        quoted = re.findall(r'"([^"]+)"', content) + re.findall(r"'([^']+)'", content)
        
        # Find project/product names (common patterns)
        projects = re.findall(r'\b(?:Project|Product|Initiative)\s+([A-Z][a-zA-Z\s]+)', content)
        
        for entity in set(entities + quoted + projects):
            if 3 < len(entity) < 50 and not entity.lower() in ['the', 'and', 'or', 'but', 'with']:
                concepts.append({
                    'type': 'context_item_concept', 
                    'label': entity.strip(),
                    'kind': self._classify_entity_type(entity),
                    'confidence': 0.7
                })
                
        return concepts
    
    def _classify_semantic_type(self, text: str) -> str:
        """Classify the semantic type of content."""
        text_lower = text.lower()
        if any(word in text_lower for word in ['goal', 'objective', 'aim', 'target']):
            return 'goal'
        elif any(word in text_lower for word in ['plan', 'strategy', 'approach', 'method']):
            return 'plan'
        elif any(word in text_lower for word in ['insight', 'observation', 'finding', 'conclusion']):
            return 'insight'
        elif any(word in text_lower for word in ['fact', 'data', 'metric', 'number']):
            return 'fact'
        else:
            return 'note'
    
    def _classify_entity_type(self, entity: str) -> str:
        """Classify the type of an entity."""
        entity_lower = entity.lower()
        if any(word in entity_lower for word in ['project', 'initiative', 'program']):
            return 'project'
        elif entity.istitle() and len(entity.split()) <= 2:  # "John Smith", "Alice"
            return 'person'  
        elif any(word in entity_lower for word in ['team', 'department', 'group']):
            return 'organization'
        elif any(word in entity_lower for word in ['goal', 'objective', 'target']):
            return 'goal'
        else:
            return 'concept'
    
    def _decide_evolution_action(self, concept: Dict, existing_substrate: Dict) -> 'SubstrateCandidate':
        """Decide whether to Create, Update, or Merge based on existing substrate."""
        
        if concept['type'] == 'block_concept':
            # Check for similar existing blocks
            similar_block = self._find_similar_block(concept['content'], existing_substrate['blocks'])
            
            if similar_block and self._should_update_block(concept, similar_block):
                return SubstrateCandidate(
                    type='update_block',
                    content=concept['content'],
                    semantic_type=concept['semantic_type'],
                    confidence=concept['confidence'],
                    target_id=similar_block['id']
                )
            else:
                return SubstrateCandidate(
                    type='block',
                    content=concept['content'], 
                    semantic_type=concept['semantic_type'],
                    confidence=concept['confidence']
                )
                
        elif concept['type'] == 'context_item_concept':
            # Check for similar existing context items
            similar_item = self._find_similar_context_item(concept['label'], existing_substrate['context_items'])
            
            if similar_item:
                # Decide merge vs update
                if self._should_merge_items(concept, similar_item):
                    return SubstrateCandidate(
                        type='merge_context_items',
                        label=concept['label'],
                        confidence=concept['confidence'],
                        target_id=similar_item['id']
                    )
                else:
                    return SubstrateCandidate(
                        type='update_context_item',
                        label=concept['label'],
                        kind=concept['kind'],
                        confidence=concept['confidence'],
                        target_id=similar_item['id']
                    )
            else:
                return SubstrateCandidate(
                    type='context_item',
                    label=concept['label'],
                    kind=concept['kind'],
                    confidence=concept['confidence']
                )
    
    def _find_similar_block(self, content: str, existing_blocks: List) -> Dict:
        """Find existing block with similar content."""
        content_words = set(content.lower().split())
        
        for block in existing_blocks:
            block_content = block.get('content', '') or block.get('body_md', '')
            if not block_content:
                continue
                
            block_words = set(block_content.lower().split())
            overlap = len(content_words.intersection(block_words))
            total_words = len(content_words.union(block_words))
            
            # If >60% word overlap, consider similar
            if total_words > 0 and overlap / total_words > 0.6:
                return block
                
        return None
    
    def _should_update_block(self, concept: Dict, existing_block: Dict) -> bool:
        """Decide if block should be updated vs creating new."""
        # Update if new content is significantly longer or higher confidence
        new_length = len(concept['content'])
        existing_length = len(existing_block.get('content', '') or existing_block.get('body_md', ''))
        existing_confidence = existing_block.get('confidence_score', 0.5)
        
        return new_length > existing_length * 1.5 or concept['confidence'] > existing_confidence + 0.2
    
    def _find_similar_context_item(self, label: str, existing_items: List) -> Dict:
        """Find existing context item with similar label."""
        label_lower = label.lower()
        
        for item in existing_items:
            existing_label = (item.get('normalized_label', '') or '').lower()
            
            # Check exact match
            if existing_label == label_lower:
                return item
                
            # Check if one is substring of other
            if label_lower in existing_label or existing_label in label_lower:
                return item
                
            # Check synonyms in metadata
            metadata = item.get('metadata', {})
            synonyms = metadata.get('synonyms', [])
            if any(syn.lower() == label_lower for syn in synonyms):
                return item
                
        return None
    
    def _should_merge_items(self, concept: Dict, existing_item: Dict) -> bool:
        """Decide if items should be merged vs updated."""
        # Merge if they're the same type and very similar labels
        concept_label = concept['label'].lower()
        existing_label = (existing_item.get('normalized_label', '') or '').lower()
        
        # If labels are very similar, merge
        return concept_label == existing_label or concept_label in existing_label or existing_label in concept_label
    
    def _candidates_to_operations(self, candidates: List[SubstrateCandidate]) -> List[ProposalOperation]:
        """Convert substrate evolution candidates to proposal operations."""
        operations = []
        
        for candidate in candidates:
            # Creation operations
            if candidate.type == 'block':
                operations.append(ProposalOperation(
                    type='CreateBlock',
                    data={
                        'content': candidate.content,
                        'semantic_type': candidate.semantic_type,
                        'confidence': candidate.confidence
                    }
                ))
            elif candidate.type == 'context_item':
                operations.append(ProposalOperation(
                    type='CreateContextItem',
                    data={
                        'label': candidate.label,
                        'kind': getattr(candidate, 'kind', 'concept'),
                        'synonyms': candidate.synonyms,
                        'confidence': candidate.confidence
                    }
                ))
            
            # Evolution operations
            elif candidate.type == 'update_block':
                operations.append(ProposalOperation(
                    type='ReviseBlock',
                    data={
                        'block_id': getattr(candidate, 'target_id', None),
                        'content': candidate.content,
                        'confidence': candidate.confidence
                    }
                ))
            elif candidate.type == 'update_context_item':
                operations.append(ProposalOperation(
                    type='UpdateContextItem',
                    data={
                        'context_item_id': getattr(candidate, 'target_id', None),
                        'label': candidate.label,
                        'kind': getattr(candidate, 'kind', None),
                        'confidence': candidate.confidence
                    }
                ))
            elif candidate.type == 'merge_context_items':
                operations.append(ProposalOperation(
                    type='MergeContextItems',
                    data={
                        'from_ids': [getattr(candidate, 'target_id', None)],
                        'canonical_id': getattr(candidate, 'target_id', None),
                        'merged_synonyms': getattr(candidate, 'synonyms', [])
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
        
        # Determine auto-approval eligibility based on canon
        confidence = validation_report.confidence if hasattr(validation_report, 'confidence') else 0.5
        auto_approve = (confidence > 0.7 and 
                       hasattr(validation_report, 'warnings') and 
                       len(validation_report.warnings) == 0)
        
        initial_status = 'APPROVED' if auto_approve else 'PROPOSED'
        
        # Create proposal - split insert and select for Supabase client compatibility
        proposal_data = {
            'basket_id': str(basket_id),
            'workspace_id': str(workspace_id),
            'proposal_kind': 'Extraction',
            'origin': 'agent',
            'provenance': [str(p) for p in provenance],
            'ops': ops_data,
            'validator_report': validation_report.dict(),
            'status': initial_status,
            'blast_radius': 'Local'  # Default for agent extractions
        }
        
        # Add auto-approval metadata if applicable
        if auto_approve:
            proposal_data.update({
                'reviewed_by': None,  # System auto-approval
                'reviewed_at': datetime.utcnow().isoformat(),
                'review_notes': f'Auto-approved: Agent confidence {confidence} > 0.7, no warnings'
            })
        
        insert_response = supabase.table("proposals").insert(proposal_data).execute()
        
        if not insert_response.data:
            raise ValueError("Failed to create governance proposal")
        
        # Get the inserted proposal with all fields
        inserted_id = insert_response.data[0]["id"]
        proposal_response = supabase.table("proposals").select("*").eq("id", inserted_id).single().execute()
        
        if not proposal_response.data:
            raise ValueError("Failed to retrieve created governance proposal")
            
        proposal_id = proposal_response.data['id']
        
        # Emit timeline event for submission
        event_type = 'proposal.approved' if auto_approve else 'proposal.submitted'
        supabase.rpc('emit_timeline_event', {
            'p_basket_id': str(basket_id),
            'p_event_type': event_type,
            'p_event_data': {
                'proposal_id': proposal_id,
                'proposal_kind': 'Extraction',
                'origin': 'agent',
                'operations_count': len(operations),
                'auto_approved': auto_approve,
                'confidence': confidence
            },
            'p_workspace_id': str(workspace_id),
            'p_actor_id': None  # Agent-originated
        }).execute()
        
        # Auto-execute approved proposals by calling the approval endpoint
        if auto_approve:
            try:
                self.logger.info(f"Auto-executing high-confidence proposal {proposal_id} (confidence: {confidence})")
                await self._auto_execute_proposal(proposal_id, basket_id, workspace_id)
                
            except Exception as e:
                self.logger.error(f"Auto-execution failed for proposal {proposal_id}: {e}")
                # Don't fail the entire process - proposal is still created and approved
        
        return UUID(proposal_id)
    
    async def _auto_execute_proposal(self, proposal_id: str, basket_id: UUID, workspace_id: UUID):
        """Auto-execute high-confidence proposals by directly applying operations."""
        try:
            # Get the proposal operations
            proposal_response = supabase.table("proposals").select("ops").eq("id", proposal_id).single().execute()
            if not proposal_response.data:
                raise ValueError(f"Cannot retrieve proposal {proposal_id}")
            
            operations = proposal_response.data['ops']
            execution_log = []
            commit_id = uuid4()
            
            # Execute each operation directly (similar to approval route logic)
            for i, op in enumerate(operations):
                try:
                    result = await self._execute_operation(op, basket_id, workspace_id)
                    execution_log.append({
                        'operation_index': i,
                        'operation_type': op.get('type'),
                        'success': True,
                        'result_data': result
                    })
                except Exception as op_error:
                    self.logger.error(f"Auto-execution operation {i} failed: {op_error}")
                    raise  # Stop execution on first failure
            
            # Mark proposal as executed
            supabase.table("proposals").update({
                'is_executed': True,
                'executed_at': datetime.utcnow().isoformat(),
                'execution_log': execution_log,
                'commit_id': str(commit_id)
            }).eq('id', proposal_id).execute()
            
            # Emit substrate committed event
            supabase.rpc('emit_timeline_event', {
                'p_basket_id': str(basket_id),
                'p_event_type': 'substrate.committed',
                'p_event_data': {
                    'proposal_id': proposal_id,
                    'commit_id': str(commit_id),
                    'operations': execution_log,
                    'auto_executed': True
                },
                'p_workspace_id': str(workspace_id),
                'p_actor_id': None  # Agent auto-execution
            }).execute()
            
            self.logger.info(f"Auto-executed proposal {proposal_id} with {len(operations)} operations")
            
        except Exception as e:
            # Mark proposal execution as failed
            supabase.table("proposals").update({
                'status': 'REJECTED',
                'review_notes': f'Auto-execution failed: {str(e)}'
            }).eq('id', proposal_id).execute()
            raise
    
    async def _execute_operation(self, operation: Dict[str, Any], basket_id: UUID, workspace_id: UUID) -> Dict[str, Any]:
        """Execute a single substrate operation."""
        op_type = operation.get('type')
        op_data = operation.get('data', operation)  # Handle both nested and flat structures
        
        if op_type == 'CreateBlock':
            response = supabase.table("blocks").insert({
                'basket_id': str(basket_id),
                'workspace_id': str(workspace_id),
                'content': op_data.get('content'),
                'body_md': op_data.get('content'),
                'semantic_type': op_data.get('semantic_type'),
                'confidence_score': op_data.get('confidence', 0.7),
                'state': 'ACCEPTED'
            }).select().single().execute()
            
            if response.error:
                raise Exception(f"Failed to create block: {response.error.message}")
            return {'created_id': response.data['id'], 'type': 'block'}
            
        elif op_type == 'CreateContextItem':
            response = supabase.table("context_items").insert({
                'basket_id': str(basket_id),
                'workspace_id': str(workspace_id),
                'normalized_label': op_data.get('label'),
                'type': op_data.get('kind', 'concept'),
                'confidence_score': op_data.get('confidence', 0.7),
                'state': 'ACTIVE',
                'metadata': {'synonyms': op_data.get('synonyms', [])}
            }).select().single().execute()
            
            if response.error:
                raise Exception(f"Failed to create context item: {response.error.message}")
            return {'created_id': response.data['id'], 'type': 'context_item'}
            
        elif op_type == 'ReviseBlock':
            response = supabase.table("blocks").update({
                'content': op_data.get('content'),
                'body_md': op_data.get('content'),
                'confidence_score': op_data.get('confidence', 0.7)
            }).eq('id', op_data.get('block_id')).eq('workspace_id', str(workspace_id)).select().single().execute()
            
            if response.error:
                raise Exception(f"Failed to revise block: {response.error.message}")
            return {'updated_id': response.data['id'], 'type': 'revision'}
            
        elif op_type == 'UpdateContextItem':
            update_data = {'updated_at': datetime.utcnow().isoformat()}
            if op_data.get('label'):
                update_data['normalized_label'] = op_data['label']
            if op_data.get('kind'):
                update_data['type'] = op_data['kind']
            if op_data.get('confidence'):
                update_data['confidence_score'] = op_data['confidence']
                
            response = supabase.table("context_items").update(update_data).eq(
                'id', op_data.get('context_item_id')
            ).eq('workspace_id', str(workspace_id)).select().single().execute()
            
            if response.error:
                raise Exception(f"Failed to update context item: {response.error.message}")
            return {'updated_id': response.data['id'], 'type': 'update'}
            
        elif op_type == 'MergeContextItems':
            # Mark source items as merged
            merge_response = supabase.table("context_items").update({
                'state': 'MERGED'
            }).in_('id', op_data.get('from_ids', [])).execute()
            
            if merge_response.error:
                raise Exception(f"Failed to merge context items: {merge_response.error.message}")
            return {'merged_ids': op_data.get('from_ids', []), 'canonical_id': op_data.get('canonical_id'), 'type': 'merge'}
            
        else:
            raise Exception(f"Unsupported operation type: {op_type}")
    
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