from typing import Any, Dict, List, Tuple


def extract_graph_from_worker_output(out) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    ctx: List[Dict[str, Any]] = []
    rel: List[Dict[str, Any]] = []
    bl: List[Dict[str, Any]] = []
    for ch in getattr(out, "changes", []) or []:
        t = ch.get("type")
        p = ch.get("payload", {})
        if t == "context_item":
            ctx.append({
                "basket_id": ch["basket_id"],
                "raw_dump_id": ch.get("raw_dump_id"),
                "type": p["type"],
                "title": p["title"],
                "metadata": p.get("metadata", {}),
            })
        elif t == "relationship":
            rel.append({
                "basket_id": ch["basket_id"],
                "from_type": p["from_type"],
                "from_id": p["from_id"],
                "to_type": p["to_type"],
                "to_id": p["to_id"],
                "relationship_type": p["relationship_type"],
                "strength": p.get("strength", 0.5),
            })
        elif t == "block" and p.get("semantic_type") in ("theme", "concept"):
            bl.append({
                "basket_id": ch["basket_id"],
                "semantic_type": p["semantic_type"],
                "title": p.get("title"),
                "content": p.get("content"),
                "raw_dump_id": ch.get("raw_dump_id"),
                "metadata": p.get("metadata", {}),
            })
    # fallback to out.metadata['report'] if needed…
    return ctx, rel, bl
