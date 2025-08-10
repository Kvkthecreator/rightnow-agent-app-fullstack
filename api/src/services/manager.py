import sys
import os
from uuid import uuid4
from typing import List

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketChangeRequest, EntityChangeBlock
from services.clock import now_iso
from services.worker_adapter import WorkerAgentAdapter, WorkerOutputAggregator

class PlanResult:
    def __init__(self, delta_id, summary, changes, recommended_actions, explanations, confidence):
        self.delta_id = delta_id
        self.summary = summary
        self.changes = changes
        self.recommended_actions = recommended_actions
        self.explanations = explanations
        self.confidence = confidence

async def run_manager_plan(db, req: BasketChangeRequest) -> PlanResult:
    """
    REAL Manager Agent Orchestration - No more fake data!
    
    This coordinates actual worker agents and aggregates their real analysis.
    """
    
    try:
        # Extract workspace_id from database or context (simplified for now)
        workspace_id = "default-workspace"  # TODO: Extract from auth context
        
        print(f"🤖 Manager orchestrating workers for basket {req.basket_id}")
        
        # STEP 1: Call real worker agents in parallel
        worker_outputs = []
        
        # Call InfraBasketAnalyzerAgent
        print("  📊 Calling InfraBasketAnalyzerAgent...")
        analyzer_output = await WorkerAgentAdapter.call_basket_analyzer(
            basket_id=req.basket_id,
            workspace_id=workspace_id,
            sources=req.sources or [],
            context=req.user_context
        )
        worker_outputs.append(analyzer_output)
        print(f"    ✓ Analysis complete: {len(analyzer_output.changes)} changes, confidence: {analyzer_output.confidence}")
        
        # Call TasksDocumentComposerAgent  
        print("  📝 Calling TasksDocumentComposerAgent...")
        composer_output = await WorkerAgentAdapter.call_document_composer(
            basket_id=req.basket_id,
            workspace_id=workspace_id,
            analysis_result=analyzer_output
        )
        worker_outputs.append(composer_output)
        print(f"    ✓ Composition complete: {len(composer_output.changes)} changes, confidence: {composer_output.confidence}")
        
        # STEP 2: Aggregate worker outputs
        print("  🔄 Aggregating worker outputs...")
        aggregated = WorkerOutputAggregator.aggregate_outputs(worker_outputs)
        
        # STEP 3: Manager-level analysis and conflict resolution
        print("  🧠 Manager analyzing aggregated results...")
        
        # Add manager's own analysis
        manager_explanation = {
            "by": "manager", 
            "text": f"Orchestrated {len(worker_outputs)} agents: {', '.join(w.agent_name for w in worker_outputs)}"
        }
        aggregated["explanations"].append(manager_explanation)
        
        # Apply manager-level conflict resolution if needed
        final_changes = resolve_change_conflicts(aggregated["changes"])
        
        # Calculate final confidence with manager adjustment
        final_confidence = min(aggregated["confidence"] * 0.9, 1.0)  # Slight manager conservatism
        
        print(f"  ✅ Manager plan complete: {len(final_changes)} final changes, confidence: {final_confidence}")
        
        return PlanResult(
            delta_id=str(uuid4()),
            summary=aggregated["summary"],
            changes=final_changes,
            recommended_actions=aggregated["recommended_actions"],
            explanations=aggregated["explanations"], 
            confidence=final_confidence
        )
        
    except Exception as e:
        print(f"  ❌ Manager orchestration failed: {e}")
        
        # Fallback to minimal safe response
        return PlanResult(
            delta_id=str(uuid4()),
            summary=f"Manager analysis partially completed (error: {str(e)[:50]}...)",
            changes=[],
            recommended_actions=[],
            explanations=[
                {"by": "manager", "text": f"Orchestration encountered issues: {str(e)}"},
                {"by": "manager", "text": "Safe fallback applied - no changes proposed"}
            ],
            confidence=0.2
        )


def resolve_change_conflicts(changes: List) -> List:
    """
    Manager-level conflict resolution for worker agent changes.
    
    This is where the Manager Agent adds value beyond individual workers.
    """
    
    # Simple conflict resolution for now
    # TODO: Implement sophisticated conflict detection and resolution
    
    # Remove duplicate changes (same entity + id)
    seen_changes = set()
    resolved_changes = []
    
    for change in changes:
        change_key = (change.entity, change.id)
        if change_key not in seen_changes:
            seen_changes.add(change_key)
            resolved_changes.append(change)
    
    # TODO: Add more sophisticated conflict resolution:
    # - Version conflicts (same entity, different versions)
    # - Logical conflicts (incompatible changes)
    # - Priority-based resolution (trust certain agents more)
    
    return resolved_changes
