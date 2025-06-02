"""
Utilities for authentication dependencies.
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
import os, jwt

# Set up Bearer token dependency and Supabase admin client
bearer = HTTPBearer()
SUPA = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

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
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    return user_id