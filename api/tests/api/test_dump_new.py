import os
import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.dump_new import router as dump_router

app = FastAPI()
app.include_router(dump_router, prefix="/api")
client = TestClient(app)


def _fake_supabase(store):
    def table(name: str):
        def insert(row):
            row = {**row}
            if "id" not in row:
                row["id"] = str(uuid.uuid4())
            store[name].append(row)
            return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=[row], error=None))

        return types.SimpleNamespace(insert=insert)

    return types.SimpleNamespace(table=table)


def test_dump_new(monkeypatch):
    store = {"raw_dumps": [], "events": []}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.dump_new.supabase", fake)

    resp = client.post(
        "/api/dumps/new",
        json={"basket_id": "b1", "text_dump": "hello"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["raw_dump_id"]
    assert len(store["raw_dumps"]) == 1
    assert store["raw_dumps"][0]["basket_id"] == "b1"


def test_dump_fk_error(monkeypatch):
    class _Err:
        message = "fk fail"

    def table(name: str):
        def insert(_row):
            return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=None, error=_Err()))
        return types.SimpleNamespace(insert=insert)

    fake = types.SimpleNamespace(table=table)
    monkeypatch.setattr("app.routes.dump_new.supabase", fake)

    resp = client.post(
        "/api/dumps/new",
        json={"basket_id": "missing", "text_dump": "oops"},
    )
    assert resp.status_code == 500
    assert "fk fail" in resp.text
