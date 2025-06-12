"""Shim so `src.app.utils.supabase_client` can be imported."""

import sys
from importlib import import_module

_real = import_module("src.utils.supabase_client")

supabase_client = _real  # type: ignore

sys.modules[__name__ + ".supabase_client"] = _real
