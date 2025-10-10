from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from ..utils.supabase import supabase_admin
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/integrations/openai", tags=["integrations"])

_SHARED_SECRET = os.getenv("MCP_SHARED_SECRET")


class TokenUpsertRequest(BaseModel):
    workspace_id: str = Field(..., description="Workspace the install is bound to")
    access_token: str = Field(..., description="OAuth access token issued by OpenAI")
    refresh_token: Optional[str] = Field(None, description="Refresh token if provided")
    expires_at: Optional[str] = Field(None, description="ISO timestamp for token expiry")
    scope: Optional[str] = Field(None, description="Granted OAuth scope")
    install_id: Optional[str] = Field(None, description="OpenAI-provided install identifier")
    provider_metadata: Optional[dict] = Field(default_factory=dict)


def _verify_shared_secret(request: Request) -> None:
    if not _SHARED_SECRET:
        raise HTTPException(status_code=503, detail="shared_secret_not_configured")
    header_secret = request.headers.get("x-yarnnn-mcp-secret")
    if header_secret != _SHARED_SECRET:
        raise HTTPException(status_code=401, detail="invalid_shared_secret")


@router.post("/tokens", status_code=202)
async def upsert_token(payload: TokenUpsertRequest, request: Request):
    _verify_shared_secret(request)

    try:
        expires_at = (
            datetime.fromisoformat(payload.expires_at.replace("Z", "+00:00"))
            if payload.expires_at
            else None
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"invalid_expires_at: {exc}") from exc

    sb = supabase_admin()
    record = {
        "workspace_id": payload.workspace_id,
        "install_id": payload.install_id,
        "access_token": payload.access_token,
        "refresh_token": payload.refresh_token,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "scope": payload.scope,
        "provider_metadata": payload.provider_metadata or {},
    }

    try:
        sb.table("openai_app_tokens").upsert(record, on_conflict="workspace_id").execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"token_upsert_failed: {exc}") from exc

    return {"status": "accepted"}


@router.get("/tokens/me")
async def get_token(request: Request, user=Depends(verify_jwt)):
    # Allow authenticated users to see whether a ChatGPT install is linked
    workspace_id = get_or_create_workspace(user["user_id"])
    sb = supabase_admin()
    try:
        resp = (
            sb.table("openai_app_tokens")
            .select("workspace_id, install_id, expires_at, scope")
            .eq("workspace_id", workspace_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"token_lookup_failed: {exc}") from exc

    data = resp.data or []
    if not data:
        return {"linked": False}
    row = data[0]
    return {
        "linked": True,
        "install_id": row.get("install_id"),
        "expires_at": row.get("expires_at"),
        "scope": row.get("scope"),
    }
