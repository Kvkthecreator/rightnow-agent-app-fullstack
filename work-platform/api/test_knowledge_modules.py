#!/usr/bin/env python3
"""
Test script for Phase 2d Knowledge Modules refactoring

Validates:
1. KnowledgeModuleLoader can load modules
2. ResearchAgentSDK receives knowledge_modules correctly
3. System prompt includes knowledge modules
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from work_orchestration import KnowledgeModuleLoader
from agents_sdk import ResearchAgentSDK


def test_knowledge_module_loader():
    """Test KnowledgeModuleLoader can load modules for research agent."""
    print("\n" + "="*80)
    print("TEST 1: KnowledgeModuleLoader")
    print("="*80)

    loader = KnowledgeModuleLoader()

    # Load for research agent
    knowledge_modules = loader.load_for_agent("research")

    # Validate
    assert knowledge_modules, "Knowledge modules should not be empty"
    assert "research_methodology" in knowledge_modules.lower(), "Should contain research methodology"
    assert "quality_standards" in knowledge_modules.lower(), "Should contain quality standards"
    assert "substrate_patterns" in knowledge_modules.lower(), "Should contain substrate patterns"

    print(f"✅ Loaded {len(knowledge_modules)} characters of knowledge modules")
    print(f"✅ Contains expected module sections")

    # Show snippet
    snippet = knowledge_modules[:500]
    print(f"\nSnippet (first 500 chars):\n{snippet}...")

    return knowledge_modules


async def test_research_agent_sdk(knowledge_modules: str):
    """Test ResearchAgentSDK receives and uses knowledge modules."""
    print("\n" + "="*80)
    print("TEST 2: ResearchAgentSDK Integration")
    print("="*80)

    # Check env vars
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("⚠️  ANTHROPIC_API_KEY not set - will test initialization only")

    # Create agent with knowledge modules
    agent = ResearchAgentSDK(
        basket_id="5004b9e1-67f5-4955-b028-389d45b1f5a4",
        workspace_id="test-workspace",
        work_session_id="test-session",
        knowledge_modules=knowledge_modules,
        anthropic_api_key=api_key  # Will use env var if None
    )

    print(f"✅ ResearchAgentSDK initialized successfully")
    print(f"✅ Knowledge modules parameter: {len(knowledge_modules)} chars")

    # Check that system prompt includes knowledge modules
    system_prompt = agent._get_default_system_prompt()

    assert "YARNNN Knowledge Modules" in system_prompt, "System prompt should include knowledge modules section"
    assert "research_methodology" in system_prompt.lower(), "System prompt should contain research methodology"

    print(f"✅ System prompt includes knowledge modules ({len(system_prompt)} chars total)")

    # Show snippet of system prompt where knowledge modules appear
    km_index = system_prompt.find("YARNNN Knowledge Modules")
    if km_index != -1:
        snippet = system_prompt[km_index:km_index+500]
        print(f"\nSystem Prompt Snippet (Knowledge Modules section):\n{snippet}...")

    return agent


def test_content_agent_sdk(knowledge_modules: str):
    """Test ContentAgentSDK receives knowledge modules."""
    print("\n" + "="*80)
    print("TEST 3: ContentAgentSDK Integration")
    print("="*80)

    from agents_sdk import ContentAgentSDK

    loader = KnowledgeModuleLoader()
    content_km = loader.load_for_agent("content")

    agent = ContentAgentSDK(
        basket_id="5004b9e1-67f5-4955-b028-389d45b1f5a4",
        workspace_id="test-workspace",
        knowledge_modules=content_km,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    print(f"✅ ContentAgentSDK initialized with {len(content_km)} chars of knowledge modules")

    # Check system prompt
    if hasattr(agent, 'system_prompt'):
        assert "YARNNN Knowledge Modules" in agent.system_prompt
        print(f"✅ System prompt includes knowledge modules")


def test_reporting_agent_sdk(knowledge_modules: str):
    """Test ReportingAgentSDK receives knowledge modules."""
    print("\n" + "="*80)
    print("TEST 4: ReportingAgentSDK Integration")
    print("="*80)

    from agents_sdk import ReportingAgentSDK

    loader = KnowledgeModuleLoader()
    reporting_km = loader.load_for_agent("reporting")

    agent = ReportingAgentSDK(
        basket_id="5004b9e1-67f5-4955-b028-389d45b1f5a4",
        workspace_id="test-workspace",
        knowledge_modules=reporting_km,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    print(f"✅ ReportingAgentSDK initialized with {len(reporting_km)} chars of knowledge modules")

    # Check system prompt
    if hasattr(agent, 'system_prompt'):
        assert "YARNNN Knowledge Modules" in agent.system_prompt
        print(f"✅ System prompt includes knowledge modules")


async def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("PHASE 2d KNOWLEDGE MODULES REFACTORING - TEST SUITE")
    print("="*80)

    try:
        # Test 1: KnowledgeModuleLoader
        knowledge_modules = test_knowledge_module_loader()

        # Test 2: ResearchAgentSDK
        agent = await test_research_agent_sdk(knowledge_modules)

        # Test 3: ContentAgentSDK
        test_content_agent_sdk(knowledge_modules)

        # Test 4: ReportingAgentSDK
        test_reporting_agent_sdk(knowledge_modules)

        print("\n" + "="*80)
        print("ALL TESTS PASSED ✅")
        print("="*80)
        print("\nPhase 2d Knowledge Modules refactoring is working correctly!")
        print("\nNext: Deploy and test in production environment")

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
