import os
import types
import uuid

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


def _supabase(store):
    def rpc(func, params):
        bid = str(uuid.uuid4())
        did = str(uuid.uuid4())
        store["baskets"].append({"id": bid, "raw_dump_id": did})
        store["raw_dumps"].append({"id": did, "basket_id": bid, "body_md": params["p_body_md"]})
        resp = types.SimpleNamespace(data=[{"basket_id": bid}], error=None)
        return types.SimpleNamespace(execute=lambda: resp)

    def table(name):
        def insert(row):
            store[name].append(row)
            resp = types.SimpleNamespace(data=[row], error=None)
            return types.SimpleNamespace(execute=lambda: resp)

        def update(obj: dict):
            for r in store[name]:
                r.update(obj)
            def eq(*_a, **_k):
                resp = types.SimpleNamespace(data=None, error=None)
                return types.SimpleNamespace(execute=lambda: resp)
            return types.SimpleNamespace(eq=eq)

        def select(*_a, **_k):
            class Q:
                def eq(self, *_a, **_k):
                    return self

                def order(self, *_a, **_k):
                    return self

                def in_(self, *_a, **_k):
                    return self

                def execute(self):
                    return types.SimpleNamespace(data=store.get(name, []))

            return Q()

        return types.SimpleNamespace(insert=insert, select=select, update=update)

    return types.SimpleNamespace(table=table, rpc=rpc)


def test_snapshot_after_creation(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "blocks": []}
    fake = _supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)
    monkeypatch.setattr("app.routes.basket_snapshot.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201
    basket_id = resp.json()["id"]

    snap = client.get(f"/api/baskets/{basket_id}/snapshot")
    assert snap.status_code == 200
    assert snap.json()["raw_dump"] == "hello"
