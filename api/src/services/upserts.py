# ruff: noqa

# V3.0: upsert_context_items removed - context_items table merged into blocks
# Entities are now blocks with semantic_type='entity'

async def upsert_relationships(db, edges):
    for e in edges:
        await db.rpc('fn_relationship_upsert', {
            "p_basket_id": e["basket_id"],
            "p_from_type": e["from_type"],
            "p_from_id": e["from_id"],
            "p_to_type": e["to_type"],
            "p_to_id": e["to_id"],
            "p_relationship_type": e["relationship_type"],
            "p_description": e.get("description"),
            "p_strength": e.get("strength", 0.5),
        })

async def upsert_blocks(db, blocks):
    for b in blocks:
        await db.rpc('fn_block_create', {
            "p_basket_id": b["basket_id"],
            "p_workspace_id": b.get("workspace_id"),
            "p_title": b.get("title"),
            "p_body_md": b.get("content"),
        })
