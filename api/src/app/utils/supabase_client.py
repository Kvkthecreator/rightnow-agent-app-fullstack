"""
Proxy shim so `import src.app.utils.supabase_client` works when Render
starts the server with:
    uvicorn src.app.agent_server:app
It forwards every public name to the real supabase_client module
located at api/src/utils/supabase_client.py
"""

# Proxy to the real supabase_client module in ``src.utils``
from utils.supabase_client import supabase_client

__all__ = ["supabase_client"]
