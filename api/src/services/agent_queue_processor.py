"""
Agent Queue Processor - Async Intelligence Framework
Implements queue-based processing per YARNNN canon Phase 2
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4

from app.agents.services.dump_interpreter import (
    DumpInterpreterService, 
    RawDumpInterpretationRequest
)
from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")

class AgentQueueProcessor:
    """Processes agent work queue using existing dump interpretation services."""
    
    def __init__(self, worker_id: Optional[str] = None, poll_interval: int = 10):
        if not supabase:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY required for agent queue processing")
        self.worker_id = worker_id or f"agent-worker-{uuid4().hex[:8]}"
        self.poll_interval = poll_interval
        self.running = False
        
    async def start(self):
        """Start the queue processing loop."""
        self.running = True
        logger.info(f"Starting Agent Queue Processor: {self.worker_id}")
        
        while self.running:
            try:
                # Claim work from queue
                queue_entries = await self._claim_dumps()
                
                if queue_entries:
                    logger.info(f"Claimed {len(queue_entries)} dumps for processing")
                    
                    # Process each claimed dump
                    for entry in queue_entries:
                        try:
                            await self._process_dump(entry)
                        except Exception as e:
                            logger.exception(f"Failed to process dump {entry['dump_id']}: {e}")
                            await self._mark_failed(entry['id'], str(e))
                else:
                    # No work available, wait before next poll
                    await asyncio.sleep(self.poll_interval)
                    
            except Exception as e:
                logger.exception(f"Queue processing error: {e}")
                await asyncio.sleep(self.poll_interval)
    
    async def stop(self):
        """Stop the queue processing loop."""
        self.running = False
        logger.info(f"Stopping Agent Queue Processor: {self.worker_id}")
    
    async def _claim_dumps(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Atomically claim dumps from the queue."""
        try:
            # Debug: Test basic connectivity first
            logger.info(f"Testing Supabase connection for worker {self.worker_id}")
            
            # Test with a simpler function first
            try:
                test_response = supabase.rpc('fn_queue_health').execute()
                logger.info(f"Queue health test successful: {test_response.data}")
            except Exception as test_e:
                logger.error(f"Queue health test failed: {test_e}")
            
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
                logger.info("No dumps available to claim")
                return []
            
        except Exception as e:
            logger.error(f"Failed to claim dumps: {e}")
            logger.error(f"Supabase client config: URL exists={bool(supabase)}")
            return []
    
    async def _process_dump(self, queue_entry: Dict[str, Any]):
        """Process a single dump using existing agent services."""
        dump_id = queue_entry['dump_id']
        basket_id = queue_entry['basket_id']
        workspace_id = queue_entry['workspace_id']
        queue_id = queue_entry['id']
        
        logger.info(f"Processing dump {dump_id} in basket {basket_id}")
        
        try:
            # Mark as processing
            await self._update_queue_state(queue_id, 'processing')
            
            # Use existing dump interpretation service
            interpretation_request = RawDumpInterpretationRequest(
                raw_dump_id=dump_id,
                agent_id=self.worker_id,
                max_blocks=20,
                interpretation_prompt="Extract meaningful insights, goals, and concepts from this content."
            )
            
            # Process the dump (this creates blocks via proper RPCs)
            result = await DumpInterpreterService.interpret_dump(
                interpretation_request, 
                workspace_id
            )
            
            logger.info(
                f"Successfully processed dump {dump_id}: "
                f"{len(result.proposed_blocks)} blocks created, "
                f"confidence {result.agent_confidence:.2f}"
            )
            
            # TODO: Add context item extraction
            await self._extract_context_items(dump_id, basket_id, workspace_id)
            
            # TODO: Add relationship mapping
            await self._map_relationships(dump_id, basket_id, workspace_id)
            
            # Mark as completed
            await self._update_queue_state(queue_id, 'completed')
            
        except Exception as e:
            logger.exception(f"Dump processing failed for {dump_id}: {e}")
            await self._mark_failed(queue_id, str(e))
            raise
    
    async def _extract_context_items(self, dump_id: str, basket_id: str, workspace_id: str):
        """Extract context items from processed dump (P1 pipeline)."""
        try:
            # Get dump content for context extraction
            dump_resp = supabase.table("raw_dumps").select(
                "body_md,file_url,source_meta"
            ).eq("id", dump_id).single().execute()
            
            if not dump_resp.data:
                logger.warning(f"Dump {dump_id} not found for context extraction")
                return
                
            dump = dump_resp.data
            content = dump.get('body_md', '') or ''
            
            # Simple context item extraction (in production, would use AI)
            context_items = self._extract_entities_simple(content)
            
            if context_items:
                # Use RPC for bulk context item creation
                supabase.rpc('fn_context_item_upsert_bulk', {
                    'p_basket_id': basket_id,
                    'p_items': context_items
                }).execute()
                
                logger.info(f"Created {len(context_items)} context items for dump {dump_id}")
                
        except Exception as e:
            logger.warning(f"Context item extraction failed for {dump_id}: {e}")
            # Don't fail the whole processing for context item issues
    
    async def _map_relationships(self, dump_id: str, basket_id: str, workspace_id: str):
        """Map relationships between substrate elements (P2 pipeline)."""
        try:
            # Simple relationship mapping (in production, would use graph analysis)
            # For now, just create a basic relationship indicating the dump created blocks
            
            # Get blocks created from this dump
            blocks_resp = supabase.table("blocks").select(
                "id,semantic_type,content"
            ).eq("basket_id", basket_id).execute()
            
            if not blocks_resp.data or len(blocks_resp.data) < 2:
                return  # Need at least 2 blocks to create relationships
            
            blocks = blocks_resp.data
            relationships = []
            
            # Create simple co-occurrence relationships
            for i, block1 in enumerate(blocks):
                for block2 in blocks[i+1:]:
                    relationships.append({
                        'from_type': 'block',
                        'from_id': block1['id'],
                        'to_type': 'block', 
                        'to_id': block2['id'],
                        'relationship_type': 'related_content',
                        'strength': 0.5,
                        'metadata': {'source': 'same_dump', 'dump_id': dump_id}
                    })
                    
                    # Limit relationships to prevent explosion
                    if len(relationships) >= 10:
                        break
                if len(relationships) >= 10:
                    break
            
            if relationships:
                supabase.rpc('fn_relationship_upsert_bulk', {
                    'p_basket_id': basket_id,
                    'p_relationships': relationships,
                    'p_idem_key': f"dump_processing_{dump_id}"
                }).execute()
                
                logger.info(f"Created {len(relationships)} relationships for dump {dump_id}")
                
        except Exception as e:
            logger.warning(f"Relationship mapping failed for {dump_id}: {e}")
            # Don't fail the whole processing for relationship issues
    
    def _extract_entities_simple(self, content: str) -> List[Dict[str, Any]]:
        """Simple entity extraction from content."""
        if not content:
            return []
            
        entities = []
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        for line in lines:
            # Look for potential entities
            if len(line) < 5 or len(line) > 100:
                continue
                
            # Simple heuristics for entity types
            entity_type = 'concept'
            if any(word in line.lower() for word in ['person', 'user', 'customer', 'team']):
                entity_type = 'person'
            elif any(word in line.lower() for word in ['project', 'product', 'service']):
                entity_type = 'project'
            elif any(word in line.lower() for word in ['goal', 'objective', 'target']):
                entity_type = 'goal'
            elif line.endswith('?'):
                entity_type = 'question'
                
            entities.append({
                'type': entity_type,
                'content': line,
                'metadata': {
                    'extracted_by': self.worker_id,
                    'confidence': 0.6,
                    'extraction_method': 'simple_heuristic'
                }
            })
            
            # Limit entities
            if len(entities) >= 20:
                break
                
        return entities
    
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


# Global processor instance for lifecycle management
_processor: Optional[AgentQueueProcessor] = None

async def start_agent_queue_processor():
    """Start the global agent queue processor."""
    global _processor
    if _processor is None:
        _processor = AgentQueueProcessor()
        asyncio.create_task(_processor.start())
        logger.info("Agent queue processor started")

async def stop_agent_queue_processor():
    """Stop the global agent queue processor."""
    global _processor
    if _processor:
        await _processor.stop()
        _processor = None
        logger.info("Agent queue processor stopped")

async def get_queue_health() -> Dict[str, Any]:
    """Get queue health metrics."""
    try:
        response = supabase.rpc('fn_queue_health').execute()
        return {
            'status': 'healthy',
            'queue_stats': response.data or [],
            'processor_running': _processor is not None and _processor.running if _processor else False,
            'worker_id': _processor.worker_id if _processor else None
        }
    except Exception as e:
        logger.error(f"Failed to get queue health: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'processor_running': False
        }