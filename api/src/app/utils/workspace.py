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

from .supabase_client import supabase_client as supabase

log = logging.getLogger("uvicorn.error")


def get_or_create_workspace(user_id: str) -> str:
    """
    1. Check `workspace_memberships` for an existing membership.
    2. If absent → create workspace + membership in a single transaction.
    3. Return the workspace_id.
    """

    # 1) Existing membership?
    try:
        query = (
            supabase.table("workspace_memberships")
            .select("workspace_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:  # pragma: no cover
        log.exception("workspace lookup failed")
        raise

    if query.data:
        return query.data[0]["workspace_id"]

    # 2) None found → create
    workspace_id = str(uuid.uuid4())
    try:
        with supabase.transaction() as trx:
            # workspaces
            trx.table("workspaces").insert(
                {
                    "id": workspace_id,
                    "owner_id": user_id,
                    "name": None,
                    "is_demo": False,
                }
            ).execute()
            # membership
            trx.table("workspace_memberships").insert(
                {
                    "workspace_id": workspace_id,
                    "user_id": user_id,
                    "role": "owner",
                }
            ).execute()
    except Exception:  # pragma: no cover
        log.exception("workspace creation failed")
        raise

    return workspace_id
