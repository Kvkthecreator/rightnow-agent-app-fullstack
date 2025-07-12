import importlib
import os
import sys
import types
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))


def _setup_supabase(monkeypatch):
    records = {}

    class StubTable:
        def __init__(self, name):
            self.name = name
            self.filters = {}
            self.single_mode = False

        def insert(self, data):
            records.setdefault(self.name, []).append(data)
            return self

        def select(self, *_a, **_k):
            return self

        def update(self, data):
            rows = records.get(self.name, [])
            for r in rows:
                if all(r.get(k) == v for k, v in self.filters.items()):
                    r.update(data)
            return self

        def single(self):
            self.single_mode = True
            return self

        def eq(self, col, val):
            self.filters[col] = val
            return self

        def execute(self):
            rows = records.get(self.name, [])
            for c, v in self.filters.items():
                rows = [r for r in rows if r.get(c) == v]
            data = rows[0] if self.single_mode else rows
            return types.SimpleNamespace(data=data)

    class StubClient:
        def table(self, name):
            return StubTable(name)

    supabase_mod = importlib.import_module("supabase")
    monkeypatch.setattr(supabase_mod, "create_client", lambda *a, **k: StubClient())
    monkeypatch.setenv("SUPABASE_URL", "http://example.com")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "key")
    if "app.utils.supabase_client" in sys.modules:
        del sys.modules["app.utils.supabase_client"]
    return records


def test_entities_inserted(monkeypatch):
    records = _setup_supabase(monkeypatch)

    class Chat:
        @staticmethod
        def create(**_k):
            return types.SimpleNamespace(
                choices=[types.SimpleNamespace(message=types.SimpleNamespace(content='["Alpha"]'))]
            )

    openai_mod = types.SimpleNamespace(ChatCompletion=Chat(), api_key=None)
    monkeypatch.setitem(sys.modules, "openai", openai_mod)
    monkeypatch.setenv("OPENAI_API_KEY", "sk")

    base = Path(__file__).resolve().parents[2]
    path = base / "api" / "src" / "app" / "agent_tasks" / "context_extractor_agent.py"
    spec = importlib.util.spec_from_file_location("context_extractor_agent", path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)

    bid = "b2"
    records["baskets"] = [{"id": bid, "workspace_id": "ws"}]
    records["raw_dumps"] = [
        {"id": "r1", "basket_id": bid, "body_md": "sample"},
        {"id": "r2", "basket_id": bid, "body_md": "sample2"},
    ]

    import asyncio

    asyncio.run(module.run(bid))

    assert len(records.get("context_items", [])) >= 1

