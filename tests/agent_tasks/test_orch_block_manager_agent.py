import importlib
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import HTTPException

from tests.agent_tasks.test_agent_scaffold import _setup_supabase


@pytest.mark.skip(reason="legacy agent_tasks modules removed")
def test_run_proposes_block(monkeypatch):
    records = _setup_supabase(monkeypatch)
    basket_id = uuid4()
    dump_id = uuid4()
    records["baskets"] = [
        {
            "id": str(basket_id),
            "workspace_id": "ws1",
            "raw_dump_id": str(dump_id),
        }
    ]
    records["raw_dumps"] = [
        {"id": str(dump_id), "basket_id": str(basket_id), "body_md": "d"}
    ]

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
    assert records["blocks"][0]["workspace_id"] == "ws1"
    assert records["events"][0]["workspace_id"] == "ws1"
    assert "summary" in records["block_revisions"][0]
    assert "diff_json" in records["block_revisions"][0]


@pytest.mark.skip(reason="legacy agent_tasks modules removed")
def test_run_raises_on_error(monkeypatch):
    records = _setup_supabase(monkeypatch)
    basket_id = uuid4()
    records["baskets"] = [{"id": str(basket_id), "workspace_id": "ws1"}]

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
            def __init__(self) -> None:
                self.name = name

            def insert(self, data):
                return self

            def select(self, *a, **k):
                return self

            def eq(self, *a, **k):
                return self

            def execute(self):
                if self.name == "baskets":
                    return type(
                        "Resp",
                        (),
                        {
                            "data": [{"workspace_id": "ws1"}],
                            "status_code": 200,
                        },
                    )()
                return type(
                    "Resp",
                    (),
                    {
                        "data": [],
                        "status_code": 500,
                    },
                )()

        return Bad()

    monkeypatch.setattr(module, "supabase", type("S", (), {"table": bad_table}))
    with pytest.raises(HTTPException):
        module.run(basket_id)
