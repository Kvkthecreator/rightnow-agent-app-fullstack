import os
import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.basket_new import router as basket_new_router

app = FastAPI()
app.include_router(basket_new_router, prefix="/api")
client = TestClient(app)


def _fake_supabase(store):
    def rpc(name, params):
        store["calls"].append(name)

        def execute():
            bid = str(uuid.uuid4())
            did = str(uuid.uuid4())
            store["baskets"].append({"id": bid, "raw_dump_id": did})
            store["raw_dumps"].append({"id": did, "basket_id": bid})
            return types.SimpleNamespace(data=[{"basket_id": bid}], error=None)

        return types.SimpleNamespace(execute=execute)

    return types.SimpleNamespace(rpc=rpc)


def _error_supabase():
    def rpc(name, _params):
        return types.SimpleNamespace(
            execute=lambda: types.SimpleNamespace(
                data=None, error=types.SimpleNamespace(message=f"{name} fail")
            )
        )

    return types.SimpleNamespace(rpc=rpc)


def test_basket_new(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "calls": []}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post(
        "/api/baskets/new",
        json={"text_dump": "hello", "file_urls": ["f"], "basket_name": "test"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["basket_id"]
    assert len(store["baskets"]) == 1
    assert len(store["raw_dumps"]) == 1
    assert store["baskets"][0]["id"] == body["basket_id"]
    assert store["baskets"][0]["raw_dump_id"] == store["raw_dumps"][0]["id"]
    assert store["raw_dumps"][0]["basket_id"] == body["basket_id"]
    assert store["calls"] == ["create_basket_with_dump"]


def test_basket_new_minimal(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "calls": []}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["basket_id"]) > 0
    assert len(store["baskets"]) == 1
    assert len(store["raw_dumps"]) == 1
    assert store["baskets"][0]["id"] == body["basket_id"]
    assert store["baskets"][0]["raw_dump_id"] == store["raw_dumps"][0]["id"]
    assert store["raw_dumps"][0]["basket_id"] == body["basket_id"]
    assert store["calls"] == ["create_basket_with_dump"]


def test_basket_new_error(monkeypatch):
    fake = _error_supabase()
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 500
    assert "create_basket_with_dump fail" in resp.json()["detail"]
