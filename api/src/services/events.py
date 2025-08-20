import json

async def publish_event(db, event_type: str, payload: dict, basket_id: str = None, workspace_id: str = None, actor_id: str = None):
    # Migrated from basket_events to canonical events table
    query = """
        INSERT INTO events (kind, payload, basket_id, workspace_id, origin, actor_id, ts)
        VALUES (:kind, :payload, :basket_id, :workspace_id, :origin, :actor_id, NOW())
    """
    await db.execute(query, {
        "kind": event_type,
        "payload": json.dumps(payload),
        "basket_id": basket_id,
        "workspace_id": workspace_id,
        "origin": "system",
        "actor_id": actor_id
    })
