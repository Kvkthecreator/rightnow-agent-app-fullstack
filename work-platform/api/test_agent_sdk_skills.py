"""
Test Skills loading - NO YARNNN integration.

This tests:
1. Skills can be discovered from .claude/skills/ directory
2. Agent can invoke "Skill" tool
3. Skill content appears in agent context

Phase 0: Prove Claude Agent SDK Works (Isolated)
"""

import asyncio
import os
from claude_agent_sdk import query, ClaudeAgentOptions


async def test_skills_loading():
    """Test that Skills load from filesystem."""
    print("=" * 60)
    print("Phase 0 Test: Claude Agent SDK Skills Loading")
    print("=" * 60)
    print()

    # Verify ANTHROPIC_API_KEY is set
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ Test failed: ANTHROPIC_API_KEY environment variable not set")
        print("   Set it before running this test")
        return False

    print("Testing Claude Agent SDK Skills loading...")
    print("Expected Skill location: .claude/skills/test-skill/SKILL.md")
    print("This will test the 'Skill' tool invocation...")
    print()

    try:
        result = await query(
            prompt="Can you read the test skill? Use the Skill tool to load it.",
            options=ClaudeAgentOptions(
                max_turns=3,
                allowed_tools=["Skill"]
            )
        )

        response_text = ""
        async for message in result:
            if hasattr(message, 'text'):
                response_text += message.text
                print(f"Agent: {message.text}")

        print()

        if "Skills loading is working" in response_text:
            print("✅ Test passed: Skills loaded correctly")
            print("   - Skill directory discovered")
            print("   - 'Skill' tool invoked successfully")
            print("   - Skill content appeared in context")
            return True
        else:
            print(f"❌ Test failed: Skill not loaded properly")
            print(f"   Response: {response_text}")
            print()
            print("Possible issues:")
            print("   - .claude/skills/test-skill/SKILL.md not found")
            print("   - Skill frontmatter invalid")
            print("   - 'Skill' tool not available")
            return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print()
    print("Phase 0: Testing Skills Loading")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(test_skills_loading())

    print()
    print("=" * 60)
    if success:
        print("PHASE 0 CHECKPOINT: Skills loading test PASSED")
        print("Next: Test subagent delegation")
    else:
        print("PHASE 0 CHECKPOINT: Skills loading test FAILED")
        print("Do NOT proceed until this test passes")
    print("=" * 60)
    print()

    exit(0 if success else 1)
