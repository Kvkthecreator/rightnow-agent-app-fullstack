import os
import sys
from uuid import uuid4
from typing import Union

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketChangeRequest, BasketDelta, EntityChangeBlock, EntityChangeDocument
from services.clock import now_iso
from services.worker_adapter import WorkerAgentAdapter, WorkerOutputAggregator
from services.substrate_diff import compute_deltas, apply_deltas
from services.substrate_ops import SubstrateOps
from services.interpretation_adapter import extract_graph_from_worker_output
from services.upserts import upsert_context_items, upsert_relationships, upsert_blocks

# Import the new schema
try:
    from app.baskets.schemas import BasketWorkRequest
except ImportError:
    # Fallback for backward compatibility
    BasketWorkRequest = None


async def run_manager_plan(
    db, basket_id: str, req: Union[BasketWorkRequest, BasketChangeRequest], workspace_id: str
) -> BasketDelta:
    """
    Manager Agent Orchestration with dual-mode support.
    
    Handles both init_build (first ingest) and evolve_turn (incremental) modes.
    """
    
    if isinstance(req, dict) and req.get("focus") == "interpretation":
        out = await WorkerAgentAdapter.call_basket_analyzer(basket_id=basket_id, workspace_id=workspace_id, focus_dump_id=req.get("dump_id"))
        ci, rel, bl = extract_graph_from_worker_output(out)
        await upsert_context_items(db, ci)
        await upsert_relationships(db, rel)
        if bl:
            await upsert_blocks(db, bl)
        return {"status": "ok", "focus": "interpretation"}

    # Determine mode and convert request format
    if BasketWorkRequest and isinstance(req, BasketWorkRequest):
        return await _run_work_request(db, basket_id, req, workspace_id)
    else:
        # Legacy BasketChangeRequest - default to init_build behavior
        return await _run_legacy_request(db, basket_id, req, workspace_id)


async def _run_work_request(
    db, basket_id: str, req: BasketWorkRequest, workspace_id: str
) -> BasketDelta:
    """Handle new BasketWorkRequest with explicit mode."""
    
    if req.mode == "init_build":
        return await _init_build(db, basket_id, req, workspace_id)
    elif req.mode == "evolve_turn":
        return await _evolve_turn(db, basket_id, req, workspace_id)
    else:
        raise ValueError(f"Unknown work mode: {req.mode}")


async def _run_legacy_request(
    db, basket_id: str, req: BasketChangeRequest, workspace_id: str
) -> BasketDelta:
    """Handle legacy BasketChangeRequest - uses current logic."""
    
    # Use the passed basket_id parameter instead of req.basket_id

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


async def _init_build(db, basket_id: str, req: BasketWorkRequest, workspace_id: str) -> BasketDelta:
    """
    Initialize basket with fresh substrate from raw sources.
    
    This is the 'first ingest' mode - interprets dumps, creates substrate,
    persists everything, and promotes basket to ACTIVE.
    """
    print(f"🆕 Init build mode for basket {basket_id} in workspace {workspace_id}")
    
    try:
        # Step 1: Process raw sources into substrate
        print("  📊 Processing raw sources...")
        raw_dumps = [s for s in req.sources if s.type == "raw_dump"]
        text_sources = [s for s in req.sources if s.type == "text"]
        
        changes = []
        created_blocks = []
        created_docs = []
        
        # Step 2: Process each raw dump source
        for source in raw_dumps:
            # Get the actual dump content
            dump_content = await SubstrateOps.get_raw_dump_content(source.id)
            if not dump_content:
                print(f"  ⚠️ No content found for dump {source.id}")
                continue
                
            # Create context blocks from dump content
            # Split content into reasonable chunks for blocks
            chunk_size = 2000
            chunks = [dump_content[i:i+chunk_size] for i in range(0, len(dump_content), chunk_size)]
            
            for idx, chunk in enumerate(chunks):
                block_id, version = await SubstrateOps.create_context_block(
                    basket_id=basket_id,
                    content=chunk,
                    source_id=source.id,
                    workspace_id=workspace_id,
                    metadata={
                        "chunk_index": idx,
                        "total_chunks": len(chunks),
                        "source_type": "raw_dump"
                    }
                )
                
                created_blocks.append(block_id)
                
                # Add real entity change
                changes.append(EntityChangeBlock(
                    entity="context_block",
                    id=block_id,
                    from_version=None,
                    to_version=version,
                    diff=f"Created from raw dump {source.id} (chunk {idx+1}/{len(chunks)})"
                ))
                
            print(f"  ✓ Created {len(chunks)} blocks from dump {source.id}")
        
        # Step 3: Create an initial analysis document if we have content
        if created_blocks:
            doc_title = f"Initial Analysis - Basket {basket_id[:8]}"
            doc_content = f"This basket contains {len(created_blocks)} context blocks created from {len(raw_dumps)} raw dumps."
            
            doc_id, doc_version = await SubstrateOps.create_document(
                basket_id=basket_id,
                title=doc_title,
                content=doc_content,
                source_ids=[s.id for s in raw_dumps],
                workspace_id=workspace_id,
                doc_type="analysis"
            )
            
            created_docs.append(doc_id)
            
            changes.append(EntityChangeDocument(
                entity="document",
                id=doc_id,
                from_version=None,
                to_version=doc_version,
                diff="Initial analysis document created"
            ))
            
            print(f"  ✓ Created analysis document {doc_id}")
        
        # Step 4: Emit events
        from app.event_bus import emit
        await emit("ingest.completed", {
            "basket_id": basket_id,
            "workspace_id": workspace_id,
            "req_id": req.options.trace_req_id,
            "counts": {
                "raw_dumps": len(raw_dumps),
                "blocks": len(created_blocks),
                "documents": len(created_docs)
            }
        })
        
        # Return BasketDelta format for init_build
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=basket_id,
            summary=f"Initialized basket with {len(created_blocks)} blocks from {len(raw_dumps)} sources",
            changes=changes,
            recommended_actions=[],
            explanations=[{"by": "manager", "text": f"Created {len(created_blocks)} context blocks and {len(created_docs)} documents"}],
            confidence=0.9,
            created_at=now_iso(),
        )
        
    except Exception as e:
        print(f"  ❌ Init build failed: {e}")
        raise


async def _evolve_turn(db, basket_id: str, req: BasketWorkRequest, workspace_id: str) -> BasketDelta:
    """
    Evolve existing basket with new sources.
    
    Loads existing substrate, cross-analyzes with new sources,
    computes deltas, and persists via substrate_ops.
    """
    print(f"🔄 Evolve turn mode for basket {basket_id} in workspace {workspace_id}")
    
    try:
        # Step 1: Load existing substrate
        print("  📋 Loading existing substrate...")
        existing_substrate = await SubstrateOps.load_basket_substrate(basket_id)
        print(f"  ✓ Loaded {len(existing_substrate['blocks'])} blocks, {len(existing_substrate['documents'])} documents")
        
        # Step 2: Process new sources
        print("  🆕 Processing new sources...")
        raw_dumps = [s for s in req.sources if s.type == "raw_dump"]
        
        changes = []
        new_blocks = []
        updated_blocks = []
        
        # Process each new source
        for source in raw_dumps:
            dump_content = await SubstrateOps.get_raw_dump_content(source.id)
            if not dump_content:
                continue
                
            # Check policy for what we can update
            preserve_blocks = req.policy.preserve_blocks or []
            
            # For evolve, we might update existing blocks or create new ones
            # Simple strategy: create new blocks for new content
            chunk_size = 2000
            chunks = [dump_content[i:i+chunk_size] for i in range(0, len(dump_content), chunk_size)]
            
            for idx, chunk in enumerate(chunks):
                # Check if we should update an existing block or create new
                # For now, always create new blocks in evolve mode
                block_id, version = await SubstrateOps.create_context_block(
                    basket_id=basket_id,
                    content=chunk,
                    source_id=source.id,
                    workspace_id=workspace_id,
                    metadata={
                        "evolution_turn": True,
                        "source_type": "raw_dump",
                        "chunk_index": idx
                    }
                )
                
                new_blocks.append(block_id)
                
                changes.append(EntityChangeBlock(
                    entity="context_block",
                    id=block_id,
                    from_version=None,
                    to_version=version,
                    diff=f"Added from new source {source.id}"
                ))
        
        # Step 3: Update existing blocks if policy allows
        if req.policy.allow_structural_changes and not preserve_blocks:
            # Example: Update first existing block with summary of new content
            existing_block_ids = list(existing_substrate["blocks"].keys())
            if existing_block_ids and new_blocks:
                first_block = existing_substrate["blocks"][existing_block_ids[0]]
                try:
                    new_version = await SubstrateOps.update_context_block(
                        block_id=first_block["id"],
                        content=first_block["content"] + f"\n\n[Updated with {len(new_blocks)} new blocks]",
                        from_version=first_block["version"]
                    )
                    
                    updated_blocks.append(first_block["id"])
                    
                    changes.append(EntityChangeBlock(
                        entity="context_block",
                        id=first_block["id"],
                        from_version=first_block["version"],
                        to_version=new_version,
                        diff="Updated with evolution summary"
                    ))
                except Exception as e:
                    print(f"  ⚠️ Failed to update block: {e}")
        
        # Step 4: Emit events
        from app.event_bus import emit
        await emit("evolve.completed", {
            "basket_id": basket_id,
            "workspace_id": workspace_id,
            "req_id": req.options.trace_req_id,
            "delta_stats": {
                "blocks_added": len(new_blocks),
                "blocks_updated": len(updated_blocks),
                "documents_updated": 0,
                "total_operations": len(new_blocks) + len(updated_blocks)
            }
        })
        
        # Generate summary
        summary_parts = []
        if new_blocks:
            summary_parts.append(f"Added {len(new_blocks)} blocks")
        if updated_blocks:
            summary_parts.append(f"Updated {len(updated_blocks)} blocks")
            
        summary = "; ".join(summary_parts) if summary_parts else "No changes applied"
        
        # Return BasketDelta format for evolve_turn
        return BasketDelta(
            delta_id=str(uuid4()),
            basket_id=basket_id,
            summary=summary,
            changes=changes,
            recommended_actions=[],
            explanations=[{"by": "manager", "text": f"Evolution completed: {len(new_blocks)} new blocks, {len(updated_blocks)} updated"}],
            confidence=0.85,
            created_at=now_iso(),
        )
        
    except Exception as e:
        print(f"  ❌ Evolve turn failed: {e}")
        raise
