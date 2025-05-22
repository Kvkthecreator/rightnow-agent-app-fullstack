"""
Utilities for authentication dependencies.
"""
from fastapi import HTTPException, Header

async def current_user_id(x_user_id: str = Header(None)) -> str:
    """
    Retrieve the current user ID from the X-User-Id header.
    NOTE: Replace with real auth validation (e.g., JWT) as needed.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing or invalid user ID header")
    return x_user_id