#!/usr/bin/env python3
"""
Quick test script to execute research agent with Claude API.
Runs locally to test the agent logic without needing to deploy.
"""

import asyncio
import json
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from dotenv import load_dotenv
load_dotenv()

# Check for API key
if not os.environ.get("ANTHROPIC_API_KEY"):
    print("ERROR: ANTHROPIC_API_KEY not set. Please add to .env file.")
    sys.exit(1)

async def main():
    # Import after path setup
    from claude_agent_sdk.archetypes import ResearchAgent, ResearchResult
    from adapters.memory_adapter import SubstrateMemoryAdapter

    # Configuration from our database
    agent_config = {
        "research": {
            "topics": [
                "AI knowledge management tools market 2024",
                "Autonomous agent adoption trends",
                "Human-AI collaboration patterns"
            ],
            "competitors": [
                {"name": "Notion AI", "focus": "AI-enhanced note-taking and workspace", "priority": "high"},
                {"name": "Mem.ai", "focus": "AI-native knowledge management", "priority": "high"},
                {"name": "Roam Research", "focus": "Networked thought and backlinking", "priority": "medium"}
            ],
            "data_sources": {
                "high_reliability": ["techcrunch.com", "anthropic.com", "openai.com"],
                "medium_reliability": ["venturebeat.com", "theverge.com"],
                "monitor_only": ["news.ycombinator.com", "reddit.com/r/artificial"]
            },
            "output_preferences": {
                "finding_type": "insight",
                "include_actionable_recommendations": True,
                "max_findings_per_run": 5,
                "min_confidence_to_include": 0.6
            }
        }
    }

    print("=" * 60)
    print("RESEARCH AGENT TEST - Claude API Integration")
    print("=" * 60)

    # Create memory adapter (will try to connect to substrate-api)
    # For local test, we'll mock the memory adapter's config injection
    basket_id = "5004b9e1-67f5-4955-b028-389d45b1f5a4"
    workspace_id = "99e6bf7d-513c-45ff-9b96-9362bd914d12"

    print(f"\n📦 Basket ID: {basket_id}")
    print(f"🏢 Workspace ID: {workspace_id}")

    # Create agent
    print("\n🤖 Creating ResearchAgent...")
    agent = ResearchAgent(
        basket_id=basket_id,
        workspace_id=workspace_id,
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )

    # Mock the memory adapter to return our config
    # This simulates what SubstrateMemoryAdapter does
    class MockMemoryAdapter:
        def __init__(self, config):
            self._config = config

        async def query(self, query, limit=10):
            # Return context with injected config
            from claude_agent_sdk.archetypes import Context

            # First context item contains agent config (as SubstrateMemoryAdapter does)
            metadata_context = Context(
                content="[AGENT EXECUTION CONTEXT]",
                metadata={"agent_config": self._config}
            )

            # Add a sample substrate block for context
            sample_block = Context(
                content="YARNNN is building an AI-native knowledge management platform focused on autonomous agents that help users organize and synthesize information. Key differentiator is human-AI collaboration with governance controls.",
                metadata={
                    "block_id": "sample-block-1",
                    "semantic_type": "knowledge",
                    "state": "ACCEPTED"
                }
            )

            return [metadata_context, sample_block]

        async def store(self, context):
            return "stored-context-id"

    agent.memory = MockMemoryAdapter(agent_config)

    # Define task
    task = "Research AI knowledge management tools competitive landscape focusing on Notion AI and Mem.ai positioning"

    print(f"\n📝 Task: {task}")
    print("\n🔄 Executing agent with Claude API...")
    print("   (This will make a real API call to Claude)")

    # Execute
    try:
        result: ResearchResult = await agent.execute(
            task=task,
            context={"task": task}
        )

        print("\n✅ Agent execution completed!")
        print(f"\n📊 Results: {len(result.findings)} findings generated")

        # Display findings
        for i, finding in enumerate(result.findings):
            print(f"\n{'=' * 60}")
            print(f"FINDING #{i+1}")
            print(f"{'=' * 60}")
            print(f"Content: {finding.content}")
            print(f"Confidence: {finding.confidence:.0%}")
            print(f"Domain: {finding.domain}")

            if finding.sources:
                print(f"Sources: {', '.join(finding.sources)}")

            # Check for enhanced metadata
            if hasattr(finding, "reasoning") and finding.reasoning:
                print(f"Reasoning: {finding.reasoning}")

            if hasattr(finding, "actionable_recommendations") and finding.actionable_recommendations:
                print("Recommendations:")
                for rec in finding.actionable_recommendations:
                    print(f"  - {rec}")

        # Check for review flag
        if result.needs_review:
            print(f"\n⚠️  Agent requested review: {result.review_reason}")

        print(f"\n{'=' * 60}")
        print("RAW RESULT (for debugging)")
        print(f"{'=' * 60}")
        print(json.dumps({
            "findings_count": len(result.findings),
            "needs_review": result.needs_review,
            "review_reason": result.review_reason,
            "sample_finding": {
                "content": result.findings[0].content if result.findings else None,
                "confidence": result.findings[0].confidence if result.findings else None,
                "sources": result.findings[0].sources if result.findings else None,
            }
        }, indent=2))

    except Exception as e:
        print(f"\n❌ Execution failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
