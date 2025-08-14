import os
import sys
from uuid import uuid4
from typing import Union

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketChangeRequest, BasketDelta
from services.clock import now_iso
from services.worker_adapter import WorkerAgentAdapter, WorkerOutputAggregator
from services.substrate_diff import compute_deltas, apply_deltas

# Import the new schema
try:
    from app.baskets.schemas import BasketWorkRequest
except ImportError:
    # Fallback for backward compatibility
    BasketWorkRequest = None


async def run_manager_plan(
    db, req: Union[BasketWorkRequest, BasketChangeRequest], workspace_id: str
) -> BasketDelta:
    """
    Manager Agent Orchestration with dual-mode support.
    
    Handles both init_build (first ingest) and evolve_turn (incremental) modes.
    """
    
    # Determine mode and convert request format
    if BasketWorkRequest and isinstance(req, BasketWorkRequest):
        return await _run_work_request(db, req, workspace_id)
    else:
        # Legacy BasketChangeRequest - default to init_build behavior
        return await _run_legacy_request(db, req, workspace_id)


async def _run_work_request(
    db, req: BasketWorkRequest, workspace_id: str
) -> BasketDelta:
    """Handle new BasketWorkRequest with explicit mode."""
    
    if req.mode == "init_build":
        return await _init_build(db, req, workspace_id)
    elif req.mode == "evolve_turn":
        return await _evolve_turn(db, req, workspace_id)
    else:
        raise ValueError(f"Unknown work mode: {req.mode}")


async def _run_legacy_request(
    db, req: BasketChangeRequest, workspace_id: str
) -> BasketDelta:
    """Handle legacy BasketChangeRequest - uses current logic."""
    
    # Convert to basket_id for compatibility
    basket_id = req.basket_id

    try:
        print(f"🤖 Manager (legacy) orchestrating workers for basket {basket_id}")

        # STEP 1: Call real worker agents in parallel
        worker_outputs = []

        # Call InfraBasketAnalyzerAgent
        print("  📊 Calling InfraBasketAnalyzerAgent...")
        analyzer_output = await WorkerAgentAdapter.call_basket_analyzer(
            basket_id=basket_id,
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
            basket_id=basket_id,
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
            basket_id=basket_id,
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
            basket_id=basket_id,
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


async def _init_build(db, req: BasketWorkRequest, workspace_id: str) -> BasketDelta:
    """
    Initialize basket with fresh substrate from raw sources.
    
    This is the 'first ingest' mode - interprets dumps, creates substrate,
    persists everything, and promotes basket to ACTIVE.
    """
    print(f"🆕 Init build mode for workspace {workspace_id}")
    
    # Get basket_id from sources or workspace - simplified for now
    basket_id = workspace_id  # TODO: Proper basket resolution
    
    try:
        # Step 1: Process raw sources into substrate
        print("  📊 Processing raw sources...")
        raw_dumps = [s for s in req.sources if s.type == "raw_dump"]
        text_sources = [s for s in req.sources if s.type == "text"]
        
        # Step 2: Call dump interpreter agents
        substrate_components = {
            "raw_dumps": [],
            "blocks": {},
            "context_items": {},
            "documents": {},
            "links": []
        }
        
        # Process each source
        for source in raw_dumps:
            # TODO: Call actual dump interpreter
            substrate_components["raw_dumps"].append(source.id)
            
        for source in text_sources:
            # TODO: Process text directly
            pass
        
        # Step 3: Persist substrate to DB
        print("  💾 Persisting substrate...")
        # TODO: Use substrate_ops to persist
        
        # Step 4: Emit events
        from app.event_bus import emit
        await emit("ingest.completed", {
            "basket_id": basket_id,
            "workspace_id": workspace_id,
            "req_id": req.options.trace_req_id,
            "counts": {
                "raw_dumps": len(substrate_components["raw_dumps"]),
                "blocks": len(substrate_components["blocks"]),
                "documents": len(substrate_components["documents"])
            }
        })
        
        # Return BasketDelta format for init_build
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=basket_id,
            summary=f"Initialized basket with {len(substrate_components['raw_dumps'])} sources",
            changes=[],  # TODO: Convert substrate_components to EntityChange objects
            recommended_actions=[],
            explanations=[{"by": "manager", "text": "Initial substrate build completed"}],
            confidence=0.9,
            created_at=now_iso(),
        )
        
    except Exception as e:
        print(f"  ❌ Init build failed: {e}")
        raise


async def _evolve_turn(db, req: BasketWorkRequest, workspace_id: str) -> BasketDelta:
    """
    Evolve existing basket with new sources.
    
    Loads existing substrate, cross-analyzes with new sources,
    computes deltas, and persists via substrate_ops.
    """
    print(f"🔄 Evolve turn mode for workspace {workspace_id}")
    
    # Get basket_id from workspace - simplified for now  
    basket_id = workspace_id  # TODO: Proper basket resolution
    
    try:
        # Step 1: Load existing substrate
        print("  📋 Loading existing substrate...")
        # TODO: Load from DB
        existing_substrate = {
            "blocks": {},
            "documents": {},
            "context_items": {}
        }
        
        # Step 2: Process new sources
        print("  🆕 Processing new sources...")
        new_substrate = {
            "blocks": {},
            "documents": {},
            "context_items": {}
        }
        
        # Step 3: Compute deltas
        print("  🔍 Computing deltas...")
        deltas = compute_deltas(
            existing_substrate, 
            new_substrate, 
            req.policy.model_dump()
        )
        
        # Step 4: Apply deltas
        print("  ✅ Applying deltas...")
        delta_stats = apply_deltas(deltas)
        
        # Step 5: Emit events
        from app.event_bus import emit
        await emit("evolve.completed", {
            "basket_id": basket_id,
            "workspace_id": workspace_id,
            "req_id": req.options.trace_req_id,
            "delta_stats": delta_stats
        })
        
        # Step 6: Generate summary
        summary_parts = []
        if delta_stats["blocks_added"]:
            summary_parts.append(f"Added {delta_stats['blocks_added']} blocks")
        if delta_stats["blocks_updated"]:
            summary_parts.append(f"Updated {delta_stats['blocks_updated']} blocks")
        if delta_stats["documents_updated"]:
            summary_parts.append(f"Updated {delta_stats['documents_updated']} documents")
            
        summary = "; ".join(summary_parts) if summary_parts else "No changes applied"
        
        # Return BasketDelta format for evolve_turn
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=basket_id,
            summary=summary,
            changes=[],  # TODO: Convert deltas to EntityChange objects
            recommended_actions=[],
            explanations=[{"by": "manager", "text": f"Evolution completed with {delta_stats['total_operations']} operations"}],
            confidence=0.85,
            created_at=now_iso(),
        )
        
    except Exception as e:
        print(f"  ❌ Evolve turn failed: {e}")
        raise
