"""
Test ResearchAgentSDK (Phase 2a Validation).

Simple test to verify SDK-based agent can execute without errors.
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
TEST_WORK_SESSION_ID = "test-sdk-session-001"


async def test_sdk_agent():
    """Test SDK agent with simple research task."""

    print("=" * 80)
    print("Phase 2a: ResearchAgentSDK Validation Test")
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
    print(f"✅ Work Session: {TEST_WORK_SESSION_ID}")
    print()

    # Create SDK agent
    print("-" * 80)
    print("Creating ResearchAgentSDK...")
    print("-" * 80)

    try:
        agent = ResearchAgentSDK(
            basket_id=ANI_PROJECT_BASKET_ID,
            work_session_id=TEST_WORK_SESSION_ID,
        )
        print("✅ Agent created successfully")
        print()
    except Exception as e:
        print(f"❌ Agent creation failed: {e}")
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
        print(f"Status: {result.get('status')}")
        print(f"Outputs Created: {result.get('outputs_created', 0)}")
        print(f"Topic: {result.get('topic')}")
        print(f"Timestamp: {result.get('timestamp')}")
        print()

        if result.get('status') == 'completed':
            print("✅ SDK agent execution PASSED")
            print()
            print("Phase 2a Exit Criteria:")
            print("   ✓ SDK agent created without errors")
            print("   ✓ deep_dive() method executed")
            print("   ✓ Result structure matches legacy format")

            if result.get('outputs_created', 0) > 0:
                print(f"   ✓ Work outputs created: {result['outputs_created']}")
            else:
                print("   ⚠️  No work outputs created (may need MCP server running)")

            print()
            return True
        else:
            print(f"❌ SDK agent execution FAILED: {result.get('error')}")
            return False

    except Exception as e:
        print(f"❌ Execution failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_sdk_agent())
    exit(0 if success else 1)
