import importlib
import os
import sys
from uuid import uuid4

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from fastapi import FastAPI
from fastapi.testclient import TestClient


class StubTable:
    def __init__(self, records, name):
        self.records = records
        self.name = name

    def insert(self, data):
        self.records.setdefault(self.name, []).append(data)
        return self

    def select(self, *a, **k):
        return self

    def eq(self, *a, **k):
        return self

    def execute(self):
        return type("Resp", (), {"data": []})()


class StubClient:
    def __init__(self, records):
        self.records = records

    def table(self, name):
        return StubTable(self.records, name)


def _setup_supabase(monkeypatch):
    records = {}
    supabase_mod = importlib.import_module("supabase")
    monkeypatch.setattr(
        supabase_mod, "create_client", lambda *a, **k: StubClient(records)
    )
    monkeypatch.setenv("SUPABASE_URL", "http://example.com")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "key")
    if "app.utils.supabase_client" in sys.modules:
        del sys.modules["app.utils.supabase_client"]
    return records


def test_orch_run_creates_block_and_revision(monkeypatch):
    records = _setup_supabase(monkeypatch)
    from pathlib import Path

    spec = importlib.util.spec_from_file_location(
        "orch_block_manager_agent",
        Path(__file__).resolve().parents[2]
        / "api"
        / "src"
        / "app"
        / "agent_tasks"
        / "orch"
        / "orch_block_manager_agent.py",
    )
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    module.run(uuid4())
    assert "context_blocks" in records
    assert "block_revisions" in records


def test_infra_route_ok(monkeypatch):
    records = _setup_supabase(monkeypatch)
    from pathlib import Path

    base = Path(__file__).resolve().parents[2]

    orch_spec = importlib.util.spec_from_file_location(
        "app.agent_tasks.orch.orch_block_manager_agent",
        base
        / "api"
        / "src"
        / "app"
        / "agent_tasks"
        / "orch"
        / "orch_block_manager_agent.py",
    )
    orch_mod = importlib.util.module_from_spec(orch_spec)
    assert orch_spec and orch_spec.loader
    orch_spec.loader.exec_module(orch_mod)

    infra_spec = importlib.util.spec_from_file_location(
        "app.agent_tasks.infra.infra_cil_validator_agent",
        base
        / "api"
        / "src"
        / "app"
        / "agent_tasks"
        / "infra"
        / "infra_cil_validator_agent.py",
    )
    infra_mod = importlib.util.module_from_spec(infra_spec)
    assert infra_spec and infra_spec.loader
    infra_spec.loader.exec_module(infra_mod)

    spec = importlib.util.spec_from_file_location(
        "app.routes.agents",
        base / "api" / "src" / "app" / "routes" / "agents.py",
    )
    router_mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(router_mod)

    app = FastAPI()
    app.include_router(router_mod.router, prefix="/api")
    client = TestClient(app)

    resp = client.post(
        "/api/agents/infra_cil_validator/run",
        json={"basket_id": str(uuid4())},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    assert records == {}  # validator is no-op
