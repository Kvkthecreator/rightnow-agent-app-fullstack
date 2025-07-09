import sys
import types

# Stub for 'supabase' module
module = types.ModuleType("supabase")
module.create_client = lambda *a, **k: None
sys.modules.setdefault("supabase", module)

# Stub for legacy 'supabase_py' module
module_py = types.ModuleType("supabase_py")
module_py.create_client = lambda *a, **k: None
sys.modules.setdefault("supabase_py", module_py)

# Stub for asyncpg to avoid requiring the real package
asyncpg = types.ModuleType("asyncpg")
asyncpg.Pool = type("Pool", (), {})
asyncpg.create_pool = lambda *a, **k: None
sys.modules.setdefault("asyncpg", asyncpg)
