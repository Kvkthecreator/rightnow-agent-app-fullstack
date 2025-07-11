import importlib
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.agent_tasks.test_agent_scaffold import _setup_supabase


def _load_router(monkeypatch, records):
    async def stub_scaffold(bid):
        records.setdefault("scaffold_calls", []).append(str(bid))

    async def stub_block_mgr(bid):
        records.setdefault("block_mgr_calls", []).append(str(bid))

    async def stub_context(bid):
        records.setdefault("context_items", []).append({"basket_id": str(bid)})

    # auth and workspace stubs
    jwt_mod = importlib.util.module_from_spec(importlib.machinery.ModuleSpec("jwt", None))
    def _verify_jwt(sb_access_token: str | None = None, authorization: str | None = None):
        return {"user_id": "11111111-1111-1111-1111-111111111111"}
    jwt_mod.verify_jwt = _verify_jwt
    monkeypatch.setitem(sys.modules, "app.utils.jwt", jwt_mod)

    ws_mod = importlib.util.module_from_spec(importlib.machinery.ModuleSpec("workspace", None))
    ws_mod.get_or_create_workspace = lambda uid: "ws1"
    monkeypatch.setitem(sys.modules, "app.utils.workspace", ws_mod)

    # stub agent modules
    doc_mod = importlib.util.module_from_spec(importlib.machinery.ModuleSpec("doc_scaffold_agent", None))
    doc_mod.run = stub_scaffold
    monkeypatch.setitem(sys.modules, "app.agent_tasks.orch.doc_scaffold_agent", doc_mod)

    mgr_mod = importlib.util.module_from_spec(importlib.machinery.ModuleSpec("orch_block_manager_agent", None))
    mgr_mod.run = stub_block_mgr
    monkeypatch.setitem(sys.modules, "app.agent_tasks.orch.orch_block_manager_agent", mgr_mod)

    ctx_mod = importlib.util.module_from_spec(importlib.machinery.ModuleSpec("context_extractor_agent", None))
    ctx_mod.run = stub_context
    monkeypatch.setitem(sys.modules, "app.agent_tasks.orch.context_extractor_agent", ctx_mod)

    orch_pkg = importlib.util.module_from_spec(importlib.machinery.ModuleSpec("orch", None))
    orch_pkg.doc_scaffold_agent = doc_mod
    orch_pkg.orch_block_manager_agent = mgr_mod
    orch_pkg.context_extractor_agent = ctx_mod
    monkeypatch.setitem(sys.modules, "app.agent_tasks.orch", orch_pkg)

    base = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(base / "api"))
    sys.path.insert(0, str(base / "api" / "src"))

    module = importlib.import_module("app.routes.basket_new_universal")
    return module.router


def test_create_universal(monkeypatch):
    records = _setup_supabase(monkeypatch)
    router = _load_router(monkeypatch, records)

    app = FastAPI()
    app.include_router(router, prefix="/api")
    client = TestClient(app)

    payload = {
        "template_id": "universal",
        "basket_name": "Basket",
        "core_block": {"text": "x" * 120, "scope": "basket", "status": "locked"},
        "raw_dumps": [{"body_md": "a"}, {"body_md": "b"}],
        "guidelines": None,
    }

    resp = client.post("/api/baskets/new-universal", json=payload)
    assert resp.status_code == 201

    assert len(records.get("baskets", [])) == 1
    assert len(records.get("documents", [])) == 2
    assert len(records.get("raw_dumps", [])) == 2
    assert len(records.get("context_items", [])) >= 1

