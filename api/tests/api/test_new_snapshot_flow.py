import os
import types

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.basket_new import router as new_router
from app.routes.basket_snapshot import router as snapshot_router

app = FastAPI()
app.include_router(new_router, prefix="/api")
app.include_router(snapshot_router, prefix="/api")
client = TestClient(app)


def _table(name, store):
    def insert(row):
        store[name].append(row)
        return types.SimpleNamespace(
            execute=lambda: types.SimpleNamespace(data=[row], error=None)
        )

    def select(*args, **kwargs):
        class Q:
            def eq(self, *a, **k):
                return self

            def order(self, *a, **k):
                return self

            def execute(self):
                return types.SimpleNamespace(data=store.get(name, []))

        return Q()

    return types.SimpleNamespace(insert=insert, select=select)


def test_snapshot_after_creation(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "context_blocks": []}
    fake = types.SimpleNamespace(table=lambda n: _table(n, store))
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)
    monkeypatch.setattr("app.routes.basket_snapshot.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201
    basket_id = resp.json()["basket_id"]

    snap = client.get(f"/api/baskets/{basket_id}/snapshot")
    assert snap.status_code == 200
    assert snap.json()["raw_dump"] == "hello"
