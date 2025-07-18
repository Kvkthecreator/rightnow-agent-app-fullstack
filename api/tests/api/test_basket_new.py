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
    def rpc(_func: str, params: dict):
        bid = str(uuid.uuid4())
        did = str(uuid.uuid4())
        store.setdefault("baskets", []).append({"id": bid, "raw_dump_id": did})
        store.setdefault("raw_dumps", []).append(
            {
                "id": did,
                "basket_id": bid,
                "body_md": params["dump_body"],
                "file_refs": params.get("file_urls", []),
            }
        )
        resp = types.SimpleNamespace(data=[{"basket_id": bid}], error=None)
        return types.SimpleNamespace(execute=lambda: resp)

    return types.SimpleNamespace(rpc=rpc)


def _error_supabase():
    def rpc(_func: str, _params: dict):
        err = types.SimpleNamespace(message="rpc fail")
        resp = types.SimpleNamespace(data=None, error=err)
        return types.SimpleNamespace(execute=lambda: resp)

    return types.SimpleNamespace(rpc=rpc)


def test_basket_new(monkeypatch):
    store = {"baskets": [], "raw_dumps": []}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post(
        "/api/baskets/new",
        json={"text_dump": "hello", "file_urls": ["f"]},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"]
    assert len(store["baskets"]) == 1
    assert len(store["raw_dumps"]) == 1
    assert store["baskets"][0]["id"] == body["id"]
    assert store["baskets"][0]["raw_dump_id"] == store["raw_dumps"][0]["id"]
    assert store["raw_dumps"][0]["basket_id"] == body["id"]
    assert store["raw_dumps"][0]["body_md"] == "hello"
    assert store["raw_dumps"][0]["file_refs"] == ["f"]


def test_basket_new_minimal(monkeypatch):
    store = {"baskets": [], "raw_dumps": []}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["id"]) > 0
    assert len(store["baskets"]) == 1
    assert len(store["raw_dumps"]) == 1
    assert store["baskets"][0]["id"] == body["id"]
    assert store["baskets"][0]["raw_dump_id"] == store["raw_dumps"][0]["id"]
    assert store["raw_dumps"][0]["basket_id"] == body["id"]
    assert store["raw_dumps"][0]["body_md"] == "hello"
def test_basket_new_empty(monkeypatch):
    fake = _fake_supabase({"baskets": [], "raw_dumps": []})
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "   "})
    assert resp.status_code == 201


def test_basket_new_error(monkeypatch):
    fake = _error_supabase()
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 500

