import os
import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.change_queue import router as queue_router

app = FastAPI()
app.include_router(queue_router, prefix="/api")
client = TestClient(app)


def _fake_table(name, store):
    def insert(row):
        store[name].append(row)
        return types.SimpleNamespace(execute=lambda: None)

    def _resp():
        return types.SimpleNamespace(data=store[name], count=len(store[name]))

    def select(*args, **kw):
        class _R:
            data = store[name]
            count = len(store[name])

            def eq(self, *a, **k):
                return types.SimpleNamespace(execute=lambda: _resp())

            def in_(self, *_a, **_k):
                return types.SimpleNamespace(execute=lambda: _resp())

        return _R()

    def in_(*args, **kw):
        return types.SimpleNamespace(select=lambda *a, **k: select(*a, **k))

    return types.SimpleNamespace(insert=insert, select=select, eq=in_, in_=in_)


def test_change_queue_count(monkeypatch):
    store = {"context_blocks": [], "block_change_queue": []}
    fake = types.SimpleNamespace(table=lambda n: _fake_table(n, store))
    monkeypatch.setattr("app.routes.change_queue.supabase", fake)

    bid = "b1"
    block_id = str(uuid.uuid4())
    fake.table("context_blocks").insert({"id": block_id, "basket_id": bid})
    fake.table("block_change_queue").insert(
        {"id": "q1", "block_id": block_id, "status": "pending"}
    )

    res = client.get(f"/api/baskets/{bid}/change-queue")
    assert res.status_code == 200
    assert res.json()["count"] == 1
