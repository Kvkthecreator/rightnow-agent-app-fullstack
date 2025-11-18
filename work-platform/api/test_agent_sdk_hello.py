"""
Minimal Claude Agent SDK test - NO YARNNN integration.

This tests:
1. Python SDK can spawn Claude Code CLI subprocess
2. Agent can respond to simple queries
3. Subprocess communication works in container

Phase 0: Prove Claude Agent SDK Works (Isolated)
"""

import asyncio
import os
from claude_agent_sdk import query, ClaudeAgentOptions


async def test_hello_world():
    """Most basic test - can the SDK work at all?"""
    print("=" * 60)
    print("Phase 0 Test: Claude Agent SDK Hello World")
    print("=" * 60)
    print()

    # Verify ANTHROPIC_API_KEY is set
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ Test failed: ANTHROPIC_API_KEY environment variable not set")
        print("   Set it before running this test")
        return False

    print("Testing Claude Agent SDK hello world...")
    print("This will spawn a Claude Code CLI subprocess...")
    print()

    try:
        result = await query(
            prompt="Say 'Hello from Claude Agent SDK!' and nothing else.",
            options=ClaudeAgentOptions(max_turns=1)
        )

        response_text = ""
        async for message in result:
            if hasattr(message, 'text'):
                response_text += message.text
                print(f"Agent: {message.text}")

        print()

        if "Hello from Claude Agent SDK" in response_text:
            print("✅ Test passed: Agent responded correctly")
            print("   - Python SDK spawned Claude Code CLI successfully")
            print("   - Subprocess communication works")
            print("   - Agent API call succeeded")
            return True
        else:
            print(f"❌ Test failed: Unexpected response: {response_text}")
            return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print()
    print("Phase 0: Testing Claude Agent SDK Infrastructure")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(test_hello_world())

    print()
    print("=" * 60)
    if success:
        print("PHASE 0 CHECKPOINT: Basic SDK test PASSED")
        print("Next: Test Skills loading")
    else:
        print("PHASE 0 CHECKPOINT: Basic SDK test FAILED")
        print("Do NOT proceed until this test passes")
    print("=" * 60)
    print()

    exit(0 if success else 1)
