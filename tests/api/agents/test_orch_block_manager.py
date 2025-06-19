import importlib
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.agent_tasks.test_agent_scaffold import _setup_supabase


def test_run_agent_inserts_block(monkeypatch):
    records = _setup_supabase(monkeypatch)
    base = Path(__file__).resolve().parents[3]

    # Load agent and router modules after patching Supabase
    spec = importlib.util.spec_from_file_location(
        "app.routes.agents", base / "api" / "src" / "app" / "routes" / "agents.py"
    )
    router_mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(router_mod)

    orch_spec = importlib.util.spec_from_file_location(
        "app.agent_tasks.orch.orch_block_manager_agent",
        base / "api" / "src" / "app" / "agent_tasks" / "orch" / "orch_block_manager_agent.py",
    )
    orch_mod = importlib.util.module_from_spec(orch_spec)
    assert orch_spec and orch_spec.loader
    orch_spec.loader.exec_module(orch_mod)

    app = FastAPI()
    app.include_router(router_mod.router, prefix="/api")
    client = TestClient(app)

    basket_id = str(uuid4())
    dump_id = str(uuid4())
    records["baskets"] = [{"id": basket_id, "raw_dump_id": dump_id}]
    records["raw_dumps"] = [{"id": dump_id, "basket_id": basket_id, "body_md": "d"}]

    resp = client.post("/api/agents/orch_block_manager/run", json={"basket_id": basket_id})
    assert resp.status_code == 200
    assert records["blocks"][0]["state"] == "PROPOSED"
