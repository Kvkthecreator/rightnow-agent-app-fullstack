import os
import types

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.basket_new import router as basket_new_router

app = FastAPI()
app.include_router(basket_new_router, prefix="/api")
client = TestClient(app)


def _fake_table(name, store):
    def insert(row):
        store["calls"].append(name)
        store[name].append(row)
        return types.SimpleNamespace(
            execute=lambda: types.SimpleNamespace(data=[row], error=None)
        )

    return types.SimpleNamespace(insert=insert)


def _error_table(name):
    def insert(_row):
        return types.SimpleNamespace(
            execute=lambda: types.SimpleNamespace(
                data=None, error=types.SimpleNamespace(message=f"{name} fail")
            )
        )

    return types.SimpleNamespace(insert=insert)


def test_basket_new(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "calls": []}
    fake = types.SimpleNamespace(table=lambda n: _fake_table(n, store))
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
    assert store["calls"] == ["raw_dumps", "baskets"]


def test_basket_new_minimal(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "calls": []}
    fake = types.SimpleNamespace(table=lambda n: _fake_table(n, store))
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["basket_id"]) > 0
    assert len(store["baskets"]) == 1
    assert len(store["raw_dumps"]) == 1
    assert store["calls"] == ["raw_dumps", "baskets"]


def test_basket_new_error(monkeypatch):
    fake = types.SimpleNamespace(table=_error_table)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 500
    assert (
        "baskets fail" in resp.json()["detail"]
        or "raw_dumps fail" in resp.json()["detail"]
    )
