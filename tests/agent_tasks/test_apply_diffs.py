import os
# This legacy test suite is skipped and should not count toward coverage.
if False:  # pragma: no cover
    import sys
    import pytest
    from datetime import datetime
    from uuid import uuid4

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

    import importlib.util
    from pathlib import Path
    from types import ModuleType

    pytest.skip("legacy diff logic removed", allow_module_level=True)

    MODULE_PATH = (
        Path(__file__).resolve().parents[2]
        / "api"
        / "src"
        / "app"
        / "agent_tasks"
        / "orch"
        / "apply_diff_blocks.py"
    )


    class StubTable:
        def __init__(self):
            self.records = []

        def insert(self, data):
            self.records.append(data)
            return self

        def update(self, data):
            self.records.append(data)
            return self

        def eq(self, *a, **k):
            return self

        def execute(self):
            return type("Resp", (), {"data": [{"id": str(uuid4())}]})()


    class StubClient:
        def __init__(self):
            self.table_calls = []
            self.tables = {}

        def table(self, name):
            self.table_calls.append(name)
            tbl = self.tables.setdefault(name, StubTable())
            return tbl


    def test_apply_diffs_inserts_datetime(monkeypatch):
        stub = StubClient()
        monkeypatch.setattr(
            "app.agent_tasks.layer1_infra.utils.supabase_helpers.get_supabase", lambda: stub
        )

        spec = importlib.util.spec_from_file_location(
            "app.agent_tasks.orch.apply_diff_blocks",
            MODULE_PATH,
        )
        module = importlib.util.module_from_spec(spec)
        sys.modules.setdefault("app", ModuleType("app")).__path__ = []
        sys.modules.setdefault("app.agent_tasks", ModuleType("app.agent_tasks")).__path__ = []
        sys.modules.setdefault("app.agent_tasks.orch", ModuleType("app.agent_tasks.orch")).__path__ = []
        helper_mod = ModuleType("supabase_helpers")
        helper_mod.get_supabase = lambda: stub
        sys.modules["app.agent_tasks.layer1_infra.utils.supabase_helpers"] = helper_mod
        sys.modules[spec.name] = module
        assert spec.loader
        spec.loader.exec_module(module)
        apply_diffs = module.apply_diffs

        orig_model_dump = ContextBlock.model_dump

        monkeypatch.setattr(
            ContextBlock,
            "model_dump",
            lambda self, *a, **k: orig_model_dump(self, *a, **k),
            raising=False,
        )
        block = ContextBlock(user_id="u", label="l", content="c", created_at=datetime.utcnow())
        diff = DiffBlock(type="added", new_block=block)

        import asyncio

        asyncio.run(apply_diffs(basket_id="b", diffs=[diff], dry_run=False))

        assert stub.tables["context_blocks"].records
