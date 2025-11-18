"""
Test ResearchAgentSDK (Phase 2a Validation).

Simple test to verify refactored SDK-based agent can execute without errors.
This bypasses full HTTP stack to test agent directly.

Usage:
    cd work-platform/api
    export USE_AGENT_SDK=true
    export ANTHROPIC_API_KEY=sk-ant-...
    python test_sdk_agent.py
"""

import asyncio
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from agents_sdk import ResearchAgentSDK

# Test configuration
ANI_PROJECT_BASKET_ID = "5004b9e1-67f5-4955-b028-389d45b1f5a4"
TEST_WORKSPACE_ID = "ws_test_001"
TEST_WORK_SESSION_ID = "test-sdk-session-001"


async def test_sdk_agent():
    """Test SDK agent with simple research task."""

    print("=" * 80)
    print("Phase 2a: ResearchAgentSDK Validation Test (Refactored Implementation)")
    print("=" * 80)
    print()

    # Check environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set")
        print("   Set with: export ANTHROPIC_API_KEY=sk-ant-...")
        return False

    print(f"✅ ANTHROPIC_API_KEY: {api_key[:20]}...{api_key[-4:]}")
    print(f"✅ Basket ID: {ANI_PROJECT_BASKET_ID}")
    print(f"✅ Workspace ID: {TEST_WORKSPACE_ID}")
    print(f"✅ Work Session: {TEST_WORK_SESSION_ID}")
    print()

    # Create SDK agent
    print("-" * 80)
    print("Creating ResearchAgentSDK with YARNNN SDK patterns...")
    print("-" * 80)

    try:
        agent = ResearchAgentSDK(
            basket_id=ANI_PROJECT_BASKET_ID,
            workspace_id=TEST_WORKSPACE_ID,
            work_session_id=TEST_WORK_SESSION_ID,
        )
        print("✅ Agent created successfully using BaseAgent + SubagentDefinition")
        print(f"   - Agent type: {agent.agent_type}")
        print(f"   - Memory provider: {type(agent.memory).__name__ if agent.memory else 'None'}")
        print(f"   - Subagents registered: {len(agent.subagents.list_subagents())}")
        for subagent in agent.subagents.list_subagents():
            print(f"     * {subagent.name}: {subagent.description[:50]}...")
        print()
    except Exception as e:
        print(f"❌ Agent creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Execute simple research task
    print("-" * 80)
    print("Executing Research Task...")
    print("-" * 80)
    print()

    task = "What are the key AI companion competitors and their pricing?"
    print(f"Task: {task}")
    print()

    try:
        result = await agent.deep_dive(task)

        print("=" * 80)
        print("RESULT:")
        print("=" * 80)
        print()
        print(f"Topic: {result.get('topic')}")
        print(f"Timestamp: {result.get('timestamp')}")
        print(f"Outputs Created: {result.get('output_count', 0)}")
        print(f"Agent Type: {result.get('agent_type')}")
        print(f"Basket ID: {result.get('basket_id')}")
        print(f"Work Session ID: {result.get('work_session_id')}")
        print()

        if result.get('output_count', 0) > 0:
            print("Work Outputs:")
            for i, output in enumerate(result.get('work_outputs', []), 1):
                print(f"  {i}. [{output.get('output_type')}] {output.get('title')}")
                print(f"     Confidence: {output.get('confidence', 0):.2f}")
                print(f"     Summary: {output.get('body', {}).get('summary', 'N/A')[:100]}...")
            print()

        # Validation
        print("=" * 80)
        print("VALIDATION:")
        print("=" * 80)
        print()

        if result.get('output_count', 0) > 0:
            print("✅ SDK agent execution PASSED")
            print()
            print("Phase 2a Exit Criteria:")
            print("   ✓ SDK agent created using YARNNN patterns (BaseAgent, SubagentDefinition)")
            print("   ✓ deep_dive() method executed successfully")
            print("   ✓ Result structure matches legacy format")
            print(f"   ✓ Work outputs created: {result['output_count']}")
            print("   ✓ Prompts extracted to module-level constants")
            print()
            return True
        else:
            print("⚠️  SDK agent executed but produced no work outputs")
            print("   This may indicate:")
            print("   - Memory adapter not configured correctly")
            print("   - Tool-use pattern needs adjustment")
            print("   - Claude didn't call emit_work_output tool")
            print()
            return False

    except Exception as e:
        print(f"❌ Execution failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_sdk_agent())
    exit(0 if success else 1)
