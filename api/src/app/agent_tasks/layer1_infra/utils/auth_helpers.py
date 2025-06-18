"""
Utilities for authentication dependencies.
"""

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Set up Bearer token dependency and Supabase admin client
bearer = HTTPBearer()


async def current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    """
    Decode Supabase JWT and return the user ID (sub claim).
    """
    token = creds.credentials
    try:
        # Decode without signature verification; adjust verify options as needed
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise KeyError
    except Exception:
        raise HTTPException(
            status_code=401, detail="Invalid or missing authentication token"
        )
    return user_id
