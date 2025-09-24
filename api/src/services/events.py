# Governed by: /docs/YARNNN_ALERTS_NOTIFICATIONS_CANON.md (v1.0)

import json
from typing import Optional, Dict, Any
from datetime import datetime
import os
from supabase import create_client, Client
from schemas.base import AppEvent


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


class EventService:
    """Service for emitting app events to Supabase for realtime distribution."""
    
    _client: Optional[Client] = None
    
    @classmethod
    def _get_client(cls) -> Client:
        """Get or create Supabase client."""
        if cls._client is None:
            cls._client = create_client(
                os.environ["SUPABASE_URL"],
                os.environ["SUPABASE_SERVICE_ROLE_KEY"]
            )
        return cls._client
    
    @classmethod
    def emit_app_event(
        cls,
        *,
        workspace_id: str,
        type: str,
        name: str,
        message: str,
        severity: str = "info",
        phase: Optional[str] = None,
        basket_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        dedupe_key: Optional[str] = None,
        ttl_ms: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Emit an app event to the app_events table for realtime distribution.
        
        Args:
            workspace_id: Required workspace scope
            type: Event type (job_update|system_alert|action_result|collab_activity|validation)
            name: Event name (e.g., "brief.compose", "block.create")
            message: Human-readable message
            severity: Event severity (info|success|warning|error)
            phase: Optional phase for job_update events (started|progress|succeeded|failed)
            basket_id: Optional basket scope
            entity_id: Optional entity ID
            correlation_id: Optional correlation ID for request tracking
            dedupe_key: Optional deduplication key
            ttl_ms: Optional time-to-live in milliseconds
            payload: Optional additional payload data
        """
        client = cls._get_client()
        
        event_data = {
            "v": 1,
            "type": type,
            "name": name,
            "message": message,
            "severity": severity,
            "phase": phase,
            "workspace_id": workspace_id,
            "basket_id": basket_id,
            "entity_id": entity_id,
            "correlation_id": correlation_id,
            "dedupe_key": dedupe_key,
            "ttl_ms": ttl_ms,
            "payload": payload,
        }
        
        # Remove None values
        event_data = {k: v for k, v in event_data.items() if v is not None}
        
        try:
            result = client.table("app_events").insert(event_data).execute()
            if hasattr(result, 'error') and result.error:
                print(f"Failed to emit app event: {result.error}")
        except Exception as e:
            print(f"Failed to emit app event: {e}")
    
    @classmethod
    def emit_job_started(
        cls,
        workspace_id: str,
        job_id: str,
        job_name: str,
        message: str,
        basket_id: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> None:
        """Emit a job_update.started event."""
        cls.emit_app_event(
            workspace_id=workspace_id,
            type="job_update",
            name=job_name,
            phase="started",
            severity="info",
            message=message,
            basket_id=basket_id,
            correlation_id=correlation_id,
            dedupe_key=f"{job_name}:{job_id}",
            payload={"job_id": job_id}
        )
    
    @classmethod
    def emit_job_succeeded(
        cls,
        workspace_id: str,
        job_id: str,
        job_name: str,
        message: str,
        basket_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None
    ) -> None:
        """Emit a job_update.succeeded event."""
        cls.emit_app_event(
            workspace_id=workspace_id,
            type="job_update",
            name=job_name,
            phase="succeeded",
            severity="success",
            message=message,
            basket_id=basket_id,
            correlation_id=correlation_id,
            dedupe_key=f"{job_name}:{job_id}",
            payload={"job_id": job_id, **(payload or {})}
        )
    
    @classmethod
    def emit_job_failed(
        cls,
        workspace_id: str,
        job_id: str,
        job_name: str,
        message: str,
        basket_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        error: Optional[str] = None
    ) -> None:
        """Emit a job_update.failed event."""
        cls.emit_app_event(
            workspace_id=workspace_id,
            type="job_update",
            name=job_name,
            phase="failed",
            severity="error",
            message=message,
            basket_id=basket_id,
            correlation_id=correlation_id,
            dedupe_key=f"{job_name}:{job_id}",
            payload={"job_id": job_id, "error": error} if error else {"job_id": job_id}
        )
