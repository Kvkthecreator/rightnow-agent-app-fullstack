"""
Standalone Integration Test for Thinking Partner Agent

Runs without pytest dependency for quick validation.
"""

import asyncio
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

# Check required environment variables
required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print("ERROR: Missing required environment variables:")
    for var in missing_vars:
        print(f"  - {var}")
    print("\nSet them with:")
    print("  export SUPABASE_URL='https://your-project.supabase.co'")
    print("  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
    print("  export ANTHROPIC_API_KEY='your-anthropic-api-key'")
    sys.exit(1)

# Environment variables already set by shell
os.environ["SUPABASE_URL"] = os.getenv("SUPABASE_URL")
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
os.environ["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_API_KEY")

from agents_sdk.thinking_partner import ThinkingPartnerAgent, create_thinking_partner

# Test configuration
TEST_BASKET_ID = "5004b9e1-67f5-4955-b028-389d45b1f5a4"
TEST_WORKSPACE_ID = "87b44fa5-3b82-4914-bc4e-52a7d05c0775"
TEST_USER_ID = "a68d2f2e-2a15-4ca0-9a7d-a8ecadc1c74a"


async def test_1_initialization():
    """Test TP initialization"""
    print("\n=== Test 1: TP Initialization ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    assert tp.agent_type == "thinking_partner", "Wrong agent type"
    assert tp.basket_id == TEST_BASKET_ID, "Wrong basket ID"
    assert tp.memory is not None, "Memory adapter not created"
    assert len(tp._tools) == 4, f"Expected 4 tools, got {len(tp._tools)}"

    tool_names = [t["name"] for t in tp._tools]
    print(f"✅ TP initialized with tools: {', '.join(tool_names)}")
    return True


async def test_2_tool_definitions():
    """Test tool structure"""
    print("\n=== Test 2: Tool Definitions ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Check agent_orchestration tool
    orch_tool = next((t for t in tp._tools if t["name"] == "agent_orchestration"), None)
    assert orch_tool is not None, "agent_orchestration tool missing"
    assert "input_schema" in orch_tool, "Missing input_schema"
    assert "agent_type" in orch_tool["input_schema"]["properties"], "Missing agent_type property"

    # Check infra_reader tool
    infra_tool = next((t for t in tp._tools if t["name"] == "infra_reader"), None)
    assert infra_tool is not None, "infra_reader tool missing"
    assert "query_type" in infra_tool["input_schema"]["properties"], "Missing query_type property"

    print("✅ All tool definitions valid")
    return True


async def test_3_infra_reader():
    """Test infrastructure reader tool"""
    print("\n=== Test 3: Infrastructure Reader ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    result = await tp._execute_infra_reader({
        "query_type": "recent_work_requests",
        "filters": {"limit": 5}
    })

    assert result is not None, "No result from infra_reader"
    assert isinstance(result, str), "Result should be string"
    print(f"✅ Infrastructure query successful: {result[:100]}...")
    return True


async def test_4_steps_planner():
    """Test steps planner tool"""
    print("\n=== Test 4: Steps Planner ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    result = await tp._execute_steps_planner({
        "user_request": "Research AI agents then create content",
        "existing_context": "Some basic context"
    })

    assert result is not None, "No result from steps_planner"
    assert isinstance(result, str), "Result should be string"
    assert len(result) > 50, "Plan too short"
    print(f"✅ Steps planner generated plan: {result[:150]}...")
    return True


async def test_5_basic_chat():
    """Test basic chat functionality"""
    print("\n=== Test 5: Basic Chat ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    result = await tp.chat(
        user_message="Hello! What agents are available?"
    )

    assert "message" in result, "No message in response"
    assert result["message"] is not None, "Message is None"
    assert len(result["message"]) > 0, "Message is empty"
    assert "claude_session_id" in result, "No claude_session_id"

    session_id = result.get('claude_session_id')
    print(f"✅ Chat working - response length: {len(result['message'])} chars")
    print(f"   Session ID: {str(session_id)[:50] if session_id else 'N/A'}...")
    return True


async def test_6_gateway_mirror_meta_pattern():
    """Test architectural pattern"""
    print("\n=== Test 6: Gateway/Mirror/Meta Pattern ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Gateway: Can receive messages
    assert hasattr(tp, "chat"), "Missing chat method (Gateway)"
    assert callable(tp.chat), "chat is not callable"

    # Mirror: Has orchestration tools
    tool_names = [t["name"] for t in tp._tools]
    assert "agent_orchestration" in tool_names, "Missing agent_orchestration (Mirror)"
    assert "infra_reader" in tool_names, "Missing infra_reader (Mirror)"

    # Meta: Can emit intelligence
    assert "emit_work_output" in tool_names, "Missing emit_work_output (Meta)"

    print("✅ Gateway/Mirror/Meta pattern validated")
    print("   - Gateway: chat() ✓")
    print("   - Mirror: orchestration tools ✓")
    print("   - Meta: emit_work_output ✓")
    return True


async def run_all_tests():
    """Run all tests"""
    tests = [
        ("Initialization", test_1_initialization),
        ("Tool Definitions", test_2_tool_definitions),
        ("Infrastructure Reader", test_3_infra_reader),
        ("Steps Planner", test_4_steps_planner),
        ("Basic Chat", test_5_basic_chat),
        ("Gateway/Mirror/Meta", test_6_gateway_mirror_meta_pattern),
    ]

    print("=" * 70)
    print("THINKING PARTNER - STANDALONE INTEGRATION TESTS")
    print("=" * 70)

    passed = 0
    failed = 0
    errors = []

    for name, test_fn in tests:
        try:
            await test_fn()
            passed += 1
        except AssertionError as e:
            print(f"❌ {name} FAILED: {e}")
            failed += 1
            errors.append((name, str(e)))
        except Exception as e:
            print(f"❌ {name} ERROR: {e}")
            failed += 1
            errors.append((name, str(e)))

    print("\n" + "=" * 70)
    print(f"RESULTS: {passed}/{len(tests)} passed, {failed} failed")
    print("=" * 70)

    if errors:
        print("\nFailed Tests:")
        for name, error in errors:
            print(f"  - {name}: {error}")

    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
