"""
Universal Work Tracker - YARNNN Canon v2.1 Compliant

⚠️ DEPRECATION NOTICE (v4.0 Migration):
This v2.1-era work tracker will be replaced by the work_sessions table model.
Current status: Operational (used by work_status.py)
Will be removed after v4.0 work_sessions routes are wired.
See: LEGACY_CODE_INVENTORY.md for migration plan.

Provides universal work orchestration for all async operations in YARNNN,
not just pipeline processing. Serves as the single source of truth for work
creation, status tracking, and cascade management.

Canon Compliance:
- Sacred Principle #1: All substrate mutations flow through governed proposals
- Sacred Principle #2: Agent intelligence is mandatory for all operations
- Sacred Principle #3: Memory-first architecture with substrate/artifact separation
- Sacred Principle #4: Event-driven consistency via timeline_events
"""
# V3.0 DEPRECATION NOTICE:
# This file contains references to context_items table which was merged into blocks table.
# Entity blocks are now identified by semantic_type='entity'.


import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Literal
from uuid import uuid4, UUID
from dataclasses import dataclass

from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")

# Canon v2.1 Work Types
WorkType = Literal[
    'P0_CAPTURE',
    'P1_SUBSTRATE', 
    'P2_GRAPH',
    'P3_REFLECTION',
    'P4_COMPOSE',
    'MANUAL_EDIT',
    'PROPOSAL_REVIEW', 
    'TIMELINE_RESTORE'
]

# Work Status States
WorkStatus = Literal[
    'pending',
    'claimed', 
    'processing',
    'cascading',
    'completed',
    'failed'
]

@dataclass
class WorkContext:
    """Context information for work initiation."""
    user_id: str
    workspace_id: str
    basket_id: Optional[str] = None
    dump_id: Optional[str] = None
    proposal_id: Optional[str] = None
    document_id: Optional[str] = None

@dataclass
class WorkStatusResponse:
    """Canon-compliant work status response."""
    work_id: str
    work_type: WorkType
    status: WorkStatus
    processing_stage: Optional[str]
    progress_percentage: int
    basket_id: Optional[str]
    workspace_id: str
    user_id: str
    started_at: str
    last_activity: str
    estimated_completion: Optional[str]
    substrate_impact: Dict[str, Any]
    cascade_flow: Dict[str, Any]
    error: Optional[Dict[str, str]]


class UniversalWorkTracker:
    """
    Canon-compliant universal work orchestration for all async operations.
    
    Extends the agent_processing_queue (canonical_queue) to handle all work types:
    - P0-P4 pipeline operations
    - Manual substrate edits
    - Governance proposal reviews
    - Document composition
    - Timeline restoration
    
    Provides single source of truth for work status across all workflows.
    """
    
    def __init__(self):
        if not supabase:
            raise RuntimeError("Supabase admin client required for universal work tracking")
        
        logger.info("Universal Work Tracker initialized - Canon v2.1 compliant")
    
    async def initiate_work(
        self,
        work_type: WorkType,
        payload: Dict[str, Any],
        context: WorkContext,
        priority: int = 5,
        parent_work_id: Optional[str] = None
    ) -> str:
        """
        Initiate any type of async work in YARNNN.
        
        Returns work_id for status tracking via /api/work/{work_id}/status
        
        Canon Compliance:
        - All work entries emit timeline events (Sacred Principle #4)
        - Workspace isolation maintained via context.workspace_id
        - Work orchestration serves substrate operations (Sacred Principle #3)
        """
        work_id = str(uuid4())
        
        try:
            # Create work entry in canonical queue (agent_processing_queue)  
            work_entry = {
                'id': work_id,
                'work_type': work_type,
                'work_id': work_id,  # External identifier
                'user_id': context.user_id,
                'workspace_id': context.workspace_id,
                'basket_id': context.basket_id,
                'dump_id': context.dump_id,
                'processing_state': 'pending',
                'priority': priority,
                'work_payload': payload,
                'cascade_metadata': {'parent_work_id': parent_work_id} if parent_work_id else {}
            }
            
            # Only add parent_work_id if it's a valid UUID format
            if parent_work_id and self._is_valid_uuid(parent_work_id):
                work_entry['parent_work_id'] = parent_work_id
            
            # Insert work entry
            response = supabase.table("agent_processing_queue").insert(work_entry).execute()
            
            if not response.data:
                raise RuntimeError(f"Failed to create work entry for {work_type}")
            
            # Emit timeline event (Canon Principle #4: Event-driven consistency)
            await self._emit_work_timeline_event(
                work_id=work_id,
                event_type='work_initiated',
                context=context,
                metadata={
                    'work_type': work_type,
                    'priority': priority,
                    'parent_work_id': parent_work_id
                }
            )
            
            logger.info(f"Work initiated: {work_type} with work_id={work_id}")
            return work_id
            
        except Exception as e:
            logger.error(f"Failed to initiate work {work_type}: {e}")
            raise
    
    async def get_work_status(self, work_id: str) -> WorkStatusResponse:
        """
        Get comprehensive work status from canonical queue and derived data.
        
        Canon Compliance:
        - Derives status from existing substrate and timeline data
        - Respects workspace isolation
        - Shows substrate impact metrics
        """
        try:
            # Get work entry from canonical queue
            work_response = supabase.table("agent_processing_queue").select(
                "*, claimed_at, completed_at, error_message"
            ).eq("work_id", work_id).single().execute()
            
            if not work_response.data:
                raise ValueError(f"Work not found: {work_id}")
            
            work = work_response.data
            
            # Calculate substrate impact based on work results
            substrate_impact = await self._calculate_substrate_impact(work)
            
            # Calculate cascade flow status
            cascade_flow = await self._calculate_cascade_flow(work)
            
            # Calculate progress percentage
            progress = self._calculate_progress_percentage(work)
            
            # Calculate time estimates
            estimated_completion = self._calculate_estimated_completion(work)
            
            # Format error information
            error_info = None
            if work['processing_state'] == 'failed' and work.get('error_message'):
                error_info = {
                    'code': 'PROCESSING_FAILED',
                    'message': work['error_message'],
                    'recovery_actions': self._get_recovery_actions(work['work_type'])
                }
            
            return WorkStatusResponse(
                work_id=work_id,
                work_type=work['work_type'],
                status=work['processing_state'],
                processing_stage=work.get('processing_stage'),
                progress_percentage=progress,
                basket_id=work.get('basket_id'),
                workspace_id=work['workspace_id'],
                user_id=work['user_id'],
                started_at=work['created_at'],
                last_activity=work.get('updated_at', work['created_at']),
                estimated_completion=estimated_completion,
                substrate_impact=substrate_impact,
                cascade_flow=cascade_flow,
                error=error_info
            )
            
        except Exception as e:
            logger.error(f"Failed to get work status for {work_id}: {e}")
            raise
    
    async def complete_work(
        self,
        work_id: str, 
        result: Dict[str, Any],
        processing_stage: Optional[str] = None
    ):
        """
        Mark work as completed with result data.
        
        Canon Compliance:
        - Emits timeline events for state changes
        - Triggers cascades if applicable
        - Preserves work result for status derivation
        """
        try:
            # Update work entry
            update_data = {
                'processing_state': 'completed',
                'work_result': result,
                'completed_at': datetime.now(timezone.utc).isoformat()
            }
            
            if processing_stage:
                update_data['processing_stage'] = processing_stage
            
            supabase.table("agent_processing_queue").update(update_data).eq(
                "work_id", work_id
            ).execute()
            
            # Get work context for timeline event
            work_response = supabase.table("agent_processing_queue").select(
                "work_type, user_id, workspace_id, basket_id"
            ).eq("work_id", work_id).single().execute()
            
            if work_response.data:
                work = work_response.data
                context = WorkContext(
                    user_id=work['user_id'],
                    workspace_id=work['workspace_id'],
                    basket_id=work.get('basket_id')
                )
                
                # Emit completion timeline event
                await self._emit_work_timeline_event(
                    work_id=work_id,
                    event_type='work_completed',
                    context=context,
                    metadata={
                        'work_type': work['work_type'],
                        'result_summary': result.get('summary', 'Work completed'),
                        'substrate_created': result.get('proposals_created', 0)
                    }
                )
            
            logger.info(f"Work completed: {work_id}")
            
        except Exception as e:
            logger.error(f"Failed to complete work {work_id}: {e}")
            raise
    
    async def fail_work(
        self,
        work_id: str,
        error: str,
        retry_count: Optional[int] = None
    ):
        """Mark work as failed with error details."""
        try:
            update_data = {
                'processing_state': 'failed',
                'error_message': error,
                'attempts': retry_count or 1
            }
            
            supabase.table("agent_processing_queue").update(update_data).eq(
                "work_id", work_id
            ).execute()
            
            logger.warning(f"Work failed: {work_id} - {error}")
            
        except Exception as e:
            logger.error(f"Failed to mark work as failed {work_id}: {e}")
            raise
    
    async def _calculate_substrate_impact(self, work: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate substrate impact from work results."""
        work_result = work.get('work_result', {})
        
        return {
            'proposals_created': work_result.get('proposals_created', 0),
            'substrate_created': {
                'blocks': work_result.get('blocks_created', 0),
                'context_items': work_result.get('context_items_created', 0)
            },
            'relationships_mapped': work_result.get('relationships_created', 0),
            'artifacts_generated': work_result.get('artifacts_created', 0)
        }
    
    async def _calculate_cascade_flow(self, work: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate cascade flow status for pipeline work."""
        cascade_metadata = work.get('cascade_metadata', {})
        work_type = work['work_type']
        
        # Define cascade sequences
        CASCADE_SEQUENCE = ['P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION']
        
        if work_type not in CASCADE_SEQUENCE:
            return {'active': False, 'current_stage': None, 'completed_stages': [], 'next_stage': None}
        
        current_index = CASCADE_SEQUENCE.index(work_type)
        completed_stages = CASCADE_SEQUENCE[:current_index]
        next_stage = CASCADE_SEQUENCE[current_index + 1] if current_index < len(CASCADE_SEQUENCE) - 1 else None
        
        return {
            'active': work['processing_state'] in ['processing', 'cascading'],
            'current_stage': work_type,
            'completed_stages': completed_stages,
            'next_stage': next_stage
        }
    
    def _calculate_progress_percentage(self, work: Dict[str, Any]) -> int:
        """Calculate progress percentage based on work state and type."""
        status = work['processing_state']
        work_type = work['work_type']
        
        if status == 'completed':
            return 100
        elif status == 'failed':
            return 0
        elif status == 'processing':
            # Stage-specific progress
            stage_progress_map = {
                'P1_SUBSTRATE': 30,
                'P2_GRAPH': 60, 
                'P3_REFLECTION': 80,
                'P4_COMPOSE': 90,
                'MANUAL_EDIT': 50,
                'PROPOSAL_REVIEW': 40
            }
            return stage_progress_map.get(work_type, 25)
        elif status in ['claimed', 'cascading']:
            return 10
        else:  # pending
            return 0
    
    def _calculate_estimated_completion(self, work: Dict[str, Any]) -> Optional[str]:
        """Calculate estimated completion time based on work type and queue position."""
        status = work['processing_state']
        
        if status in ['completed', 'failed']:
            return None
        
        # Historical averages per work type (in seconds)
        time_estimates = {
            'P1_SUBSTRATE': 45,
            'P2_GRAPH': 20,
            'P3_REFLECTION': 15,
            'P4_COMPOSE': 30,
            'MANUAL_EDIT': 10,
            'PROPOSAL_REVIEW': 5
        }
        
        estimated_seconds = time_estimates.get(work['work_type'], 30)
        
        if status == 'pending':
            estimated_seconds += 10  # Queue wait time
        
        return f"~{estimated_seconds}s"
    
    def _get_recovery_actions(self, work_type: str) -> List[str]:
        """Get recovery actions for failed work."""
        common_actions = ["Check error details", "Contact support if issue persists"]
        
        work_type_actions = {
            'P1_SUBSTRATE': ["Verify dump content is valid", "Check proposal schema"],
            'P2_GRAPH': ["Ensure substrate exists", "Check relationship mapping rules"],
            'P3_REFLECTION': ["Verify substrate and relationships exist"],
            'P4_COMPOSE': ["Check document template availability"],
            'MANUAL_EDIT': ["Verify permissions", "Check data format"],
            'PROPOSAL_REVIEW': ["Check proposal status", "Verify approval permissions"]
        }
        
        return work_type_actions.get(work_type, []) + common_actions
    
    async def _emit_work_timeline_event(
        self,
        work_id: str,
        event_type: str,
        context: WorkContext,
        metadata: Dict[str, Any]
    ):
        """
        Emit timeline event for work state changes.
        
        Canon Principle #4: Event-driven consistency via timeline_events
        """
        try:
            event_data = {
                'id': str(uuid4()),
                'workspace_id': context.workspace_id,
                'basket_id': context.basket_id,
                'event_type': event_type,
                'metadata': {
                    'work_id': work_id,
                    **metadata
                },
                'user_id': context.user_id
                # 'created_at': removed - table doesn't have this column, will use DB default
            }

            supabase.table("timeline_events").insert(event_data).execute()
            logger.debug(f"Timeline event emitted: {event_type} for work {work_id}")
            
        except Exception as e:
            # Timeline event failures should not break work processing
            logger.warning(f"Failed to emit timeline event for work {work_id}: {e}")
    
    def _is_valid_uuid(self, uuid_string: str) -> bool:
        """Check if string is a valid UUID format."""
        try:
            UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

# Global instance for application use
universal_work_tracker = UniversalWorkTracker()

__all__ = ["universal_work_tracker", "UniversalWorkTracker", "WorkContext", "WorkStatusResponse", "WorkType"]