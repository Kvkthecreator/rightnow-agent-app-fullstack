import json
from typing import Optional
from datetime import datetime

class EventRepository:
    """Handles event publishing and retrieval"""
    
    def __init__(self, db):
        self.db = db
    
    async def publish_event(self, event_type: str, payload: dict) -> None:
        """Publish an event to the basket_events table for Supabase Realtime"""
        query = """
            INSERT INTO basket_events (event_type, payload, created_at)
            VALUES ($1, $2, $3)
        """
        await self.db.execute(
            query,
            values=[event_type, json.dumps(payload), datetime.utcnow()]
        )
    
    async def get_recent_events(self, basket_id: str, limit: int = 100) -> list:
        """Get recent events for a basket"""
        query = """
            SELECT * FROM basket_events 
            WHERE payload->>'basket_id' = $1
            ORDER BY created_at DESC
            LIMIT $2
        """
        results = await self.db.fetch_all(query, values=[basket_id, limit])
        return [dict(row) for row in results]