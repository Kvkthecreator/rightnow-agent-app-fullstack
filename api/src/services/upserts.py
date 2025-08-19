async def upsert_context_items(db, items):
    for it in items:
        await db.table("context_items").upsert({
            "basket_id": it["basket_id"],
            "raw_dump_id": it.get("raw_dump_id"),
            "type": it["type"],
            "title": it["title"],
            "metadata": it.get("metadata", {}),
            "status": "active",
        }, on_conflict=["basket_id","raw_dump_id","type","title"])

async def upsert_relationships(db, edges):
    for e in edges:
        await db.table("substrate_relationships").upsert({
            "basket_id": e["basket_id"],
            "from_type": e["from_type"],
            "from_id": e["from_id"],
            "to_type": e["to_type"],
            "to_id": e["to_id"],
            "relationship_type": e["relationship_type"],
            "strength": e.get("strength", 0.5),
        }, on_conflict=["basket_id","from_type","from_id","to_type","to_id","relationship_type"])

async def upsert_blocks(db, blocks):
    for b in blocks:
        await db.table("blocks").upsert({
            "basket_id": b["basket_id"],
            "semantic_type": b["semantic_type"],
            "title": b.get("title"),
            "content": b.get("content"),
            "raw_dump_id": b.get("raw_dump_id"),
            "metadata": b.get("metadata", {}),
            "state": "PROPOSED",
        }, on_conflict=["basket_id","semantic_type","title"])
