import os
import types

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.basket_new import router as basket_new_router

app = FastAPI()
app.include_router(basket_new_router)
client = TestClient(app)


def _fake_table(name, store):
    def insert(row):
        store[name].append(row)
        return types.SimpleNamespace(execute=lambda: None)

    return types.SimpleNamespace(insert=insert)


def test_basket_new(monkeypatch):
    store = {"baskets": [], "raw_dumps": []}
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
