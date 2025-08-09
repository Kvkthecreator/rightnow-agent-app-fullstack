async def publish_event(db, event_type: str, payload: dict) -> None:
    await db.execute("SELECT pg_notify('bus_any', $1)", [event_type])
