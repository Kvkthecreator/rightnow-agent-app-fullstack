import importlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

import pytest


def test_log_insert(monkeypatch):
    records = {}

    class StubTable:
        def insert(self, data):
            records.update(data)
            return self

        def execute(self):
            return None

    class StubClient:
        def table(self, name):
            assert name == "agent_events"
            return StubTable()

    supabase_mod = importlib.import_module("supabase")
    monkeypatch.setattr(supabase_mod, "create_client", lambda *a, **k: StubClient())
    if "app.utils.supabase_client" in sys.modules:
        del sys.modules["app.utils.supabase_client"]
    event_log = importlib.import_module("utils.event_log")

    import asyncio
    asyncio.run(event_log.log_event(basket_id="b", agent="a", phase="start", payload={}))
    assert records["agent"] == "a"
    assert records["phase"] == "start"
