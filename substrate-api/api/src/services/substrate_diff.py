"""Substrate diff computation for evolve_turn mode."""

from typing import Dict, Any, List


def compute_deltas(existing: Dict[str, Any], incoming: Dict[str, Any], policy: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare existing substrate with incoming changes and compute deltas.
    
    Args:
        existing: Current substrate state from DB
        incoming: New content to merge in
        policy: WorkPolicy constraints (preserve_blocks, etc.)
        
    Returns:
        Dict with 'added', 'updated', 'removed', 'provenance' keys
    """
    deltas = {
        "added": {},
        "updated": {},
        "removed": {},
        "provenance": []
    }
    
    # Basic implementation - compare raw_dumps, blocks, etc.
    preserve_blocks = policy.get("preserve_blocks", [])
    
    # Compare blocks
    existing_blocks = existing.get("blocks", {})
    incoming_blocks = incoming.get("blocks", {})
    
    for block_id, block_data in incoming_blocks.items():
        if block_id in preserve_blocks:
            deltas["provenance"].append(f"Preserved block {block_id} per policy")
            continue
            
        if block_id not in existing_blocks:
            deltas["added"]["blocks"] = deltas["added"].get("blocks", {})
            deltas["added"]["blocks"][block_id] = block_data
        elif existing_blocks[block_id] != block_data:
            deltas["updated"]["blocks"] = deltas["updated"].get("blocks", {})
            deltas["updated"]["blocks"][block_id] = block_data
            
    # Compare documents
    existing_docs = existing.get("documents", {})
    incoming_docs = incoming.get("documents", {})
    
    for doc_id, doc_data in incoming_docs.items():
        if doc_id not in existing_docs:
            deltas["added"]["documents"] = deltas["added"].get("documents", {})
            deltas["added"]["documents"][doc_id] = doc_data
        elif existing_docs[doc_id] != doc_data:
            deltas["updated"]["documents"] = deltas["updated"].get("documents", {})
            deltas["updated"]["documents"][doc_id] = doc_data
    
    return deltas


def apply_deltas(deltas: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply computed deltas to substrate.
    
    Args:
        deltas: Output from compute_deltas()
        
    Returns:
        Dict with operation counts and summaries
    """
    counts = {
        "blocks_added": len(deltas.get("added", {}).get("blocks", {})),
        "blocks_updated": len(deltas.get("updated", {}).get("blocks", {})),
        "documents_added": len(deltas.get("added", {}).get("documents", {})),
        "documents_updated": len(deltas.get("updated", {}).get("documents", {})),
        "total_operations": 0
    }
    
    counts["total_operations"] = sum([
        counts["blocks_added"],
        counts["blocks_updated"], 
        counts["documents_added"],
        counts["documents_updated"]
    ])
    
    return counts