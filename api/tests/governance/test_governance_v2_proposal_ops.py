"""Tests that GovernanceDumpProcessorV2 creates proposals whose ops
contain CreateBlock and/or CreateContextItem operations (no direct substrate).

We patch the P1SubstrateAgentV2 to avoid LLM calls and the Supabase client
to capture inserted proposals.
"""

import types
from uuid import uuid4
from unittest.mock import patch

import pytest


class MockQuery:
    def __init__(self, table_name, store):
        self.table_name = table_name
        self._filters = []
        self._single = False
        self._inserted = []
        self._store = store

    def select(self, cols="*"):
        return self

    def insert(self, data):
        # Normalize to list of records
        if isinstance(data, list):
            self._inserted.extend(data)
        else:
            self._inserted.append(data)
        return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def in_(self, col, vals):
        self._filters.append((col, set(vals)))
        return self

    def single(self):
        self._single = True
        return self

    def execute(self):
        # On insert, push into store and return the inserted rows
        if self._inserted:
            # Assign ids if missing
            for rec in self._inserted:
                rec.setdefault('id', str(uuid4()))
            self._store.setdefault(self.table_name, []).extend(self._inserted)
            data = list(self._inserted)
            self._inserted = []
            return types.SimpleNamespace(data=data)

        # On select, return from store with naive filter support
        data = list(self._store.get(self.table_name, []))
        for col, val in self._filters:
            if isinstance(val, set):
                data = [r for r in data if r.get(col) in val]
            else:
                data = [r for r in data if r.get(col) == val]

        if self._single:
            return types.SimpleNamespace(data=(data[0] if data else None))
        return types.SimpleNamespace(data=data)


class MockSupabase:
    def __init__(self):
        self._store = {}

    def table(self, table_name):
        return MockQuery(table_name, self._store)


@pytest.mark.asyncio
async def test_governance_v2_proposal_ops_include_block_and_context_item(monkeypatch):
    # Patch the module under test imports
    import os
    os.environ.setdefault('SUPABASE_URL', 'http://localhost')
    os.environ.setdefault('SUPABASE_ANON_KEY', 'test-anon')
    os.environ.setdefault('SUPABASE_SERVICE_ROLE_KEY', 'test-service')

    # Ensure local 'supabase' folder does not shadow pip package by injecting a fake
    import sys, types as _types
    _fake_pkg = _types.SimpleNamespace(create_client=lambda *_a, **_k: object(), Client=object)
    sys.modules['supabase'] = _fake_pkg

    from app.agents.pipeline.governance_processor_v2 import GovernanceDumpProcessorV2

    mock_supabase = MockSupabase()

    # Patch supabase client inside the module
    monkeypatch.setattr(
        "app.agents.pipeline.governance_processor_v2.supabase",
        mock_supabase,
        raising=True,
    )

    # Create processor and patch governance flag + P1 agent
    proc = GovernanceDumpProcessorV2()

    async def _check_governance_enabled(_ws):
        return True

    monkeypatch.setattr(proc, "_check_governance_enabled", _check_governance_enabled, raising=True)

    class FakeP1:
        async def create_substrate(self, req):
            # Return one structured block; context items are inferred at approval stage
            return {
                "blocks_created": [
                    {
                        "title": "Strategic Goal",
                        "semantic_type": "goal",
                        "metadata": {"knowledge_ingredients": {
                            "goals": [{"name": "Improve NPS"}],
                            "entities": [{"name": "Customer Success", "type": "team", "confidence": 0.9}]
                        }},
                        "confidence_score": 0.82,
                    }
                ],
                "agent_confidence": 0.82,
            }

    # Inject fake P1 agent
    proc.p1_agent = FakeP1()

    # Inputs
    dump_id = uuid4()
    basket_id = uuid4()
    workspace_id = uuid4()

    # Act
    result = await proc.process_dump(dump_id, basket_id, workspace_id)

    # Assert proposals created
    assert result["proposals_created"] >= 1

    proposals = mock_supabase._store.get("proposals", [])
    assert len(proposals) >= 1

    # Validate ops include CreateBlock with expected fields
    ops = proposals[0].get("ops")
    assert isinstance(ops, list) and len(ops) >= 1
    assert ops[0]["type"] == "CreateBlock"
    assert set(ops[0]["data"].keys()) >= {"title", "semantic_type", "metadata", "confidence"}

    # Optionally verify a derived CreateContextItem op exists
    types = {op.get("type") for op in ops}
    assert "CreateBlock" in types
    assert ("CreateContextItem" in types)  # derived from entities
