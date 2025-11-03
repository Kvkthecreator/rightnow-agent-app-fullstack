"""FastAPI dependencies for the application."""

from fastapi import Depends
from .utils.jwt import verify_jwt


def get_current_user(user: dict = Depends(verify_jwt)) -> dict:
    """Get the current authenticated user from JWT verification."""
    return user