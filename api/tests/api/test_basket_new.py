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
    def table(name: str):
        def insert(row: dict):
            row = {**row}
            if "id" not in row:
                row["id"] = str(uuid.uuid4())
            store[name].append(row)
            resp = types.SimpleNamespace(data=[row], error=None)
            return types.SimpleNamespace(execute=lambda: resp)

        def update(obj: dict):
            for r in store[name]:
                r.update(obj)
            def eq(*_a):
                return types.SimpleNamespace(execute=lambda: None)
            return types.SimpleNamespace(eq=eq)

        return types.SimpleNamespace(insert=insert, update=update)

    return types.SimpleNamespace(table=table)


def _error_supabase():
    def table(name: str):
        def insert(_row):
            err = types.SimpleNamespace(message=f"{name} insert fail")
            resp = types.SimpleNamespace(data=None, error=err)
            return types.SimpleNamespace(execute=lambda: resp)

        def update(_obj):
            def eq(*_a):
                return types.SimpleNamespace(execute=lambda: None)
            return types.SimpleNamespace(eq=eq)

        return types.SimpleNamespace(insert=insert, update=update)

    return types.SimpleNamespace(table=table)


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
    assert store["raw_dumps"][0]["basket_id"] == body["id"]
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
    assert store["raw_dumps"][0]["basket_id"] == body["id"]


def test_basket_new_empty(monkeypatch):
    fake = _fake_supabase({"baskets": [], "raw_dumps": []})
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "   "})
    assert resp.status_code == 400


def test_basket_new_error(monkeypatch):
    fake = _error_supabase()
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 500

