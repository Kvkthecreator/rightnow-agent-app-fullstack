"""
Cascade Manager for Pipeline Integration

Handles automatic triggering of downstream pipeline stages after upstream completion.
Ensures P1→P2→P3 cascade flow per YARNNN Canon v2.0.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4

from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")


class CascadeConfiguration:
    """Configuration for pipeline cascade triggers."""
    
    CASCADE_RULES = {
        'P1_SUBSTRATE': {
            'triggers_next': 'P2_GRAPH',
            'condition': lambda result: result.get('proposals_created', 0) > 0,
            'delay_seconds': 5,  # Allow governance operations to complete
            'description': 'Substrate creation triggers relationship mapping'
        },
        'P2_GRAPH': {
            'triggers_next': 'P3_REFLECTION',
            'condition': lambda result: result.get('relationships_created', 0) > 0,
            'delay_seconds': 0,
            'description': 'Relationship mapping triggers reflection computation'
        },
        'P3_REFLECTION': {
            'triggers_next': None,  # P4 is on-demand only
            'condition': None,
            'description': 'Reflection is terminal stage (P4 on-demand)'
        }
    }


class CascadeManager:
    """
    Manages cascade triggering between pipeline stages.
    
    Ensures each pipeline stage triggers the next according to canon rules:
    - P1 substrate creation → P2 relationship mapping
    - P2 relationship mapping → P3 reflection computation
    - P3 reflection → Terminal (P4 is on-demand)
    """
    
    def __init__(self):
        self.config = CascadeConfiguration.CASCADE_RULES
        self.logger = logger
        
    async def trigger_cascade(
        self,
        completed_work_type: str,
        basket_id: UUID,
        workspace_id: UUID,
        work_result: Dict[str, Any],
        source_metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Trigger next pipeline stage based on completed work.
        
        Args:
            completed_work_type: The work type that just completed (e.g., 'P1_SUBSTRATE')
            basket_id: The basket being processed
            workspace_id: The workspace context
            work_result: Result from completed work (used for conditional triggering)
            source_metadata: Additional metadata from source work
            
        Returns:
            Queue entry ID if cascade triggered, None otherwise
        """
        try:
            # Check if this work type triggers a cascade
            cascade_rule = self.config.get(completed_work_type)
            if not cascade_rule or not cascade_rule['triggers_next']:
                self.logger.info(f"No cascade configured for {completed_work_type}")
                return None
                
            # Check condition
            condition = cascade_rule['condition']
            if condition and not condition(work_result):
                self.logger.info(
                    f"Cascade condition not met for {completed_work_type} → {cascade_rule['triggers_next']}"
                )
                return None
                
            next_work_type = cascade_rule['triggers_next']
            delay_seconds = cascade_rule.get('delay_seconds', 0)
            
            # Build cascade metadata
            cascade_metadata = {
                'cascade_trigger': {
                    'source_work_type': completed_work_type,
                    'trigger_time': datetime.now(timezone.utc).isoformat(),
                    'source_result': self._extract_cascade_relevant_data(work_result),
                    'cascade_rule': cascade_rule['description']
                }
            }
            
            # Merge with source metadata if provided
            if source_metadata:
                cascade_metadata.update(source_metadata)
                
            # Add delay if configured
            if delay_seconds > 0:
                cascade_metadata['cascade_trigger']['delayed_seconds'] = delay_seconds
                # TODO: Implement delayed queue entry (requires scheduled_for field)
                
            # Create queue entry for next stage
            queue_entry_id = await self._create_queue_entry(
                basket_id=basket_id,
                workspace_id=workspace_id,
                work_type=next_work_type,
                metadata=cascade_metadata
            )
            
            self.logger.info(
                f"Cascade triggered: {completed_work_type} → {next_work_type} "
                f"(queue entry: {queue_entry_id})"
            )
            
            # Emit cascade event
            await self._emit_cascade_event(
                basket_id=basket_id,
                workspace_id=workspace_id,
                source_work=completed_work_type,
                target_work=next_work_type,
                queue_entry_id=queue_entry_id
            )
            
            return queue_entry_id
            
        except Exception as e:
            self.logger.error(f"Cascade trigger failed: {e}")
            # Don't fail the source work completion
            return None
            
    async def trigger_p1_to_p2_cascade(
        self,
        proposal_id: str,
        basket_id: UUID,
        workspace_id: UUID,
        substrate_created: Dict[str, List[str]]
    ) -> Optional[str]:
        """
        Specific cascade trigger for P1→P2 after substrate creation.
        
        Args:
            proposal_id: The governance proposal that created substrate
            basket_id: The basket containing new substrate
            workspace_id: The workspace context
            substrate_created: Dict of created substrate IDs by type
            
        Returns:
            Queue entry ID if cascade triggered
        """
        work_result = {
            'proposals_created': 1,  # At least one proposal was executed
            'substrate_created': substrate_created
        }
        
        metadata = {
            'source_proposal_id': proposal_id,
            'substrate_ids': substrate_created
        }
        
        return await self.trigger_cascade(
            completed_work_type='P1_SUBSTRATE',
            basket_id=basket_id,
            workspace_id=workspace_id,
            work_result=work_result,
            source_metadata=metadata
        )
        
    def _extract_cascade_relevant_data(self, work_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract only cascade-relevant data from work result."""
        # Define what data is relevant for downstream stages
        relevant_keys = [
            'proposals_created',
            'substrate_created', 
            'relationships_created',
            'reflections_computed',
            'confidence',
            'operations_count'
        ]
        
        return {k: v for k, v in work_result.items() if k in relevant_keys}
        
    async def _create_queue_entry(
        self,
        basket_id: UUID,
        workspace_id: UUID,
        work_type: str,
        metadata: Dict[str, Any]
    ) -> str:
        """Create a canonical queue entry for cascade work."""
        queue_entry = {
            'id': str(uuid4()),
            'basket_id': str(basket_id),
            'workspace_id': str(workspace_id),
            'work_type': work_type,
            'status': 'pending',
            'priority': 5,  # Standard priority for cascade work
            'metadata': metadata,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        response = supabase.table('canonical_queue').insert(queue_entry).execute()
        
        if response.error:
            raise Exception(f"Failed to create cascade queue entry: {response.error}")
            
        return queue_entry['id']
        
    async def _emit_cascade_event(
        self,
        basket_id: UUID,
        workspace_id: UUID,
        source_work: str,
        target_work: str,
        queue_entry_id: str
    ):
        """Emit timeline event for cascade trigger."""
        try:
            supabase.rpc('emit_timeline_event', {
                'p_basket_id': str(basket_id),
                'p_event_type': 'pipeline.cascade',
                'p_event_data': {
                    'source_stage': source_work,
                    'target_stage': target_work,
                    'queue_entry_id': queue_entry_id,
                    'cascade_time': datetime.now(timezone.utc).isoformat()
                },
                'p_workspace_id': str(workspace_id),
                'p_actor_id': None  # System-triggered
            }).execute()
        except Exception as e:
            # Don't fail cascade on event emission failure
            self.logger.warning(f"Failed to emit cascade event: {e}")


# Singleton instance
cascade_manager = CascadeManager()