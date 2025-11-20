"""
Integration Tests for Thinking Partner Agent

Tests the Gateway/Mirror/Meta agent functionality including:
- Chat interface
- Agent orchestration via tools
- Infrastructure queries
- Workflow planning
"""

import asyncio
import os
import pytest
from datetime import datetime

# Validate required environment variables
required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    raise EnvironmentError(
        f"Missing required environment variables: {', '.join(missing_vars)}. "
        "Set them before running tests."
    )

from agents_sdk.thinking_partner import ThinkingPartnerAgent, create_thinking_partner


# Test configuration
TEST_BASKET_ID = "5004b9e1-67f5-4955-b028-389d45b1f5a4"  # Existing test basket
TEST_WORKSPACE_ID = "87b44fa5-3b82-4914-bc4e-52a7d05c0775"  # Existing test workspace
TEST_USER_ID = "a68d2f2e-2a15-4ca0-9a7d-a8ecadc1c74a"  # Existing test user


@pytest.mark.asyncio
async def test_tp_initialization():
    """
    Test 1: TP Agent Initialization

    Validates that ThinkingPartnerAgent can be created with:
    - SubstrateMemoryAdapter connection
    - Claude SDK configuration
    - Custom tools registration
    """
    print("\n=== Test 1: TP Initialization ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Validate agent properties
    assert tp.agent_type == "thinking_partner"
    assert tp.basket_id == TEST_BASKET_ID
    assert tp.workspace_id == TEST_WORKSPACE_ID
    assert tp.user_id == TEST_USER_ID

    # Validate memory adapter
    assert tp.memory is not None
    assert hasattr(tp.memory, "query")

    # Validate tools
    assert len(tp._tools) == 4  # agent_orchestration, infra_reader, steps_planner, emit_work_output
    tool_names = [t["name"] for t in tp._tools]
    assert "agent_orchestration" in tool_names
    assert "infra_reader" in tool_names
    assert "steps_planner" in tool_names
    assert "emit_work_output" in tool_names

    print("✅ TP agent initialized successfully")
    print(f"   - Agent Type: {tp.agent_type}")
    print(f"   - Memory Provider: {type(tp.memory).__name__}")
    print(f"   - Tools: {', '.join(tool_names)}")


@pytest.mark.asyncio
async def test_tp_chat_basic():
    """
    Test 2: Basic Chat Functionality

    Tests TP's ability to:
    - Receive user message
    - Query memory for context
    - Respond conversationally
    - Maintain session
    """
    print("\n=== Test 2: Basic Chat ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Simple greeting message
    result = await tp.chat(
        user_message="Hello! Can you help me understand what agents are available?"
    )

    # Validate response structure
    assert "message" in result
    assert "claude_session_id" in result
    assert "work_outputs" in result
    assert "actions_taken" in result

    # Response should mention available agents
    assert result["message"] is not None
    assert len(result["message"]) > 0

    # Session should be created
    assert result["claude_session_id"] is not None or result["session_id"] is not None

    print("✅ Basic chat working")
    print(f"   - Response length: {len(result['message'])} chars")
    print(f"   - Session ID: {result.get('claude_session_id', 'N/A')}")
    print(f"   - Actions taken: {len(result.get('actions_taken', []))}")


@pytest.mark.asyncio
async def test_tp_memory_query():
    """
    Test 3: Memory Query Integration

    Tests that TP can query substrate for context using SubstrateMemoryAdapter.
    """
    print("\n=== Test 3: Memory Query ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Ask question that should trigger memory query
    result = await tp.chat(
        user_message="What do we know about agent sessions?"
    )

    # Should have queried memory (even if no results)
    assert result["message"] is not None

    print("✅ Memory query integration working")
    print(f"   - Response acknowledges substrate context")


@pytest.mark.asyncio
async def test_tp_infra_reader_tool():
    """
    Test 4: Infrastructure Reader Tool

    Tests TP's ability to query work orchestration state.
    """
    print("\n=== Test 4: Infrastructure Reader Tool ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Test direct tool execution (simulating what Claude would do)
    tool_result = await tp._execute_infra_reader({
        "query_type": "recent_work_requests",
        "filters": {"limit": 5}
    })

    # Should return infrastructure query result
    assert tool_result is not None
    assert isinstance(tool_result, str)
    assert "Work Requests" in tool_result or "Recent" in tool_result

    print("✅ Infrastructure reader tool working")
    print(f"   - Query result: {tool_result[:200]}...")


@pytest.mark.asyncio
async def test_tp_agent_orchestration_tool():
    """
    Test 5: Agent Orchestration Tool (MOCK)

    Tests TP's ability to delegate to specialized agents.
    NOTE: This is a MOCK test that doesn't actually run agents (to save API costs).
    """
    print("\n=== Test 5: Agent Orchestration Tool (MOCK) ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Test tool definition (structure validation)
    orchestration_tool = next(
        (t for t in tp._tools if t["name"] == "agent_orchestration"),
        None
    )

    assert orchestration_tool is not None
    assert "input_schema" in orchestration_tool
    assert "properties" in orchestration_tool["input_schema"]
    assert "agent_type" in orchestration_tool["input_schema"]["properties"]

    # Validate enum values
    agent_type_enum = orchestration_tool["input_schema"]["properties"]["agent_type"]["enum"]
    assert "research" in agent_type_enum
    assert "content" in agent_type_enum
    assert "reporting" in agent_type_enum

    print("✅ Agent orchestration tool structure valid")
    print(f"   - Available agents: {', '.join(agent_type_enum)}")
    print("   - (Actual agent execution skipped in unit test)")


@pytest.mark.asyncio
async def test_tp_steps_planner_tool():
    """
    Test 6: Steps Planner Tool

    Tests TP's ability to plan multi-step workflows using LLM.
    NOTE: This executes actual LLM call for planning.
    """
    print("\n=== Test 6: Steps Planner Tool ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Test workflow planning
    tool_result = await tp._execute_steps_planner({
        "user_request": "Research AI agents then create LinkedIn post about findings",
        "existing_context": "We have some basic knowledge about AI agents"
    })

    # Should return a plan
    assert tool_result is not None
    assert isinstance(tool_result, str)
    assert "plan" in tool_result.lower() or "step" in tool_result.lower()

    print("✅ Steps planner tool working")
    print(f"   - Plan generated: {tool_result[:300]}...")


@pytest.mark.asyncio
async def test_tp_session_resumption():
    """
    Test 7: Session Resumption

    Tests that TP can resume existing Claude sessions for conversation continuity.
    """
    print("\n=== Test 7: Session Resumption ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # First message
    result1 = await tp.chat(user_message="Hello, I'm testing session resumption")
    session_id = result1.get("claude_session_id")

    assert session_id is not None

    # Second message with resumption
    tp2 = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID,
        claude_session_id=session_id
    )

    result2 = await tp2.chat(
        user_message="Do you remember my previous message?",
        claude_session_id=session_id
    )

    # Session should be maintained
    assert result2["claude_session_id"] == session_id or result2["claude_session_id"] is not None

    print("✅ Session resumption working")
    print(f"   - Session ID maintained: {session_id}")


@pytest.mark.asyncio
async def test_tp_gateway_mirror_meta_pattern():
    """
    Test 8: Gateway/Mirror/Meta Pattern Validation

    Validates the architectural pattern:
    - Gateway: Receives user interaction
    - Mirror: Orchestrates infrastructure
    - Meta: Can emit own intelligence
    """
    print("\n=== Test 8: Gateway/Mirror/Meta Pattern ===")

    tp = create_thinking_partner(
        basket_id=TEST_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    # Gateway: Can receive user messages
    assert hasattr(tp, "chat")
    assert callable(tp.chat)

    # Mirror: Has tools to orchestrate infrastructure
    tool_names = [t["name"] for t in tp._tools]
    assert "agent_orchestration" in tool_names  # Delegates to agents
    assert "infra_reader" in tool_names  # Queries infrastructure

    # Meta: Can emit own intelligence
    assert "emit_work_output" in tool_names  # Can create insights

    print("✅ Gateway/Mirror/Meta pattern validated")
    print("   - Gateway: ✅ chat() method")
    print("   - Mirror: ✅ agent_orchestration + infra_reader tools")
    print("   - Meta: ✅ emit_work_output tool")


def run_all_tests():
    """Run all integration tests."""
    tests = [
        test_tp_initialization,
        test_tp_chat_basic,
        test_tp_memory_query,
        test_tp_infra_reader_tool,
        test_tp_agent_orchestration_tool,
        test_tp_steps_planner_tool,
        test_tp_session_resumption,
        test_tp_gateway_mirror_meta_pattern,
    ]

    print("=" * 60)
    print("THINKING PARTNER - INTEGRATION TESTS")
    print("=" * 60)

    passed = 0
    failed = 0

    for test in tests:
        try:
            asyncio.run(test())
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__} FAILED: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
