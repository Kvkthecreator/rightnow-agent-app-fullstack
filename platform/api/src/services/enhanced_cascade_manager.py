"""
Enhanced Cascade Manager - YARNNN Canon v3.1 Compliant

Integrates with Universal Work Tracker for comprehensive cascade orchestration.
Handles P1→P3 pipeline flows with full status visibility and timeline events.

Canon v3.1 Update:
- P2 (Graph/Relationships) removed - replaced by Neural Map (client-side visualization)
- P1_SUBSTRATE no longer triggers P2_GRAPH cascades
- Direct P1→P3 cascade possible (though P3 typically triggered on-demand)

Canon Compliance:
- Uses universal_work_tracker for all cascade work creation
- Emits timeline events for cascade state changes (Sacred Principle #4)
- Respects workspace isolation and governance flows
- Maintains agent intelligence requirement for all cascades
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Literal
from uuid import UUID, uuid4

from shared.utils.supabase_client import supabase_admin_client as supabase
from shared.substrate.services.universal_work_tracker import universal_work_tracker, WorkContext

logger = logging.getLogger("uvicorn.error")

# Cascade work types (P2_GRAPH removed in v3.1)
CascadeWorkType = Literal['P1_SUBSTRATE', 'P3_REFLECTION']

class CascadeRule:
    """Defines cascade triggering rules between pipeline stages."""
    
    def __init__(
        self,
        triggers_next: Optional[CascadeWorkType],
        condition_func: Optional[callable],
        delay_seconds: int = 0,
        description: str = ""
    ):
        self.triggers_next = triggers_next
        self.condition_func = condition_func
        self.delay_seconds = delay_seconds
        self.description = description
    
    def should_trigger(self, work_result: Dict[str, Any]) -> bool:
        """Check if cascade should be triggered based on work result."""
        if not self.condition_func:
            return True
        return self.condition_func(work_result)


class CanonicalCascadeManager:
    """
    Canon v3.1 compliant cascade manager with universal work tracker integration.

    Manages automatic cascade flows while maintaining:
    - Full status visibility through universal work tracker
    - Timeline event emission for all cascade state changes
    - Conditional triggering based on work results
    - Workspace isolation and security
    - Agent intelligence requirements

    Canon v3.1: P2 (Graph/Relationships) removed - P1 and P3 are independent
    """

    def __init__(self):
        self.cascade_rules = self._initialize_cascade_rules()
        logger.info("Canonical Cascade Manager initialized - Canon v3.1 compliant")

    def _initialize_cascade_rules(self) -> Dict[str, CascadeRule]:
        """Initialize cascade rules per Canon v3.1 pipeline flows."""
        return {
            'P1_SUBSTRATE': CascadeRule(
                triggers_next=None,  # P2 removed in v3.1 - no automatic cascade
                condition_func=None,
                description='Substrate creation complete (P3/P4 triggered on-demand)'
            ),
            'P3_REFLECTION': CascadeRule(
                triggers_next=None,  # Terminal stage
                condition_func=None,
                description='Reflection is terminal (P4 on-demand only)'
            )
        }
    
    async def process_work_completion(
        self,
        work_id: str,
        work_type: str,
        work_result: Dict[str, Any],
        context: WorkContext
    ) -> Optional[str]:
        """
        Process work completion and trigger cascades if applicable.
        
        This is the main entry point for cascade processing, called when
        any pipeline work completes.
        
        Args:
            work_id: ID of completed work
            work_type: Type of work that completed
            work_result: Results from completed work
            context: Work context (user, workspace, basket)
            
        Returns:
            Next work_id if cascade triggered, None otherwise
        """
        try:
            # Check if this work type has cascade rules
            cascade_rule = self.cascade_rules.get(work_type)
            if not cascade_rule or not cascade_rule.triggers_next:
                logger.info(f"No cascade configured for {work_type}")
                return None
            
            # Check if cascade condition is met
            if not cascade_rule.should_trigger(work_result):
                logger.info(
                    f"Cascade condition not met for {work_type} → {cascade_rule.triggers_next}"
                )
                return None
            
            # Mark current work as cascading
            await self._update_work_cascading_status(work_id)
            
            # Create next stage work
            next_work_id = await self._create_cascade_work(
                source_work_id=work_id,
                source_work_type=work_type,
                target_work_type=cascade_rule.triggers_next,
                work_result=work_result,
                context=context,
                delay_seconds=cascade_rule.delay_seconds
            )
            
            # Emit cascade timeline event
            await self._emit_cascade_timeline_event(
                work_id=work_id,
                source_work_type=work_type,
                target_work_type=cascade_rule.triggers_next,
                next_work_id=next_work_id,
                context=context
            )
            
            logger.info(
                f"Cascade triggered: {work_type} → {cascade_rule.triggers_next} "
                f"(work_id: {next_work_id})"
            )
            
            return next_work_id
            
        except Exception as e:
            logger.error(f"Cascade processing failed for work {work_id}: {e}")
            # Don't fail the source work completion
            return None
    
    async def trigger_p1_substrate_cascade(
        self,
        proposal_id: str,
        basket_id: str,
        workspace_id: str,
        user_id: str,
        substrate_created: Dict[str, int]
    ) -> Optional[str]:
        """
        Track P1 substrate creation completion.

        Canon v3.1: No longer triggers P2 cascade (removed).
        P3/P4 are triggered on-demand via direct API calls.

        Called after governance proposals are executed and substrate is created.
        """
        context = WorkContext(
            user_id=user_id,
            workspace_id=workspace_id,
            basket_id=basket_id
        )

        work_result = {
            'proposals_created': 1,
            'proposals_executed': 1,
            'substrate_created': substrate_created,
            'source_proposal_id': proposal_id
        }

        # Create synthetic work_id for this substrate creation
        work_id = f"substrate-{proposal_id}"

        # Process completion (no cascade triggered in v3.1)
        return await self.process_work_completion(
            work_id=work_id,
            work_type='P1_SUBSTRATE',
            work_result=work_result,
            context=context
        )

    # P2 graph cascade removed in Canon v3.1 - replaced by Neural Map
    
    async def _create_cascade_work(
        self,
        source_work_id: str,
        source_work_type: str,
        target_work_type: str,
        work_result: Dict[str, Any],
        context: WorkContext,
        delay_seconds: int = 0
    ) -> str:
        """Create cascade work using universal work tracker."""
        
        # Build cascade payload
        cascade_payload = {
            'cascade_source': {
                'work_id': source_work_id,
                'work_type': source_work_type,
                'result_summary': self._extract_cascade_relevant_data(work_result)
            },
            'processing_context': {
                'triggered_at': datetime.now(timezone.utc).isoformat(),
                'delay_seconds': delay_seconds
            }
        }
        
        # Add target-specific payload data
        # P2_GRAPH removed in Canon v3.1
        if target_work_type == 'P3_REFLECTION':
            cascade_payload['reflection_processing'] = {
                'reflection_scope': 'pattern_analysis'
            }
        
        # Handle delayed execution
        if delay_seconds > 0:
            # For now, create immediately but mark for delayed processing
            # TODO: Implement proper scheduling when needed
            cascade_payload['delayed_execution'] = {
                'intended_start_time': (
                    datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)
                ).isoformat()
            }
        
        # Add required fields for canonical queue processor
        cascade_payload['basket_id'] = context.basket_id
        cascade_payload['workspace_id'] = context.workspace_id
        
        # Create work via universal work tracker
        work_id = await universal_work_tracker.initiate_work(
            work_type=target_work_type,
            payload=cascade_payload,
            context=context,
            priority=4,  # Higher priority for cascade work
            parent_work_id=source_work_id
        )
        
        return work_id
    
    async def _update_work_cascading_status(self, work_id: str):
        """Update source work to cascading status."""
        try:
            supabase.table("agent_processing_queue").update({
                'processing_state': 'cascading'
            }).eq("work_id", work_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update cascading status for work {work_id}: {e}")
    
    def _extract_cascade_relevant_data(self, work_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract data relevant for cascade decision-making."""
        relevant_keys = [
            'proposals_created',
            'proposals_executed', 
            'substrate_created',
            'relationships_created',
            'reflections_computed',
            'confidence',
            'processing_time_ms'
        ]
        
        return {k: v for k, v in work_result.items() if k in relevant_keys}
    
    async def _emit_cascade_timeline_event(
        self,
        work_id: str,
        source_work_type: str,
        target_work_type: str,
        next_work_id: str,
        context: WorkContext
    ):
        """
        Emit timeline event for cascade trigger.
        
        Canon Principle #4: Event-driven consistency via timeline_events
        """
        try:
            event_data = {
                'workspace_id': context.workspace_id,
                'basket_id': context.basket_id,
                'ts': datetime.now(timezone.utc).isoformat(),
                'kind': 'pipeline.cascade_triggered',
                'ref_id': None,  # No specific reference ID for cascade events
                'preview': f"{source_work_type} → {target_work_type}",
                'payload': {
                    'cascade_flow': {
                        'source_work_id': work_id,
                        'source_work_type': source_work_type,
                        'target_work_type': target_work_type,
                        'next_work_id': next_work_id
                    },
                    'trigger_time': datetime.now(timezone.utc).isoformat(),
                    'cascade_rule': self.cascade_rules[source_work_type].description,
                    'user_id': context.user_id
                }
            }
            
            supabase.table("timeline_events").insert(event_data).execute()
            logger.debug(f"Cascade timeline event emitted: {source_work_type} → {target_work_type}")
            
        except Exception as e:
            # Timeline event failures should not break cascades
            logger.warning(f"Failed to emit cascade timeline event: {e}")
    
    async def get_cascade_status(self, work_id: str) -> Dict[str, Any]:
        """Get cascade status for a given work item."""
        try:
            # Get work entry with cascade metadata
            work_response = supabase.table("agent_processing_queue").select(
                "work_id, work_type, processing_state, cascade_metadata, parent_work_id"
            ).eq("work_id", work_id).single().execute()
            
            if not work_response.data:
                return {'cascade_active': False, 'reason': 'work_not_found'}
            
            work = work_response.data
            
            # Check if this work is part of an active cascade
            cascade_active = work['processing_state'] == 'cascading'
            
            # Get cascade children (work triggered by this work)
            children_response = supabase.table("agent_processing_queue").select(
                "work_id, work_type, processing_state"
            ).eq("parent_work_id", work_id).execute()
            
            cascade_children = children_response.data or []
            
            return {
                'cascade_active': cascade_active,
                'work_type': work['work_type'],
                'processing_state': work['processing_state'],
                'parent_work_id': work.get('parent_work_id'),
                'cascade_children': cascade_children,
                'cascade_metadata': work.get('cascade_metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Failed to get cascade status for work {work_id}: {e}")
            return {'cascade_active': False, 'error': str(e)}

# Global instance for application use
canonical_cascade_manager = CanonicalCascadeManager()

__all__ = ["canonical_cascade_manager", "CanonicalCascadeManager", "WorkContext"]