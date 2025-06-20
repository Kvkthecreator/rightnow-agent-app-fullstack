import importlib
from pathlib import Path
from uuid import uuid4

import pytest
from tests.agent_tasks.test_agent_scaffold import _setup_supabase


def test_run_proposes_block(monkeypatch):
    records = _setup_supabase(monkeypatch)
    basket_id = uuid4()
    dump_id = uuid4()
    records["baskets"] = [{"id": str(basket_id), "raw_dump_id": str(dump_id)}]
    records["raw_dumps"] = [{"id": str(dump_id), "basket_id": str(basket_id), "body_md": "d"}]

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

    module.run(basket_id)
    assert records["blocks"][0]["state"] == "PROPOSED"


def test_run_raises_on_error(monkeypatch):
    records = _setup_supabase(monkeypatch)
    basket_id = uuid4()

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

    def bad_table(name: str):
        class Bad:
            def insert(self, data):
                return self

            def execute(self):
                return type(
                    "Resp",
                    (),
                    {
                        "data": [],
                        "status_code": 400,
                        "json": lambda self: {"error": "bad"},
                    },
                )()

        return Bad()

    monkeypatch.setattr(module, "supabase", type("S", (), {"table": bad_table}))
    with pytest.raises(RuntimeError):
        module.run(basket_id)

