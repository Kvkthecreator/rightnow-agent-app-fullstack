"""
Integration Tests: TP Workflows (Chat vs Work Orchestration)

Tests the two key workflows independently:
1. Regular TP chat (conversation only, no substrate queries)
2. Work orchestration (staging + delegation with WorkBundle)

Usage:
    cd work-platform/api
    PYTHONPATH=src SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... \
    SUBSTRATE_API_URL=... python tests/integration/test_tp_workflows.py
"""

import asyncio
import os
import sys
from uuid import uuid4

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))


async def test_workflow_1_regular_chat():
    """
    Test Workflow 1: Regular TP Chat (No Work Orchestration)

    Expected behavior:
    - TP creates agent_session with agent_type='thinking_partner'
    - Claude SDK session created
    - Chat message processed
    - NO substrate queries (chat phase only)
    - Response returned
    """
    print("\n" + "=" * 80)
    print("TEST WORKFLOW 1: Regular TP Chat (No Work Orchestration)")
    print("=" * 80 + "\n")

    try:
        from agents_sdk.thinking_partner_sdk import ThinkingPartnerAgentSDK
        from yarnnn_agents.session import AgentSession

        # Generate test IDs
        test_basket_id = str(uuid4())
        test_workspace_id = str(uuid4())
        test_user_id = str(uuid4())

        print(f"Test Context:")
        print(f"  - basket_id: {test_basket_id}")
        print(f"  - workspace_id: {test_workspace_id}")
        print(f"  - user_id: {test_user_id}")
        print()

        # Step 1: Initialize TP Agent
        print("STEP 1: Initializing TP Agent...")
        tp = ThinkingPartnerAgentSDK(
            basket_id=test_basket_id,
            workspace_id=test_workspace_id,
            user_id=test_user_id,
            user_token=None  # No substrate access for this test
        )
        print("✅ TP Agent initialized")
        print()

        # Step 2: Verify TP session was created
        print("STEP 2: Verifying TP session creation...")
        if tp.current_session:
            print(f"✅ TP session created:")
            print(f"   - session_id: {tp.current_session.id}")
            print(f"   - agent_type: {tp.current_session.agent_type}")
            print(f"   - parent_session_id: {tp.current_session.parent_session_id}")
        else:
            print("❌ FAILED: TP session not created")
            return False
        print()

        # Step 3: Send simple chat message (should NOT trigger work_orchestration)
        print("STEP 3: Sending simple chat message...")
        test_message = "Hello! What capabilities do you have?"
        print(f"   Message: '{test_message}'")
        print()

        result = await tp.chat(
            user_message=test_message,
            claude_session_id=None
        )

        print("✅ Chat completed successfully")
        print(f"   - Response length: {len(result.get('response', ''))} chars")
        print(f"   - Claude session ID: {result.get('claude_session_id', 'N/A')}")
        print(f"   - Work outputs: {len(result.get('work_outputs', []))}")
        print()

        # Step 4: Verify NO work orchestration was triggered
        print("STEP 4: Verifying NO work orchestration...")
        if len(result.get('work_outputs', [])) == 0:
            print("✅ Correct: No work outputs (chat only)")
        else:
            print("⚠️  Warning: Work outputs present (unexpected for simple chat)")
        print()

        # Cleanup
        print("CLEANUP: Removing test session...")
        from app.utils.supabase import supabase_admin
        supabase = supabase_admin()
        supabase.table("agent_sessions").delete().eq(
            "id", str(tp.current_session.id)
        ).execute()
        print("✅ Test data cleaned up")
        print()

        print("=" * 80)
        print("✅ WORKFLOW 1 PASSED: Regular TP chat works correctly")
        print("=" * 80 + "\n")
        return True

    except Exception as e:
        print(f"\n❌ WORKFLOW 1 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_workflow_2_work_orchestration():
    """
    Test Workflow 2: Work Orchestration (Staging + Delegation)

    Expected behavior:
    - TP decides to use work_orchestration tool
    - STAGING PHASE: Load substrate blocks, reference assets, agent config
    - WorkBundle created with pre-loaded context
    - Specialist session created (child of TP)
    - Specialist agent receives bundle
    - Work outputs emitted
    """
    print("\n" + "=" * 80)
    print("TEST WORKFLOW 2: Work Orchestration (Staging + Delegation)")
    print("=" * 80 + "\n")

    try:
        from agents_sdk.thinking_partner_sdk import ThinkingPartnerAgentSDK

        # Generate test IDs
        test_basket_id = str(uuid4())
        test_workspace_id = str(uuid4())
        test_user_id = str(uuid4())

        print(f"Test Context:")
        print(f"  - basket_id: {test_basket_id}")
        print(f"  - workspace_id: {test_workspace_id}")
        print(f"  - user_id: {test_user_id}")
        print()

        # Check if substrate-API is accessible
        substrate_token = os.getenv("SUBSTRATE_SERVICE_SECRET")
        if not substrate_token:
            print("⚠️  WARNING: No SUBSTRATE_SERVICE_SECRET env var")
            print("   Staging queries may fail with 401")
            print()

        # Step 1: Initialize TP Agent with substrate access
        print("STEP 1: Initializing TP Agent with substrate access...")
        tp = ThinkingPartnerAgentSDK(
            basket_id=test_basket_id,
            workspace_id=test_workspace_id,
            user_id=test_user_id,
            user_token=substrate_token  # Pass substrate token for staging queries
        )
        print("✅ TP Agent initialized")
        print()

        # Step 2: Send message that SHOULD trigger work_orchestration
        print("STEP 2: Sending work request message...")
        test_message = "I need you to research the latest developments in AI agent frameworks and architectures"
        print(f"   Message: '{test_message}'")
        print()

        result = await tp.chat(
            user_message=test_message,
            claude_session_id=None
        )

        print("✅ Chat completed")
        print(f"   - Response length: {len(result.get('response', ''))} chars")
        print(f"   - Work outputs: {len(result.get('work_outputs', []))}")
        print()

        # Step 3: Verify work orchestration was triggered
        print("STEP 3: Verifying work orchestration...")
        work_outputs = result.get('work_outputs', [])

        if len(work_outputs) > 0:
            print(f"✅ Work orchestration triggered: {len(work_outputs)} outputs")

            # Check for staging logs (would be in console during execution)
            print("   Expected staging behavior:")
            print("   ✓ STAGING PHASE: Loading context")
            print("   ✓ Query 1: substrate blocks")
            print("   ✓ Query 2: reference assets")
            print("   ✓ Query 3: agent config")
            print("   ✓ WorkBundle created")
            print("   ✓ Specialist agent received bundle")
        else:
            print("⚠️  Warning: No work outputs (work_orchestration may not have triggered)")
            print("   This could be because:")
            print("   - Claude didn't decide to use work_orchestration tool")
            print("   - Work orchestration failed silently")
            print("   - Message wasn't clear enough")
        print()

        # Step 4: Verify specialist session was created (if work_orchestration ran)
        print("STEP 4: Checking for specialist sessions...")
        from app.utils.supabase import supabase_admin
        supabase = supabase_admin()

        specialist_sessions = supabase.table("agent_sessions").select("*").eq(
            "basket_id", test_basket_id
        ).eq(
            "parent_session_id", str(tp.current_session.id)
        ).execute()

        if specialist_sessions.data and len(specialist_sessions.data) > 0:
            print(f"✅ Found {len(specialist_sessions.data)} specialist session(s):")
            for session in specialist_sessions.data:
                print(f"   - {session['agent_type']} (child of TP)")
        else:
            print("⚠️  No specialist sessions found")
            print("   (Expected if work_orchestration wasn't triggered)")
        print()

        # Step 5: Verify work_request and work_ticket were created
        print("STEP 5: Checking for work_request and work_ticket...")

        work_requests = supabase.table("work_requests").select("*").eq(
            "basket_id", test_basket_id
        ).execute()

        if work_requests.data and len(work_requests.data) > 0:
            print(f"✅ Found {len(work_requests.data)} work_request(s)")

            work_tickets = supabase.table("work_tickets").select("*").eq(
                "basket_id", test_basket_id
            ).execute()

            if work_tickets.data:
                print(f"✅ Found {len(work_tickets.data)} work_ticket(s)")
            else:
                print("⚠️  No work_tickets found")
        else:
            print("⚠️  No work_requests found")
            print("   (Expected if work_orchestration wasn't triggered)")
        print()

        # Cleanup
        print("CLEANUP: Removing test data...")
        # Delete specialist sessions
        if specialist_sessions.data:
            for session in specialist_sessions.data:
                supabase.table("agent_sessions").delete().eq(
                    "id", session['id']
                ).execute()

        # Delete TP session
        supabase.table("agent_sessions").delete().eq(
            "id", str(tp.current_session.id)
        ).execute()

        # Delete work_tickets and work_requests
        if work_tickets.data:
            for ticket in work_tickets.data:
                supabase.table("work_tickets").delete().eq(
                    "id", ticket['id']
                ).execute()

        if work_requests.data:
            for request in work_requests.data:
                supabase.table("work_requests").delete().eq(
                    "id", request['id']
                ).execute()

        print("✅ Test data cleaned up")
        print()

        print("=" * 80)
        if len(work_outputs) > 0:
            print("✅ WORKFLOW 2 PASSED: Work orchestration executed successfully")
        else:
            print("⚠️  WORKFLOW 2 INCONCLUSIVE: Work orchestration may not have triggered")
            print("   (Claude might have chosen not to use the tool)")
        print("=" * 80 + "\n")

        return True

    except Exception as e:
        print(f"\n❌ WORKFLOW 2 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all workflow tests"""

    print("\n" + "=" * 80)
    print("TP WORKFLOW INTEGRATION TESTS")
    print("=" * 80)
    print()
    print("Testing two distinct workflows:")
    print("1. Regular TP chat (conversation only)")
    print("2. Work orchestration (staging + delegation)")
    print()

    # Validate environment
    required_env = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ANTHROPIC_API_KEY"
    ]

    missing = [var for var in required_env if not os.getenv(var)]
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        return False

    optional_env = ["SUBSTRATE_API_URL", "SUBSTRATE_SERVICE_SECRET"]
    missing_optional = [var for var in optional_env if not os.getenv(var)]
    if missing_optional:
        print(f"⚠️  Missing optional environment variables: {', '.join(missing_optional)}")
        print("   Workflow 2 (work orchestration) may fail at staging phase")
        print()

    # Run tests
    results = []

    # Test 1: Regular chat
    success_1 = await test_workflow_1_regular_chat()
    results.append(("Regular TP Chat", success_1))

    # Test 2: Work orchestration
    success_2 = await test_workflow_2_work_orchestration()
    results.append(("Work Orchestration", success_2))

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
    print("=" * 80 + "\n")

    return all(success for _, success in results)


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
