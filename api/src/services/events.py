import json

async def publish_event(db, event_type: str, payload: dict):
    # Use Supabase Realtime broadcast instead of pg_notify for frontend compatibility
    # For now, just write to an events table that Supabase can observe
    query = """
        INSERT INTO basket_events (event_type, payload, created_at)
        VALUES (:event_type, :payload, NOW())
    """
    await db.execute(query, {
        "event_type": event_type,
        "payload": json.dumps(payload)
    })
