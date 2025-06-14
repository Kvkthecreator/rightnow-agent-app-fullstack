"""Provide access to the shared ``supabase_client`` utilities."""

from utils import supabase_client as _real

supabase_client = _real  # re-export for backwards compatibility

__all__ = ["supabase_client"]

