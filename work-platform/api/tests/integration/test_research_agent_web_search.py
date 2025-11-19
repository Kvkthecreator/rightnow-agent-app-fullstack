"""
Integration test for ResearchAgentSDK web search functionality.

Tests that the research agent can successfully use web_search tool to:
- Search for current information
- Emit structured work outputs based on search results
- Include evidence/citations from web sources

Prerequisites:
- ANTHROPIC_API_KEY environment variable
- Web search enabled in Claude Console (org-level)

Run with: pytest tests/integration/test_research_agent_web_search.py -v
"""

import os
import pytest
from uuid import uuid4

# Import ResearchAgentSDK
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))

from agents_sdk.research_agent import ResearchAgentSDK


@pytest.fixture
def anthropic_api_key():
    """Get Anthropic API key from environment"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        pytest.skip("ANTHROPIC_API_KEY not set")
    return api_key


@pytest.fixture
def test_basket_id():
    """Generate test basket ID"""
    return str(uuid4())


@pytest.fixture
def test_workspace_id():
    """Generate test workspace ID"""
    return str(uuid4())


@pytest.fixture
def test_work_ticket_id():
    """Generate test work ticket ID"""
    return str(uuid4())


@pytest.mark.asyncio
async def test_research_agent_web_search_enabled(
    anthropic_api_key,
    test_basket_id,
    test_workspace_id,
    test_work_ticket_id
):
    """Test that ResearchAgentSDK can use web_search tool"""

    # Initialize agent
    agent = ResearchAgentSDK(
        basket_id=test_basket_id,
        workspace_id=test_workspace_id,
        work_ticket_id=test_work_ticket_id,
        anthropic_api_key=anthropic_api_key,
    )

    # Research task that requires current information
    # (Forces Claude to search the web, not rely on training data)
    result = await agent.deep_dive(
        "What are the most popular AI agent frameworks released in November 2025? "
        "Focus on frameworks with GitHub repos and active development."
    )

    # Validate response structure
    assert "work_outputs" in result
    assert "topic" in result
    assert "output_count" in result

    # Should have found some findings
    assert len(result["work_outputs"]) > 0, "No work outputs generated"

    # Check that at least one output mentions web sources
    # (Evidence that web_search was used)
    has_web_citation = False
    for output in result["work_outputs"]:
        body = output.get("body", "")
        if any(indicator in body for indicator in ["http", "https", "www.", ".com", "github"]):
            has_web_citation = True
            break

    assert has_web_citation, "No web citations found - web_search may not have been used"

    print(f"\n✅ Research agent successfully used web search!")
    print(f"   Generated {result['output_count']} outputs")
    print(f"   Topics: {[o.get('output_type') for o in result['work_outputs']]}")


@pytest.mark.asyncio
async def test_research_agent_web_search_with_specific_topic(
    anthropic_api_key,
    test_basket_id,
    test_workspace_id,
    test_work_ticket_id
):
    """Test web search with specific research query"""

    agent = ResearchAgentSDK(
        basket_id=test_basket_id,
        workspace_id=test_workspace_id,
        work_ticket_id=test_work_ticket_id,
        anthropic_api_key=anthropic_api_key,
    )

    # Specific research query
    result = await agent.deep_dive(
        "Research Claude Agent SDK Skills feature. "
        "What file formats can it generate? Include official documentation references."
    )

    # Validate structured outputs
    assert result["output_count"] > 0

    # At least one output should mention file formats
    found_file_format_mention = False
    for output in result["work_outputs"]:
        body = output.get("body", "").lower()
        if any(fmt in body for fmt in ["pdf", "xlsx", "docx", "pptx", "skill"]):
            found_file_format_mention = True
            break

    assert found_file_format_mention, "Research didn't find file format information"

    print(f"\n✅ Research query successful!")
    print(f"   Found {result['output_count']} structured outputs")


@pytest.mark.asyncio
async def test_research_agent_emits_structured_outputs(
    anthropic_api_key,
    test_basket_id,
    test_workspace_id,
    test_work_ticket_id
):
    """Test that research agent emits properly structured work outputs"""

    agent = ResearchAgentSDK(
        basket_id=test_basket_id,
        workspace_id=test_workspace_id,
        work_ticket_id=test_work_ticket_id,
        anthropic_api_key=anthropic_api_key,
    )

    result = await agent.deep_dive("What is Claude Sonnet 4.5?")

    # Validate work_outputs structure
    for output in result["work_outputs"]:
        # Required fields
        assert "output_type" in output, "Missing output_type"
        assert "title" in output, "Missing title"
        assert "body" in output, "Missing body"
        assert "generation_method" in output, "Missing generation_method"

        # output_type should be valid
        valid_types = ["finding", "recommendation", "insight", "draft_content", "report_section", "data_analysis"]
        assert output["output_type"] in valid_types, f"Invalid output_type: {output['output_type']}"

        # generation_method should be 'text' (not 'skill' for text outputs)
        assert output["generation_method"] == "text"

    print(f"\n✅ All outputs properly structured!")


if __name__ == "__main__":
    # Run tests manually
    print("Running ResearchAgentSDK web search integration tests...")
    print("=" * 70)

    # Check environment
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY not set. Skipping tests.")
        exit(1)

    # Run with pytest
    import subprocess
    result = subprocess.run(
        ["pytest", __file__, "-v", "--tb=short", "-s"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

    exit(result.returncode)
