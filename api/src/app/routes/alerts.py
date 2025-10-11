from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..utils.jwt import verify_jwt
from ..utils.supabase import supabase_admin
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/alerts", tags=["alerts"])

UNASSIGNED_THRESHOLD = 3
ERROR_THRESHOLD = 2
STALE_MINUTES = 60
LATENCY_THRESHOLD_MS = 800


class AlertModel(BaseModel):
    id: str
    severity: str
    title: str
    message: str
    action_href: Optional[str] = None
    action_label: Optional[str] = None


class AlertsResponse(BaseModel):
    alerts: List[AlertModel]


def _minutes_since(timestamp: Optional[str]) -> Optional[int]:
    if not timestamp:
        return None
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return None
    delta = datetime.now(timezone.utc) - dt
    return int(delta.total_seconds() // 60)


@router.get("/current", response_model=AlertsResponse)
async def get_current_alerts(user=Depends(verify_jwt)):
    workspace_id = get_or_create_workspace(user["user_id"])
    sb = supabase_admin()

    alerts: List[AlertModel] = []

    # Unassigned queue pressure
    try:
        pending_resp = (
            sb.table("mcp_unassigned_captures")
            .select("id", count='exact', head=True)
            .eq("workspace_id", workspace_id)
            .eq("status", "pending")
            .execute()
        )
        pending_count = pending_resp.count or 0
        if pending_count >= UNASSIGNED_THRESHOLD:
            alerts.append(
                AlertModel(
                    id="unassigned_queue",
                    severity="warning" if pending_count < UNASSIGNED_THRESHOLD * 2 else "error",
                    title="Triage ambient captures",
                    message=f"{pending_count} low-confidence captures need basket assignment.",
                    action_href="/memory/unassigned",
                    action_label="Open queue",
                )
            )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"alert_unassigned_failed: {exc}") from exc

    # Host activity & health
    try:
        host_resp = (
            sb.table("mcp_activity_host_recent")
            .select("host, last_seen_at, calls_last_hour, errors_last_hour, p95_latency_ms")
            .eq("workspace_id", workspace_id)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"alert_activity_failed: {exc}") from exc

    for record in host_resp.data or []:
        host = record.get("host")
        if not host:
            continue
        calls = record.get("calls_last_hour") or 0
        errors = record.get("errors_last_hour") or 0
        latency = record.get("p95_latency_ms") or 0
        minutes_since = _minutes_since(record.get("last_seen_at"))

        if errors >= ERROR_THRESHOLD:
            alerts.append(
                AlertModel(
                    id=f"host_{host}_errors",
                    severity="error",
                    title=f"{host.title()} integration errors",
                    message=f"{errors} failures in the last hour. Investigate logs and restart if needed.",
                    action_href="/dashboard/settings",
                    action_label="Review integrations",
                )
            )
        elif minutes_since is not None and minutes_since > STALE_MINUTES:
            alerts.append(
                AlertModel(
                    id=f"host_{host}_stale",
                    severity="warning",
                    title=f"{host.title()} is dormant",
                    message=f"No MCP calls from {host} in the last {minutes_since} minutes.",
                    action_href="/docs/integrations/claude" if host == "claude" else "/docs/integrations/chatgpt",
                    action_label="Check setup",
                )
            )
        elif latency and latency > LATENCY_THRESHOLD_MS:
            alerts.append(
                AlertModel(
                    id=f"host_{host}_latency",
                    severity="warning",
                    title=f"{host.title()} latency rising",
                    message=f"p95 latency is {int(latency)}ms. Monitor for further degradation.",
                    action_href="/dashboard",
                    action_label="Monitor",
                )
            )

    return AlertsResponse(alerts=alerts)


__all__ = ["router"]
