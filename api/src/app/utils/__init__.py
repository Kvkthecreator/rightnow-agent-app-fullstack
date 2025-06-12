"""
Shim so 'src.app.utils' resolves in Render production.
Re-exports supabase_client from the real utils package.
"""
from ...utils.supabase_client import supabase_client  # type: ignore F401
