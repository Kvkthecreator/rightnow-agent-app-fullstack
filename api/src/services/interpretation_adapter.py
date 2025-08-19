from typing import Any, Dict, List, Tuple


def extract_graph_from_worker_output(out) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    ctx: List[Dict[str, Any]] = []
    rel: List[Dict[str, Any]] = []
    bl: List[Dict[str, Any]] = []
    for ch in getattr(out, "changes", []) or []:
        # Support both dict-based and pydantic-model changes
        if not isinstance(ch, dict):
            if hasattr(ch, "model_dump"):
                ch = ch.model_dump()
            elif hasattr(ch, "dict"):
                ch = ch.dict()
            else:
                continue
        t = ch.get("type") or ch.get("entity")
        p = ch.get("payload", {})
        if t == "context_item":
            ctx.append({
                "basket_id": ch.get("basket_id"),
                "raw_dump_id": ch.get("raw_dump_id"),
                "type": p.get("type"),
                "title": p.get("title"),
                "metadata": p.get("metadata", {}),
            })
        elif t == "relationship":
            rel.append({
                "basket_id": ch.get("basket_id"),
                "from_type": p.get("from_type"),
                "from_id": p.get("from_id"),
                "to_type": p.get("to_type"),
                "to_id": p.get("to_id"),
                "relationship_type": p.get("relationship_type"),
                "strength": p.get("strength", 0.5),
            })
        elif t in ("block", "context_block") and p.get("semantic_type") in ("theme", "concept"):
            bl.append({
                "basket_id": ch.get("basket_id"),
 
                "title": p.get("title"),
                "content": p.get("content"),
                "raw_dump_id": ch.get("raw_dump_id"),
                "metadata": p.get("metadata", {}),
            })
    # fallback to out.metadata['report'] if needed…
    return ctx, rel, bl
