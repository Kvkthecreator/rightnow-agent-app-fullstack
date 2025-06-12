"""
Proxy shim so `import src.app.utils.supabase_client` works when Render
starts the server with:
    uvicorn src.app.agent_server:app
It forwards every public name to the real supabase_client module
located at api/src/utils/supabase_client.py
"""

# Ensure importlib sees this as the same module
import sys

from ...utils import supabase_client as _real  # noqa: F401

# Re-export everything the real module provides
from ...utils.supabase_client import *  # type: ignore  # noqa: F403,F401

sys.modules[__name__] = _real
