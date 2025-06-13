import os
import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_ANON_KEY", "a.b.c")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "d.e.f")
from app.routes.dump import router as dump_router

app = FastAPI()
app.include_router(dump_router, prefix="/api")

client = TestClient(app)


class _Stub:
    def __init__(self):
        self.rows = []

    def insert(self, obj):
        if "id" not in obj:
            obj["id"] = str(uuid.uuid4())
        self.rows.append(obj)
        return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=[obj]))

    def update(self, *_a, **_kw):
        def _eq(*_a, **_kw):
            return types.SimpleNamespace(execute=lambda: None)

        return types.SimpleNamespace(eq=_eq)

    def select(self):  # noqa: D401
        return types.SimpleNamespace(data=self.rows)

    def execute(self):
        return types.SimpleNamespace(data=self.rows)

    def eq(self, *_a, **_kw):  # noqa: D401
        return self


def _mock_supabase():
    return type("T", (), {"table": lambda *args, **_: _Stub()})()


def test_dump_happy_path(monkeypatch):
    monkeypatch.setattr("app.routes.dump.supabase", _mock_supabase())
    resp = client.post(
        "/api/dump",
        data={"basket_id": "basket_123", "user_id": "user_abc", "text": "a\n\nb"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["chunk_ids"]) == 2


def test_dump_mime_reject(monkeypatch):
    monkeypatch.setattr("app.routes.dump.supabase", _mock_supabase())
    resp = client.post(
        "/api/dump",
        data={"basket_id": "basket_123", "user_id": "user_abc"},
        files={"file": ("x.json", b"{}", "application/json")},
    )
    assert resp.status_code == 415


def test_dump_guardrail(monkeypatch):
    class _Stub:
        def __init__(self):
            self.rows = []

        def insert(self, obj):
            if "id" not in obj:
                obj["id"] = str(uuid.uuid4())
            self.rows.append(obj)
            return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=[obj]))

        def update(self, obj):
            for r in self.rows:
                r.update(obj)

            def _eq(*_a, **_kw):
                return types.SimpleNamespace(execute=lambda: None)

            return types.SimpleNamespace(eq=_eq)

        def select(self):  # noqa: D401
            return self

        def eq(self, *_a, **_kw):
            return self

        def execute(self):
            import types

            return types.SimpleNamespace(data=self.rows)

    import types

    blocks = _Stub()
    inputs = _Stub()

    def _table(name):
        return {
            "basket_inputs": inputs,
            "context_blocks": blocks,
            "dump_commits": _Stub(),
            "basket_blocks": _Stub(),
            "ingestion_jobs": _Stub(),
        }[name]

    monkeypatch.setattr("app.routes.dump.supabase", types.SimpleNamespace(table=_table))

    long_text = "\n\n".join(["line"] * 101)
    resp = client.post(
        "/api/dump",
        data={"basket_id": "b1", "user_id": "u1", "text": long_text},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["warning"] == "too_many_blocks"
