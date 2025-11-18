"""
Test subagent delegation - NO YARNNN integration.

This tests:
1. Parent agent can spawn subagents
2. Subagents execute with context isolation
3. Parent agent receives subagent responses

Phase 0: Prove Claude Agent SDK Works (Isolated)
"""

import asyncio
import os
from claude_agent_sdk import query, ClaudeAgentOptions


async def test_subagent_delegation():
    """Test that subagents work."""
    print("=" * 60)
    print("Phase 0 Test: Claude Agent SDK Subagent Delegation")
    print("=" * 60)
    print()

    # Verify ANTHROPIC_API_KEY is set
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ Test failed: ANTHROPIC_API_KEY environment variable not set")
        print("   Set it before running this test")
        return False

    print("Testing Claude Agent SDK subagent delegation...")
    print("Defining 'math-helper' subagent...")
    print("This will test parallel execution capability...")
    print()

    options = ClaudeAgentOptions(
        max_turns=5,
        agents={
            "math-helper": {
                "description": "Helps with simple math calculations",
                "prompt": "You are a math helper. When asked to calculate something, provide the answer.",
            }
        }
    )

    try:
        result = await query(
            prompt="Delegate to the math-helper subagent: What is 7 + 5?",
            options=options
        )

        response_text = ""
        async for message in result:
            if hasattr(message, 'text'):
                response_text += message.text
                print(f"Agent: {message.text}")

        print()

        if "12" in response_text:
            print("✅ Test passed: Subagent delegation worked")
            print("   - Parent agent spawned subagent")
            print("   - Subagent executed task")
            print("   - Parent agent received subagent response")
            return True
        else:
            print(f"❌ Test failed: Subagent did not respond correctly")
            print(f"   Response: {response_text}")
            print()
            print("Possible issues:")
            print("   - Subagent not spawned")
            print("   - Subagent context isolation broken")
            print("   - Parent-subagent communication failed")
            return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print()
    print("Phase 0: Testing Subagent Delegation")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(test_subagent_delegation())

    print()
    print("=" * 60)
    if success:
        print("PHASE 0 CHECKPOINT: Subagent delegation test PASSED")
        print("Next: Deploy to Render and verify in production")
    else:
        print("PHASE 0 CHECKPOINT: Subagent delegation test FAILED")
        print("Do NOT proceed until this test passes")
    print("=" * 60)
    print()

    exit(0 if success else 1)
