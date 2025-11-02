import json
from typing import Optional
from datetime import datetime

class EventRepository:
    """Handles event publishing and retrieval"""
    
    def __init__(self, db):
        self.db = db
    
    async def publish_event(self, event_type: str, payload: dict, basket_id: str = None, workspace_id: str = None, actor_id: str = None) -> None:
        """Publish an event to the events table (migrated from basket_events)"""
        query = """
            INSERT INTO events (kind, payload, basket_id, workspace_id, origin, actor_id, ts)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        await self.db.execute(
            query,
            values=[
                event_type, 
                json.dumps(payload), 
                basket_id,
                workspace_id,
                "system",  # Python backend events are system-originated
                actor_id,
                datetime.utcnow()
            ]
        )
    
    async def get_recent_events(self, basket_id: str, limit: int = 100) -> list:
        """Get recent events for a basket (migrated from basket_events to events)"""
        query = """
            SELECT * FROM events 
            WHERE basket_id = $1
            ORDER BY ts DESC
            LIMIT $2
        """
        results = await self.db.fetch_all(query, values=[basket_id, limit])
        return [dict(row) for row in results]