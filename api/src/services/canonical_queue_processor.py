"""
Canonical Queue Processor - YARNNN Canon v2.1 Compliant

Orchestrates the canonical pipeline agents (P0-P4) in proper sequence
while respecting Sacred Principles and pipeline boundaries.
Integrates with Universal Work Tracker for comprehensive status visibility.

Pipeline Processing Sequence:
1. P0 Capture: Raw dump ingestion only
2. P1 Substrate: Block/context creation only  
3. P2 Graph: Relationship mapping only
4. P3 Reflection: Pattern computation only
(P4 Presentation triggered on-demand, not in queue processing)
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4, UUID

from app.agents.pipeline import (
    P0CaptureAgent,
    P1SubstrateAgent,
    P2GraphAgent,
    P3ReflectionAgent
)
from app.agents.pipeline.composition_agent import P4CompositionAgent, CompositionRequest
from app.agents.pipeline.capture_agent import DumpIngestionRequest
from app.agents.pipeline.improved_substrate_agent import ImprovedP1SubstrateAgent
from app.agents.pipeline.graph_agent import RelationshipMappingRequest
from app.agents.pipeline.reflection_agent import ReflectionComputationRequest
from app.agents.pipeline.governance_processor import GovernanceDumpProcessor
from app.utils.supabase_client import supabase_admin_client as supabase
from contracts.basket import BasketDelta, BasketChangeRequest
from services.clock import now_iso
from services.universal_work_tracker import universal_work_tracker

logger = logging.getLogger("uvicorn.error")


class CanonicalQueueProcessor:
    """
    Canonical queue processor implementing YARNNN Canon v2.1 pipeline boundaries.
    
    This processor orchestrates P0-P3 agents in strict sequence while maintaining
    Sacred Principles and pipeline boundaries. Integrates with Universal Work Tracker
    for comprehensive status visibility across all async operations.
    """
    
    def __init__(self, worker_id: Optional[str] = None, poll_interval: int = 10):
        if not supabase:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY required for canonical queue processing")
        
        self.worker_id = worker_id or f"canonical-worker-{uuid4().hex[:8]}"
        self.poll_interval = poll_interval
        self.running = False
        
        # Initialize canonical pipeline agents
        self.p0_capture = P0CaptureAgent()
        self.p1_governance = GovernanceDumpProcessor()  # Canonical governance with quality extraction
        self.p2_graph = P2GraphAgent()
        self.p3_reflection = P3ReflectionAgent()
        self.p4_composition = P4CompositionAgent()  # Document composition
        
        # Note: Always use improved extraction (no feature flag needed)
        
        logger.info(f"Canonical Queue Processor initialized: {self.worker_id}")
        
    async def start(self):
        """Start the canonical queue processing loop."""
        self.running = True
        logger.info(f"Starting Canonical Queue Processor: {self.worker_id}")
        
        while self.running:
            try:
                # Claim work from queue (handles all work types now)
                queue_entries = await self._claim_work()
                
                if queue_entries:
                    logger.info(f"Claimed {len(queue_entries)} work items for canonical processing")
                    
                    # Process each claimed work item based on work_type
                    for entry in queue_entries:
                        try:
                            work_type = entry.get('work_type', 'P1_SUBSTRATE')  # Default for legacy entries
                            
                            if work_type in ['P0_CAPTURE', 'P1_SUBSTRATE']:
                                # Traditional dump-based processing
                                await self._process_dump_canonically(entry)
                            elif work_type == 'P2_GRAPH':
                                # Graph relationship mapping
                                await self._process_graph_work(entry)
                            elif work_type == 'P4_COMPOSE_NEW':
                                # New document creation from memory
                                await self._process_new_document_composition(entry)
                            elif work_type == 'P4_RECOMPOSE':
                                # Update existing document
                                await self._process_composition_work(entry)
                            else:
                                # Governance-only items like MANUAL_EDIT are not processed here.
                                # Return the entry to pending to be handled by governance/proposal executors.
                                logger.info(f"Skipping non-pipeline work type: {work_type} (queue_id={entry.get('id')})")
                                try:
                                    await self._update_queue_state(entry['id'], 'pending')
                                except Exception:
                                    pass
                                continue
                        except Exception as e:
                            logger.exception(f"Work processing failed for {entry.get('work_id', entry['id'])}: {e}")
                            await self._mark_failed(entry['id'], str(e))
                else:
                    # No work available, wait before next poll
                    await asyncio.sleep(self.poll_interval)
                    
            except Exception as e:
                logger.exception(f"Canonical queue processing error: {e}")
                await asyncio.sleep(self.poll_interval)
    
    async def stop(self):
        """Stop the canonical queue processing loop."""
        self.running = False
        logger.info(f"Stopping Canonical Queue Processor: {self.worker_id}")
    
    async def process_basket_work(self, basket_id: str, work_req, workspace_id: str) -> BasketDelta:
        """Process BasketWorkRequest through canonical pipeline."""
        logger.info(f"Processing basket work request for basket {basket_id} (canonical)")
        
        # For now, return a placeholder delta indicating canonical processing is queued
        # In the future, this could trigger immediate processing or queue the work
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=basket_id,
            summary="Canonical processing queued",
            changes=[],
            recommended_actions=[],
            explanations=[{"by": "canonical_queue_processor", "text": "Work request queued for canonical pipeline processing"}],
            confidence=0.8,
            created_at=now_iso(),
        )
    
    async def process_basket_change(self, basket_id: str, req: BasketChangeRequest, workspace_id: str) -> BasketDelta:
        """Process legacy BasketChangeRequest through canonical pipeline."""
        logger.info(f"Processing basket change request for basket {basket_id} (canonical)")
        
        # For now, return a placeholder delta indicating canonical processing is queued
        # In the future, this could trigger immediate processing or queue the work
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=basket_id,
            summary="Canonical processing queued",
            changes=[],
            recommended_actions=[],
            explanations=[{"by": "canonical_queue_processor", "text": "Change request queued for canonical pipeline processing"}],
            confidence=0.8,
            created_at=now_iso(),
        )
    
    async def _claim_work(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Atomically claim work from the queue (all work types)."""
        try:
            response = supabase.rpc(
                'fn_claim_pipeline_work',
                {
                    'p_worker_id': self.worker_id,
                    'p_limit': limit,
                    'p_stale_after_minutes': 5
                }
            ).execute()
            
            if response.data:
                logger.info(f"Successfully claimed {len(response.data)} work items")
                return response.data
            else:
                return []
            
        except Exception as e:
            logger.error(f"Failed to claim work: {e}")
            return []
    
    async def _process_dump_canonically(self, queue_entry: Dict[str, Any]):
        """
        Process dump through canonical pipeline sequence (P0 → P1 → P2 → P3).
        
        Sacred Principles enforced:
        1. Capture is Sacred: P0 only processes existing dumps
        2. All Substrates are Peers: P1 treats all substrate types equally
        3. Narrative is Deliberate: P4 not triggered in queue processing
        4. Agent Intelligence is Mandatory: All pipeline processing required
        """
        # Normalize IDs: queue entries may already contain UUID objects depending on client/driver
        def _to_uuid(val):
            if isinstance(val, UUID):
                return val
            return UUID(str(val))

        dump_id = _to_uuid(queue_entry['dump_id'])
        basket_id = _to_uuid(queue_entry['basket_id'])
        workspace_id = _to_uuid(queue_entry['workspace_id'])
        queue_id = queue_entry['id']
        
        logger.info(f"Starting canonical processing: dump_id={dump_id}")
        
        try:
            # Mark as processing
            await self._update_queue_state(queue_id, 'processing')
            
            # P0 CAPTURE: Process dump ingestion (already done, but validate)
            # Note: P0 work was done when dump was created, but we validate here
            await self._validate_p0_capture(dump_id, workspace_id)
            logger.info(f"P0 Capture validated for dump {dump_id}")
            
            # P1 GOVERNANCE: Create proposals using comprehensive review or single dump processing
            # Sacred Rule: All substrate mutations flow through governed proposals
            batch_dumps = await self._get_batch_group(dump_id)
            
            # Use canonical governance processor with quality extraction
            if len(batch_dumps) > 1:
                # Comprehensive batch processing for Share Updates
                governance_result = await self.p1_governance.process_batch_dumps(
                    dump_ids=[_to_uuid(did) for did in batch_dumps],
                    basket_id=basket_id,
                    workspace_id=workspace_id
                )
                logger.info(f"Using canonical governance batch mode ({len(batch_dumps)} dumps)")
            else:
                # Single dump quality processing
                governance_result = await self.p1_governance.process_dump(
                    dump_id=dump_id,
                    basket_id=basket_id,
                    workspace_id=workspace_id
                )
                logger.info(f"Using canonical governance (quality extraction) for dump {dump_id}")
            
            logger.info(
                f"P1 Governance completed: {governance_result['proposals_created']} proposals created, "
                f"confidence: {governance_result.get('confidence', 'unknown')}"
            )
            
            # Skip P2/P3 if no proposals were created
            if governance_result['proposals_created'] == 0:
                logger.info("Skipping P2/P3 - no substrate proposals generated")
                await self._update_queue_state(queue_id, 'completed')
                return
            
            # P2/P3 deferred until proposals are approved
            # In governance workflow, substrate doesn't exist until approval
            # P2 Graph and P3 Reflection will run on approved substrate via cascade events
            logger.info("P2/P3 deferred - proposals must be approved before relationship mapping and reflection")
            
            # Mark as completed with work result
            work_result = {
                'proposals_created': governance_result['proposals_created'],
                'confidence': governance_result.get('confidence', 0.0),
                'summary': f"P1 governance completed: {governance_result['proposals_created']} proposals"
            }
            
            # Update universal work tracker if work_id exists
            if queue_entry.get('work_id'):
                await universal_work_tracker.complete_work(
                    queue_entry['work_id'], 
                    work_result,
                    'P1_governance_completed'
                )
            
            await self._update_queue_state(queue_id, 'completed')
            
            logger.info(f"Canonical processing completed successfully for dump {dump_id}")
            
        except Exception as e:
            logger.exception(f"Canonical processing failed for dump {dump_id}: {e}")
            
            # Update universal work tracker for failure
            if queue_entry.get('work_id'):
                await universal_work_tracker.fail_work(
                    queue_entry['work_id'],
                    str(e)
                )
            
            await self._mark_failed(queue_id, str(e))
            raise
    
    async def _process_composition_work(self, queue_entry: Dict[str, Any]):
        """
        Process P4_COMPOSE work for intelligent document composition.
        
        Canon Compliance:
        - P4 consumes substrate, never creates it
        - Implements Sacred Principle #3: Narrative is Deliberate
        - Only creates document artifacts
        """
        work_id = queue_entry.get('work_id', queue_entry['id'])
        queue_id = queue_entry['id']
        work_payload = queue_entry.get('work_payload', {})
        
        logger.info(f"Starting P4 composition work: work_id={work_id}")
        
        try:
            # Mark as processing
            await self._update_queue_state(queue_id, 'processing')
            
            # Extract composition operation data
            operations = work_payload.get('operations', [])
            if not operations:
                raise ValueError("P4 composition work missing operations")
            
            compose_op = next((op for op in operations if op['type'] == 'compose_from_memory'), None)
            if not compose_op:
                raise ValueError("P4 composition work missing compose_from_memory operation")
            
            op_data = compose_op['data']
            
            # Create composition request
            composition_request = CompositionRequest(
                document_id=op_data['document_id'],
                basket_id=work_payload['basket_id'],
                workspace_id=queue_entry['workspace_id'],
                intent=op_data['intent'],
                window=op_data.get('window'),
                pinned_ids=op_data.get('pinned_ids')
            )
            
            # Process through P4 composition agent
            composition_result = await self.p4_composition.process(composition_request)
            
            if not composition_result.success:
                raise RuntimeError(f"P4 composition failed: {composition_result.message}")
            
            logger.info(f"P4 composition completed: {composition_result.message}")
            
            # Prepare work result
            work_result = {
                'composition_completed': True,
                'document_id': composition_request.document_id,
                'substrate_count': composition_result.data.get('substrate_count', 0),
                'confidence': composition_result.data.get('confidence', 0.8),
                'summary': composition_result.data.get('composition_summary', 'Document composed')
            }
            
            # Update universal work tracker if work_id exists
            if queue_entry.get('work_id'):
                await universal_work_tracker.complete_work(
                    queue_entry['work_id'],
                    work_result,
                    'P4_composition_completed'
                )
            
            await self._update_queue_state(queue_id, 'completed')
            
            logger.info(f"P4 composition work completed successfully: {work_id}")
            
        except Exception as e:
            logger.exception(f"P4 composition work failed: {work_id}: {e}")
            
            # Update universal work tracker for failure
            if queue_entry.get('work_id'):
                await universal_work_tracker.fail_work(
                    queue_entry['work_id'],
                    str(e)
                )
            
            await self._mark_failed(queue_id, str(e))
            raise
    
    async def _process_graph_work(self, queue_entry: Dict[str, Any]):
        """
        Process P2_GRAPH work for relationship mapping.
        
        Canon Compliance:
        - P2 creates relationships, never modifies substrate content
        - Implements Sacred Principle #2: All Substrates are Peers (through semantic connections)
        - Only creates substrate_relationships
        """
        work_id = queue_entry.get('work_id', queue_entry['id'])
        queue_id = queue_entry['id']
        work_payload = queue_entry.get('work_payload', {})
        
        logger.info(f"Starting P2 graph work: work_id={work_id}")
        
        try:
            # Mark as processing
            await self._update_queue_state(queue_id, 'processing')
            
            # Extract operation data
            operations = work_payload.get('operations', [])
            if not operations:
                raise ValueError("P2 graph work missing operations")
            
            map_op = next((op for op in operations if op['type'] == 'MapRelationships'), None)
            if not map_op:
                raise ValueError("P2 graph work missing MapRelationships operation")
            
            op_data = map_op['data']
            basket_id = work_payload['basket_id']
            
            # Get all substrate IDs for this basket for relationship analysis
            substrate_ids = []
            
            # Get blocks
            blocks_response = supabase.table("blocks").select("id").eq(
                "basket_id", basket_id
            ).in_("state", ["ACCEPTED", "LOCKED", "CONSTANT"]).execute()
            substrate_ids.extend([UUID(b['id']) for b in (blocks_response.data or [])])
            
            # Get context items  
            context_response = supabase.table("context_items").select("id").eq(
                "basket_id", basket_id
            ).eq("state", "ACTIVE").execute()
            substrate_ids.extend([UUID(c['id']) for c in (context_response.data or [])])
            
            # CANON COMPLIANCE: P2 connects substrate only (blocks + context_items)
            # Raw dumps are NOT part of relationship mapping per Sacred Principles
            
            if len(substrate_ids) < 2:
                logger.info(f"P2 Graph: Insufficient substrate ({len(substrate_ids)}) for relationship mapping")
                await self._update_queue_state(queue_id, 'completed')
                return
            
            # Create relationship mapping request
            from app.agents.pipeline.graph_agent import RelationshipMappingRequest
            
            relationship_request = RelationshipMappingRequest(
                workspace_id=UUID(queue_entry['workspace_id']),
                basket_id=UUID(basket_id),
                substrate_ids=substrate_ids,
                agent_id='p2_graph_agent'
            )
            
            # Execute P2 Graph Agent
            graph_result = await self.p2_graph.map_relationships(relationship_request)
            
            # Mark as completed with work result
            work_result = {
                'relationships_created': len(graph_result.relationships_created),
                'substrate_analyzed': graph_result.substrate_analyzed,
                'connection_strength_avg': graph_result.connection_strength_avg,
                'processing_time_ms': graph_result.processing_time_ms
            }
            
            # Update universal work tracker if work_id exists
            if queue_entry.get('work_id'):
                await universal_work_tracker.complete_work(
                    queue_entry['work_id'], 
                    work_result,
                    'P2_graph_completed'
                )
            
            await self._update_queue_state(queue_id, 'completed')
            
            logger.info(f"P2 Graph completed successfully: work_id={work_id}, relationships={len(graph_result.relationships_created)}")
            
        except Exception as e:
            logger.exception(f"P2 Graph processing failed for work_id {work_id}: {e}")
            
            # Update universal work tracker for failure
            if queue_entry.get('work_id'):
                await universal_work_tracker.fail_work(
                    queue_entry['work_id'],
                    str(e)
                )
            
            await self._mark_failed(queue_id, str(e))
            raise
    
    async def _get_batch_group(self, dump_id: str) -> List[str]:
        """
        Get batch group for Share Updates comprehensive processing.
        
        Looks for dumps created within same time window with batch metadata
        to support comprehensive multi-dump analysis.
        """
        try:
            # Check if dump has batch metadata indicating Share Updates origin
            dump_response = supabase.table("raw_dumps").select(
                "id,source_meta,created_at"
            ).eq("id", dump_id).single().execute()
            
            if not dump_response.data:
                return [dump_id]  # Single dump fallback
                
            dump = dump_response.data
            source_meta = dump.get("source_meta", {})
            
            # Check for batch processing metadata
            batch_id = source_meta.get("batch_id")
            if not batch_id:
                return [dump_id]  # Single dump
                
            # Find all dumps in the same batch
            batch_response = supabase.table("raw_dumps").select("id").eq(
                "source_meta->>batch_id", batch_id
            ).order("created_at").execute()
            
            if batch_response.data:
                return [d["id"] for d in batch_response.data]
            else:
                return [dump_id]  # Fallback to single dump
                
        except Exception as e:
            logger.warning(f"Failed to get batch group for dump {dump_id}: {e}")
            return [dump_id]  # Safe fallback
    
    async def _validate_p0_capture(self, dump_id: UUID, workspace_id: UUID):
        """
        Validate that P0 Capture was completed properly.
        P0 should have created the raw_dump with proper content.
        """
        try:
            dump_resp = supabase.table("raw_dumps").select(
                "id,body_md,file_url,source_meta,workspace_id,basket_id"
            ).eq("id", str(dump_id)).eq("workspace_id", str(workspace_id)).single().execute()
            
            if not dump_resp.data:
                raise ValueError(f"P0 Capture validation failed: dump {dump_id} not found")
            
            dump = dump_resp.data
            if not dump.get("body_md") and not dump.get("file_url"):
                raise ValueError(f"P0 Capture validation failed: dump {dump_id} has no content")
                
            logger.info(f"P0 Capture validation passed for dump {dump_id}")
            
        except Exception as e:
            logger.error(f"P0 Capture validation failed: {e}")
            raise
    
    async def _update_queue_state(self, queue_id: str, state: str, error: Optional[str] = None):
        """Update queue entry state."""
        try:
            supabase.rpc('fn_update_queue_state', {
                'p_id': queue_id,
                'p_state': state,
                'p_error': error
            }).execute()
        except Exception as e:
            logger.error(f"Failed to update queue state for {queue_id}: {e}")
    
    async def _mark_failed(self, queue_id: str, error: str):
        """Mark queue entry as failed."""
        await self._update_queue_state(queue_id, 'failed', error)
    
    def get_processor_info(self) -> Dict[str, Any]:
        """Get canonical processor information."""
        return {
            "processor_name": "CanonicalQueueProcessor",
            "worker_id": self.worker_id,
            "canon_version": "v2.1",
            "pipeline_agents": {
                "P0_CAPTURE": self.p0_capture.get_agent_info(),
                "P1_GOVERNANCE": self.p1_governance.get_agent_info(),
                "P2_GRAPH": self.p2_graph.get_agent_info(),
                "P3_REFLECTION": self.p3_reflection.get_agent_info()
            },
            "processing_sequence": ["P0_CAPTURE", "P1_GOVERNANCE", "P2_DEFERRED", "P3_DEFERRED"],
            "sacred_principles": [
                "Capture is Sacred",
                "All Substrates are Peers",
                "Narrative is Deliberate", 
                "Agent Intelligence is Mandatory"
            ],
            "status": "running" if self.running else "stopped"
        }
    
    async def _process_new_document_composition(self, queue_entry: Dict[str, Any]):
        """
        Process P4_COMPOSE_NEW work for creating new documents from memory.
        
        Canon Compliance:
        - P4 creates new document artifact from substrate
        - Implements Sacred Principle #3: Narrative is Deliberate
        - Creates document first, then populates with composed content
        """
        work_id = queue_entry.get('work_id', queue_entry['id'])
        queue_id = queue_entry['id']
        work_payload = queue_entry.get('work_payload', {})
        
        logger.info(f"Starting P4 new document composition: work_id={work_id}")
        
        try:
            # Mark as processing
            await self._update_queue_state(queue_id, 'processing')
            
            # Extract composition operation data
            operations = work_payload.get('operations', [])
            if not operations:
                raise ValueError("P4 new document composition work missing operations")
            
            compose_op = next((op for op in operations if op['type'] == 'compose_from_memory'), None)
            if not compose_op:
                raise ValueError("P4 new document composition work missing compose_from_memory operation")
            
            op_data = compose_op['data']
            
            # Step 1: Create new blank document first (Canon: P4 creates artifacts)
            document_id = await self._create_blank_document(
                basket_id=work_payload['basket_id'],
                workspace_id=queue_entry['workspace_id'],
                title=op_data.get('title', 'Untitled Document'),
                intent=op_data.get('intent', '')
            )
            
            # Step 2: Create composition request with the new document ID
            composition_request = CompositionRequest(
                document_id=document_id,
                basket_id=work_payload['basket_id'],
                workspace_id=queue_entry['workspace_id'],
                intent=op_data.get('intent', ''),
                window=op_data.get('window'),
                pinned_ids=op_data.get('pinned_ids')
            )
            
            # Step 3: Process through P4 composition agent
            composition_result = await self.p4_composition.process(composition_request)
            
            if not composition_result.success:
                raise RuntimeError(f"P4 new document composition failed: {composition_result.message}")
            
            logger.info(f"P4 new document composition completed: {composition_result.message}")
            
            # Prepare work result
            work_result = {
                'document_id': document_id,
                'title': op_data.get('title', 'Untitled Document'),
                'composition_status': 'completed',
                'agent_message': composition_result.message,
                'substrate_count': composition_result.data.get('substrate_count', 0),
                'confidence': composition_result.data.get('confidence', 0.8)
            }
            
            # Update universal work tracker if work_id exists
            if queue_entry.get('work_id'):
                await universal_work_tracker.complete_work(
                    queue_entry['work_id'],
                    work_result,
                    'P4_new_document_completed'
                )
            
            await self._update_queue_state(queue_id, 'completed')
            logger.info(f"P4 new document composition work completed successfully: {work_id}")
            
        except Exception as e:
            logger.exception(f"P4 new document composition work failed: {work_id}: {e}")
            
            # Update universal work tracker for failure
            if queue_entry.get('work_id'):
                await universal_work_tracker.fail_work(
                    queue_entry['work_id'],
                    str(e)
                )
            
            await self._mark_failed(queue_id, str(e))
    
    async def _create_blank_document(self, basket_id: str, workspace_id: str, title: str, intent: str) -> str:
        """Create a blank document that will be populated by P4 composition"""
        from uuid import uuid4
        import json
        
        document_id = str(uuid4())
        
        # Create document record
        document_data = {
            'id': document_id,
            'basket_id': basket_id,
            'workspace_id': workspace_id,
            'title': title,
            'content_raw': intent if intent else f"# {title}\n\n_Composing from your memory..._",
            'content_rendered': f"<h1>{title}</h1><p><em>Composing from your memory...</em></p>",
            'status': 'composing',
            'metadata': json.dumps({
                'composition_intent': intent,
                'composition_source': 'memory',
                'creation_method': 'P4_COMPOSE_NEW'
            })
        }
        
        result = await self.supabase.table('documents').insert(document_data).execute()
        if result.data and len(result.data) > 0:
            logger.info(f"Created blank document {document_id} for P4 composition")
            return document_id
        else:
            raise RuntimeError("Failed to create blank document for P4 composition")


# Global canonical processor instance for lifecycle management  
_canonical_processor: Optional[CanonicalQueueProcessor] = None


async def start_canonical_queue_processor():
    """Start the global canonical queue processor."""
    global _canonical_processor
    if _canonical_processor is None:
        _canonical_processor = CanonicalQueueProcessor()
        asyncio.create_task(_canonical_processor.start())
        logger.info("Canonical queue processor started - Canon v2.1 compliant")


async def stop_canonical_queue_processor():
    """Stop the global canonical queue processor."""
    global _canonical_processor
    if _canonical_processor:
        await _canonical_processor.stop()
        _canonical_processor = None
        logger.info("Canonical queue processor stopped")


async def get_canonical_queue_health() -> Dict[str, Any]:
    """Get canonical queue health metrics."""
    try:
        # Get basic queue health from database
        response = supabase.rpc('fn_queue_health').execute()
        queue_stats = response.data or []
        
        # Get processor information
        processor_info = _canonical_processor.get_processor_info() if _canonical_processor else {
            "processor_name": "CanonicalQueueProcessor",
            "status": "not_running"
        }
        
        return {
            "status": "healthy",
            "canon_version": "v2.1",
            "queue_stats": queue_stats,
            "processor_info": processor_info,
            "pipeline_boundaries_enforced": True,
            "sacred_principles_active": True
        }
        
    except Exception as e:
        logger.error(f"Failed to get canonical queue health: {e}")
        return {
            "status": "unhealthy",
            "canon_version": "v2.1",
            "error": str(e),
            "processor_running": False
        }
