"""
Phase 2: Black-box SDK output test.

This test executes the mock SDK to document:
1. What the SDK agents return
2. How output maps to work_outputs table
3. Checkpoint detection logic

Run with: python -m pytest tests/test_sdk_black_box.py -v
"""

import asyncio
import json
try:
    import pytest
except ImportError:
    pytest = None  # Allow running without pytest
from unittest.mock import AsyncMock, MagicMock, patch

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from claude_agent_sdk.archetypes import ResearchAgent, ContentCreatorAgent, ReportingAgent
from claude_agent_sdk.interfaces import Context, MemoryProvider
from services.agent_sdk_client import AgentSDKClient


class MockMemoryProvider(MemoryProvider):
    """Simple mock for testing."""

    async def query(self, query, filters=None, limit=20):
        return [
            Context(
                content="Mock block: Competitor analysis",
                metadata={"id": "block-1", "semantic_type": "knowledge"}
            )
        ]

    async def store(self, context):
        return "mock-dump-id"

    async def get_all(self, filters=None):
        return await self.query("")


async def test_research_agent_output_structure():
    """
    Document ResearchAgent output structure.

    Key findings:
    - Returns ResearchResult dataclass
    - Has .findings list of ResearchFinding
    - Each finding has: content, confidence, sources, domain
    - Has .needs_review bool
    - Has .review_reason string
    """
    memory = MockMemoryProvider()

    agent = ResearchAgent(
        agent_id="test_research",
        memory=memory,
        governance=None,
        anthropic_api_key="test-key",
        monitoring_domains=["ai_agents", "market_trends"],
        monitoring_frequency="daily",
        signal_threshold=0.7,
        synthesis_mode="insights"
    )

    result = await agent.execute(
        task="Research AI agent market trends",
        context={}
    )

    # Document structure
    print("\n=== RESEARCH AGENT OUTPUT STRUCTURE ===")
    print(f"Type: {type(result).__name__}")
    print(f"Has .findings: {hasattr(result, 'findings')}")
    print(f"Findings count: {len(result.findings)}")
    print(f"Has .needs_review: {hasattr(result, 'needs_review')}")
    print(f"needs_review value: {result.needs_review}")
    print(f"Has .review_reason: {hasattr(result, 'review_reason')}")

    # Document finding structure
    if result.findings:
        finding = result.findings[0]
        print("\n--- Finding structure ---")
        print(f"  .content: {type(finding.content).__name__} = {finding.content[:50]}...")
        print(f"  .confidence: {type(finding.confidence).__name__} = {finding.confidence}")
        print(f"  .sources: {type(finding.sources).__name__} = {finding.sources}")
        print(f"  .domain: {type(finding.domain).__name__} = {finding.domain}")

    # Assert expected structure
    assert hasattr(result, "findings")
    assert hasattr(result, "needs_review")
    assert isinstance(result.findings, list)
    assert len(result.findings) > 0
    assert hasattr(result.findings[0], "content")
    assert hasattr(result.findings[0], "confidence")


async def test_content_agent_output_structure():
    """
    Document ContentCreatorAgent output structure.
    """
    memory = MockMemoryProvider()

    agent = ContentCreatorAgent(
        agent_id="test_content",
        memory=memory,
        governance=None,
        anthropic_api_key="test-key",
        enabled_platforms=["linkedin", "twitter"],
        brand_voice_mode="professional",
        voice_temperature=0.7
    )

    result = await agent.execute(
        task="Write LinkedIn post about AI agents",
        context={}
    )

    print("\n=== CONTENT AGENT OUTPUT STRUCTURE ===")
    print(f"Type: {type(result).__name__}")
    print(f"Has .variations: {hasattr(result, 'variations')}")
    print(f"Variations count: {len(result.variations)}")

    if result.variations:
        variation = result.variations[0]
        print("\n--- Variation structure ---")
        print(f"  .text: {variation.text[:50]}...")
        print(f"  .platform: {variation.platform}")
        print(f"  .tone: {variation.tone}")
        print(f"  .requires_review: {variation.requires_review}")

    assert hasattr(result, "variations")
    assert len(result.variations) > 0


async def test_reporting_agent_output_structure():
    """
    Document ReportingAgent output structure.
    """
    memory = MockMemoryProvider()

    agent = ReportingAgent(
        agent_id="test_reporting",
        memory=memory,
        governance=None,
        anthropic_api_key="test-key",
        default_format="pdf",
        template_library="standard"
    )

    result = await agent.execute(
        task="Generate weekly competitor report",
        context={}
    )

    print("\n=== REPORTING AGENT OUTPUT STRUCTURE ===")
    print(f"Type: {type(result).__name__}")
    print(f"Has .report: {hasattr(result, 'report')}")

    if result.report:
        print("\n--- Report structure ---")
        print(f"  .content: {result.report.content[:50]}...")
        print(f"  .type: {result.report.type}")
        print(f"  .sections: {result.report.sections}")
        print(f"  .charts: {result.report.charts}")

    assert hasattr(result, "report")
    assert hasattr(result.report, "content")


async def test_output_parsing_to_work_outputs():
    """
    Test that AgentSDKClient correctly parses SDK output into work_outputs format.

    This is the critical bridge between SDK output and our database.
    """
    client = AgentSDKClient()

    # Create mock research result
    from claude_agent_sdk.archetypes import ResearchResult, ResearchFinding

    mock_result = ResearchResult(
        findings=[
            ResearchFinding(
                content="AI agent market growing 40% YoY",
                confidence=0.92,
                sources=["gartner.com", "mckinsey.com"],
                domain="ai_agents"
            ),
            ResearchFinding(
                content="New competitor launched: AgentForce",
                confidence=0.65,
                sources=["techcrunch.com"],
                domain="competitors"
            )
        ],
        needs_review=True,
        review_reason="Low confidence finding requires review"
    )

    # Parse output
    parsed = client._parse_agent_output(mock_result)

    print("\n=== PARSED WORK_OUTPUTS ===")
    for i, output in enumerate(parsed):
        print(f"\nOutput {i+1}:")
        print(json.dumps(output, indent=2))

    # Verify parsing
    assert len(parsed) == 2
    assert parsed[0]["output_type"] == "research_finding"
    assert parsed[0]["content"] == "AI agent market growing 40% YoY"
    assert parsed[0]["metadata"]["confidence"] == 0.92
    assert parsed[0]["metadata"]["sources"] == ["gartner.com", "mckinsey.com"]

    # Verify low-confidence finding
    assert parsed[1]["metadata"]["confidence"] == 0.65


async def test_checkpoint_detection():
    """
    Test checkpoint detection logic.

    Checkpoints are triggered when:
    - Agent explicitly requests review (needs_review=True)
    - Low confidence findings detected
    - Sensitive content flagged
    """
    client = AgentSDKClient()

    # Test 1: Low confidence triggers checkpoint
    from claude_agent_sdk.archetypes import ResearchResult, ResearchFinding

    result_with_low_confidence = ResearchResult(
        findings=[
            ResearchFinding(content="Test", confidence=0.5, sources=[], domain="test")
        ],
        needs_review=False
    )

    checkpoint_reason = client._detect_checkpoint_need(
        result_with_low_confidence,
        {}
    )

    print("\n=== CHECKPOINT DETECTION ===")
    print(f"Low confidence (0.5) triggers checkpoint: {checkpoint_reason is not None}")
    assert checkpoint_reason is not None
    assert "low-confidence" in checkpoint_reason.lower()

    # Test 2: High confidence doesn't trigger checkpoint
    result_high_confidence = ResearchResult(
        findings=[
            ResearchFinding(content="Test", confidence=0.9, sources=[], domain="test")
        ],
        needs_review=False
    )

    no_checkpoint = client._detect_checkpoint_need(result_high_confidence, {})
    print(f"High confidence (0.9) triggers checkpoint: {no_checkpoint is not None}")
    assert no_checkpoint is None


if __name__ == "__main__":
    # Run tests directly
    asyncio.run(test_research_agent_output_structure())
    asyncio.run(test_content_agent_output_structure())
    asyncio.run(test_reporting_agent_output_structure())
    asyncio.run(test_output_parsing_to_work_outputs())
    asyncio.run(test_checkpoint_detection())
    print("\n✅ All black-box tests passed!")
