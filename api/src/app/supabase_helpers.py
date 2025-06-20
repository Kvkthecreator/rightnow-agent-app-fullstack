from uuid import uuid4
from .event_bus import emit   # ← keep original dependency


def get_or_create_workspace(sb, user_id: str) -> str:
    """Returns the workspace_id for a user; creates a personal workspace
    if one doesn't exist. Expects service_role key."""
    ws = (
        sb.table("workspaces")
        .select("id")
        .eq("owner_id", user_id)
        .limit(1)
        .execute()
    )
    if ws.data:
        return ws.data[0]["id"]

    new_id = str(uuid4())
    sb.table("workspaces").insert(
        {"id": new_id, "owner_id": user_id, "name": f"{user_id[:8]}'s space"}
    ).execute()
    sb.table("workspace_memberships").insert(
        {"workspace_id": new_id, "user_id": user_id, "role": "owner"}
    ).execute()
    return new_id

# --------------------------------------------------------------------
# Legacy helper: forward to event_bus.emit so existing agents keep working
# --------------------------------------------------------------------

async def publish_event(topic: str, payload: dict) -> None:
    """Thin wrapper kept for backward-compatibility."""
    await emit(topic, payload)

# Export both for star-imports
__all__ = ["get_or_create_workspace", "publish_event"]
