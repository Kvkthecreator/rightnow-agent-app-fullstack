import os
import sys
import types

import pytest

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "service-role")


class _StubSupabaseClient:
    def __init__(self):
        self.postgrest = types.SimpleNamespace(auth=lambda *_args, **_kwargs: None)

    def table(self, *_args, **_kwargs):  # pragma: no cover - not exercised in tests
        raise NotImplementedError("Supabase table access should be mocked in unit tests")


_supabase_module = types.ModuleType("supabase")
_supabase_module.create_client = lambda *_args, **_kwargs: _StubSupabaseClient()
_supabase_module.Client = _StubSupabaseClient
sys.modules["supabase"] = _supabase_module

from app.agents.pipeline.composition_agent import P4CompositionAgent
from services.llm import LLMResponse


class _StubLLM:
    """Simple stub provider for deterministic P4 section generation tests."""

    def __init__(self, *, text_responses):
        self._text_responses = list(text_responses)

    async def get_text_response(self, *_args, **_kwargs):
        if not self._text_responses:
            raise AssertionError("Unexpected additional text response request")
        return self._text_responses.pop(0)

    async def get_json_response(self, *_args, **_kwargs):  # pragma: no cover - not used in tests
        raise AssertionError("JSON response path should not be invoked in section tests")


@pytest.mark.asyncio
async def test_generate_section_content_success(monkeypatch):
    stub_llm = _StubLLM(
        text_responses=[
            LLMResponse(success=True, content="  Generated narrative  ", parsed=None, usage=None, error=None)
        ]
    )
    monkeypatch.setattr("app.agents.pipeline.composition_agent.get_llm", lambda: stub_llm)

    agent = P4CompositionAgent()

    section = {
        "title": "Connected Impact",
        "content": "Discuss how updates influenced downstream work",
        "substrate_refs": ["block"],
        "relationship_focus": "causal chains"
    }
    selected_substrate = [
        {"type": "block", "content": "Upstream change triggered new data flows"},
        {"type": "dump", "content": "Additional raw context that should be ignored"},
    ]
    narrative = {"summary": "Integration summary", "synthesis_approach": "Connect"}

    result = await agent._generate_section_content(section, selected_substrate, narrative)

    assert result == "Generated narrative"


@pytest.mark.asyncio
async def test_generate_section_content_failure_falls_back_to_outline(monkeypatch):
    stub_llm = _StubLLM(
        text_responses=[LLMResponse(success=False, content="", parsed=None, usage=None, error="rate limit")]
    )
    monkeypatch.setattr("app.agents.pipeline.composition_agent.get_llm", lambda: stub_llm)

    agent = P4CompositionAgent()

    section = {
        "title": "Relationship Mapping",
        "content": "Outline relationships when generation fails",
        "substrate_refs": [],
    }
    selected_substrate = [
        {"type": "context_item", "content": "Entity details"},
    ]
    narrative = {"summary": "Failure summary", "synthesis_approach": "Fallback"}

    result = await agent._generate_section_content(section, selected_substrate, narrative)

    assert result == section["content"]
