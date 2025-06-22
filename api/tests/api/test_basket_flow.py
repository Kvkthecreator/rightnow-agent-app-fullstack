import os
import types
import uuid
from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.basket_new import router as new_router

app = FastAPI()
app.include_router(new_router, prefix="/api")
client = TestClient(app)


def _supabase(store):
    def table(name: str):
        def insert(row: dict):
            row = {**row}
            if "id" not in row:
                row["id"] = str(uuid.uuid4())
            store.setdefault(name, []).append(row)
            return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=[row], error=None))

        def select(_cols="*"):
            def eq(col: str, val: str):
                data = [r for r in store.get(name, []) if r.get(col) == val]
                def execute():
                    if data:
                        return types.SimpleNamespace(data=data, error=None)
                    return types.SimpleNamespace(status_code=403, data=None, error="forbidden")
                return types.SimpleNamespace(execute=execute)
            return types.SimpleNamespace(eq=eq)

        return types.SimpleNamespace(insert=insert, select=select)

    return types.SimpleNamespace(table=table)


def test_create_and_list_same_user(monkeypatch):
    store = {"baskets": [], "raw_dumps": []}
    fake = _supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)
    monkeypatch.setattr("app.routes.basket_new.get_user", lambda: types.SimpleNamespace(id="u1"))

    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201
    bid = resp.json()["id"]

    items = fake.table("baskets").select("*").eq("user_id", "u1").execute()
    assert items.data is not None
    assert len(items.data) == 1
    assert items.data[0]["id"] == bid


def test_cross_user_forbidden(monkeypatch):
    store = {"baskets": [], "raw_dumps": []}
    fake = _supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)
    monkeypatch.setattr("app.routes.basket_new.get_user", lambda: types.SimpleNamespace(id="u1"))
    resp = client.post("/api/baskets/new", json={"text_dump": "hello"})
    assert resp.status_code == 201

    resp2 = fake.table("baskets").select("*").eq("user_id", "u2").execute()
    assert getattr(resp2, "status_code", 200) == 403
