import sys
import types
import os

tests_dir = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(tests_dir, ".."))  # allow `import src`
sys.path.insert(0, os.path.join(tests_dir, "../src"))  # allow `import app`

# Provide minimal stubs so tests requiring these modules don't fail offline.
for name in ("supabase", "supabase_py", "asyncpg"):
    if name not in sys.modules:
        mod = types.ModuleType(name)
        sys.modules[name] = mod
        if name in ("supabase", "supabase_py"):
            mod.create_client = lambda *a, **k: None
        if name == "asyncpg":
            mod.Pool = type("Pool", (), {})
            mod.create_pool = lambda *a, **k: None

# Default environment for auth helpers
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "stub-key")
os.environ.setdefault("SUPABASE_URL", "http://stub.local")
os.environ.setdefault("SERVICE_ROLE", "stub-key")

# Temporary compatibility alias for deprecated module path
import importlib

if "app.util.snapshot_assembler" not in sys.modules:
    try:
        real = importlib.import_module("app.utils.snapshot_assembler")
    except Exception:
        real = types.ModuleType("snapshot_assembler")
    sys.modules["app.util.snapshot_assembler"] = real

# Bypass JWT verification in API routes
stub_user = lambda *_a, **_k: {"user_id": "u"}
try:
    import app.utils.jwt as jwt
    jwt.verify_jwt = stub_user
    for mod_name in [
        "app.routes.basket_new",
        "app.routes.basket_snapshot",
        "app.routes.baskets",
        "app.routes.context_items",
        "app.routes.dump_new",
        "app.routes.basket_from_template",
        "app.routes.orch_block_manager",
    ]:
        try:
            m = importlib.import_module(mod_name)
            setattr(m, "verify_jwt", stub_user)
        except Exception:
            pass
except Exception:
    pass
