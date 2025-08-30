"""
Canonical Queue Processor - YARNNN Canon v1.4.0 Compliant

Orchestrates the canonical pipeline agents (P0-P4) in proper sequence
while respecting Sacred Principles and pipeline boundaries.

Pipeline Processing Sequence:
1. P0 Capture: Raw dump ingestion only
2. P1 Substrate: Block/context creation only  
3. P2 Graph: Relationship mapping only
4. P3 Reflection: Pattern computation only
(P4 Presentation triggered on-demand, not in queue processing)
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4, UUID

from app.agents.pipeline import (
    P0CaptureAgent,
    P1SubstrateAgent,
    P2GraphAgent,
    P3ReflectionAgent
)
from app.agents.pipeline.capture_agent import DumpIngestionRequest
from app.agents.pipeline.substrate_agent import SubstrateCreationRequest
from app.agents.pipeline.graph_agent import RelationshipMappingRequest
from app.agents.pipeline.reflection_agent import ReflectionComputationRequest
from app.agents.pipeline.governance_processor import GovernanceDumpProcessor
from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")


class CanonicalQueueProcessor:
    """
    Canonical queue processor implementing YARNNN Canon v1.4.0 pipeline boundaries.
    
    This processor orchestrates P0-P3 agents in strict sequence while maintaining
    Sacred Principles and pipeline boundaries.
    """
    
    def __init__(self, worker_id: Optional[str] = None, poll_interval: int = 10):
        if not supabase:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY required for canonical queue processing")
        
        self.worker_id = worker_id or f"canonical-worker-{uuid4().hex[:8]}"
        self.poll_interval = poll_interval
        self.running = False
        
        # Initialize canonical pipeline agents
        self.p0_capture = P0CaptureAgent()
        self.p1_governance = GovernanceDumpProcessor()  # Governance evolution
        self.p2_graph = P2GraphAgent()
        self.p3_reflection = P3ReflectionAgent()
        
        logger.info(f"Canonical Queue Processor initialized: {self.worker_id}")
        
    async def start(self):
        """Start the canonical queue processing loop."""
        self.running = True
        logger.info(f"Starting Canonical Queue Processor: {self.worker_id}")
        
        while self.running:
            try:
                # Claim work from queue
                queue_entries = await self._claim_dumps()
                
                if queue_entries:
                    logger.info(f"Claimed {len(queue_entries)} dumps for canonical processing")
                    
                    # Process each claimed dump through canonical pipeline
                    for entry in queue_entries:
                        try:
                            await self._process_dump_canonically(entry)
                        except Exception as e:
                            logger.exception(f"Canonical processing failed for dump {entry['dump_id']}: {e}")
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
    
    async def _claim_dumps(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Atomically claim dumps from the queue."""
        try:
            response = supabase.rpc(
                'fn_claim_next_dumps',
                {
                    'p_worker_id': self.worker_id,
                    'p_limit': limit,
                    'p_stale_after_minutes': 5
                }
            ).execute()
            
            if response.data:
                logger.info(f"Successfully claimed {len(response.data)} dumps")
                return response.data
            else:
                return []
            
        except Exception as e:
            logger.error(f"Failed to claim dumps: {e}")
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
        dump_id = UUID(queue_entry['dump_id'])
        basket_id = UUID(queue_entry['basket_id'])
        workspace_id = UUID(queue_entry['workspace_id'])
        queue_id = queue_entry['id']
        
        logger.info(f"Starting canonical processing: dump_id={dump_id}")
        
        try:
            # Mark as processing
            await self._update_queue_state(queue_id, 'processing')
            
            # P0 CAPTURE: Process dump ingestion (already done, but validate)
            # Note: P0 work was done when dump was created, but we validate here
            await self._validate_p0_capture(dump_id, workspace_id)
            logger.info(f"P0 Capture validated for dump {dump_id}")
            
            # P1 GOVERNANCE: Create governance proposals from dump (Canon v2.0)
            # Sacred Rule: All substrate mutations flow through governed proposals
            governance_result = await self.p1_governance.process_dump(
                dump_id=dump_id,
                basket_id=basket_id,
                workspace_id=workspace_id
            )
            
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
            
            # Mark as completed
            await self._update_queue_state(queue_id, 'completed')
            
            logger.info(f"Canonical processing completed successfully for dump {dump_id}")
            
        except Exception as e:
            logger.exception(f"Canonical processing failed for dump {dump_id}: {e}")
            await self._mark_failed(queue_id, str(e))
            raise
    
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
            "canon_version": "v1.4.0",
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


# Global canonical processor instance for lifecycle management  
_canonical_processor: Optional[CanonicalQueueProcessor] = None


async def start_canonical_queue_processor():
    """Start the global canonical queue processor."""
    global _canonical_processor
    if _canonical_processor is None:
        _canonical_processor = CanonicalQueueProcessor()
        asyncio.create_task(_canonical_processor.start())
        logger.info("Canonical queue processor started - Canon v1.4.0 compliant")


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
            "canon_version": "v1.4.0",
            "queue_stats": queue_stats,
            "processor_info": processor_info,
            "pipeline_boundaries_enforced": True,
            "sacred_principles_active": True
        }
        
    except Exception as e:
        logger.error(f"Failed to get canonical queue health: {e}")
        return {
            "status": "unhealthy",
            "canon_version": "v1.4.0",
            "error": str(e),
            "processor_running": False
        }