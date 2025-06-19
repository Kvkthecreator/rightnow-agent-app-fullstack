import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient
import sys
import os

asyncpg_stub = types.SimpleNamespace(Connection=object)
sys.modules.setdefault("asyncpg", asyncpg_stub)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))

from app.routes.agents import router as agents_router

app = FastAPI()
app.include_router(agents_router, prefix="/api")
client = TestClient(app)


def _fake_supabase(store):
    def table(name: str):
        def insert(row: dict):
            row = {**row}
            if "id" not in row:
                row["id"] = str(uuid.uuid4())
            store.setdefault(name, []).append(row)
            return types.SimpleNamespace(
                execute=lambda: types.SimpleNamespace(
                    data=[row], status_code=200, json=lambda: {"data": [row]}
                )
            )

        def select(_cols="*"):
            def eq(col: str, val: str):
                items = [r for r in store.get(name, []) if r.get(col) == val]
                return types.SimpleNamespace(
                    execute=lambda: types.SimpleNamespace(
                        data=items, status_code=200, json=lambda: {"data": items}
                    )
                )

            return types.SimpleNamespace(eq=eq)

        return types.SimpleNamespace(insert=insert, select=select)

    return types.SimpleNamespace(table=table)


def test_run_blockifier(monkeypatch):
    store = {"baskets": [], "raw_dumps": [], "blocks": []}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.agents.supabase", fake)
    monkeypatch.setattr("app.agent_tasks.orch.orch_block_manager_agent.supabase", fake)

    basket_id = str(uuid.uuid4())
    dump_id = str(uuid.uuid4())
    store["baskets"].append({"id": basket_id, "raw_dump_id": dump_id})
    store["raw_dumps"].append({"id": dump_id, "basket_id": basket_id, "body_md": "d"})

    resp = client.post("/api/agents/orch_block_manager/run", json={"basket_id": basket_id})
    assert resp.status_code == 200
    assert resp.json()["inserted"] >= 1
    assert store["blocks"]

