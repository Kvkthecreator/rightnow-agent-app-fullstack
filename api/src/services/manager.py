import os
import sys
from uuid import uuid4

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketChangeRequest, BasketDelta
from services.clock import now_iso
from services.worker_adapter import WorkerAgentAdapter, WorkerOutputAggregator


async def run_manager_plan(
    db, req: BasketChangeRequest, workspace_id: str
) -> BasketDelta:
    """
    REAL Manager Agent Orchestration - No more fake data!

    This coordinates actual worker agents and aggregates their real analysis.
    """

    try:
        print(f"🤖 Manager orchestrating workers for basket {req.basket_id}")

        # STEP 1: Call real worker agents in parallel
        worker_outputs = []

        # Call InfraBasketAnalyzerAgent
        print("  📊 Calling InfraBasketAnalyzerAgent...")
        analyzer_output = await WorkerAgentAdapter.call_basket_analyzer(
            basket_id=req.basket_id,
            workspace_id=workspace_id,
            sources=req.sources or [],
            context=req.user_context,
        )
        worker_outputs.append(analyzer_output)
        print(
            "    ✓ Analysis complete: "
            f"{len(analyzer_output.changes)} changes, confidence: {analyzer_output.confidence}"
        )

        # Call TasksDocumentComposerAgent
        print("  📝 Calling TasksDocumentComposerAgent...")
        composer_output = await WorkerAgentAdapter.call_document_composer(
            basket_id=req.basket_id,
            workspace_id=workspace_id,
            analysis_result=analyzer_output,
        )
        worker_outputs.append(composer_output)
        print(
            "    ✓ Composition complete: "
            f"{len(composer_output.changes)} changes, confidence: {composer_output.confidence}"
        )

        # STEP 2: Aggregate worker outputs
        print("  🔄 Aggregating worker outputs...")
        aggregated = WorkerOutputAggregator.aggregate_outputs(worker_outputs)

        # STEP 3: Manager-level analysis and conflict resolution
        print("  🧠 Manager analyzing aggregated results...")

        # Add manager's own analysis
        manager_explanation = {
            "by": "manager",
            "text": (
                "Orchestrated "
                f"{len(worker_outputs)} agents: {', '.join(w.agent_name for w in worker_outputs)}"
            ),
        }
        aggregated["explanations"].append(manager_explanation)

        # Apply manager-level conflict resolution if needed
        final_changes = resolve_change_conflicts(aggregated["changes"])

        # Calculate final confidence with manager adjustment
        final_confidence = min(
            aggregated["confidence"] * 0.9, 1.0
        )  # Slight manager conservatism

        print(
            "  ✅ Manager plan complete: "
            f"{len(final_changes)} final changes, confidence: {final_confidence}"
        )

        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=req.basket_id,
            summary=aggregated["summary"],
            changes=final_changes,
            recommended_actions=aggregated.get("recommended_actions", []),
            explanations=aggregated.get("explanations", []),
            confidence=final_confidence,
            created_at=now_iso(),
        )

    except Exception as e:
        print(f"  ❌ Manager orchestration failed: {e}")

        # Fallback to error delta
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=req.basket_id,
            summary=f"Processing failed: {str(e)}",
            changes=[],
            recommended_actions=[],
            explanations=[{"by": "manager", "text": str(e)}],
            confidence=0.0,
            created_at=now_iso(),
        )


def resolve_change_conflicts(changes: list) -> list:
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
