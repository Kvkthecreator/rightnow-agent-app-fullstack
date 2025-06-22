"""
Utility: look up (or lazily create) the caller’s workspace.

Authoritative rule:
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
A user *always* operates inside exactly one workspace.
If they have none, we create one and add the caller as owner/member.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import HTTPException
from .supabase_client import supabase_client as supabase

log = logging.getLogger("uvicorn.error")

def get_or_create_workspace(user_id: str) -> str:
    """
    Ensure the user operates in exactly one workspace.
    If no workspace exists → create one and add membership.
    """
    # Validate user_id is a UUID
    try:
        uuid.UUID(user_id)
    except ValueError:
        log.error("Invalid user_id for workspace: %s", user_id)
        raise HTTPException(status_code=401, detail="Invalid user_id")

    # Check existing membership
    try:
        query = (
            supabase.table("workspace_memberships")
            .select("workspace_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        log.exception("workspace lookup failed")
        raise

    if query.data:
        return query.data[0]["workspace_id"]

    # Create workspace + membership
    workspace_id = str(uuid.uuid4())
    try:
        with supabase.transaction() as trx:
            trx.table("workspaces").insert(
                {
                    "id": workspace_id,
                    "owner_id": user_id,
                    "name": None,
                    "is_demo": False,
                }
            ).execute()
            trx.table("workspace_memberships").insert(
                {
                    "workspace_id": workspace_id,
                    "user_id": user_id,
                    "role": "owner",
                }
            ).execute()
    except Exception:
        log.exception("workspace creation failed")
        raise

    return workspace_id
