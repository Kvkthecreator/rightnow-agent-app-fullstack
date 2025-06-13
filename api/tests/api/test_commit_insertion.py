import os
import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.dump import router as dump_router

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_ANON_KEY", "a.b.c")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "d.e.f")

app = FastAPI()
app.include_router(dump_router, prefix="/api")

client = TestClient(app)


def _fake_table(name: str, store: dict[str, list[dict]]):
    def insert(row: dict):
        row = {**row}
        if "id" not in row:
            row["id"] = str(uuid.uuid4())
        store[name].append(row)
        return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=[row]))

    def update(obj: dict):
        for r in store[name]:
            r.update(obj)

        def _eq(col: str, val: str):
            return types.SimpleNamespace(execute=lambda: None)

        return types.SimpleNamespace(eq=_eq)

    def select():
        return types.SimpleNamespace(data=store[name])

    def eq(col: str, val: str):
        return types.SimpleNamespace(update=update, execute=lambda: None)

    return types.SimpleNamespace(insert=insert, update=update, select=select, eq=eq)


def test_commit_created(monkeypatch):
    store = {
        "dump_commits": [],
        "context_blocks": [],
        "basket_inputs": [],
    }
    fake = types.SimpleNamespace(table=lambda name: _fake_table(name, store))
    monkeypatch.setattr("app.routes.dump.supabase", fake)

    resp = client.post(
        "/api/dump",
        data={"basket_id": "bkt", "user_id": "usr", "text": "a\n\nb"},
    )
    assert resp.status_code == 200
    assert len(store["dump_commits"]) == 1
    commit_id = store["dump_commits"][0]["id"]
    for blk in store["context_blocks"]:
        assert blk["commit_id"] == commit_id
