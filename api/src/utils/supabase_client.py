import os
import types
import uuid
from collections import defaultdict

from supabase import create_client

if os.getenv("TESTING") == "1":
    class _Stub:
        def __init__(self):
            self.rows = []

        def insert(self, obj):
            if "id" not in obj:
                obj["id"] = str(uuid.uuid4())
            self.rows.append(obj)
            return types.SimpleNamespace(
                execute=lambda: types.SimpleNamespace(data=[obj])
            )

        def update(self, *_a, **_kw):
            def _eq(*_a, **_kw):
                return types.SimpleNamespace(execute=lambda: None)

            return types.SimpleNamespace(eq=_eq)

        def select(self, *_a, **_kw):
            return types.SimpleNamespace(data=self.rows)

        def execute(self):
            return types.SimpleNamespace(data=self.rows)

        def eq(self, *_a, **_kw):
            return self

    class _Client:
        def __init__(self):
            self._tables = defaultdict(_Stub)

        def table(self, name):
            return self._tables[name]

    supabase_client = _Client()
else:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase env vars missing")

    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
