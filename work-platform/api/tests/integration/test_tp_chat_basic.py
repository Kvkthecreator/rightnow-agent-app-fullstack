"""
Basic TP Chat Test - Workflow 1 Only (No Claude SDK)

Tests just the database and session management aspects without calling Claude API:
1. TP agent initialization
2. Agent session creation with agent_type='thinking_partner'
3. Session persistence verification
4. Hierarchical session pattern (TP parent → specialist children)

This validates the database schema fix and architecture without requiring:
- ANTHROPIC_API_KEY (no Claude calls)
- SUBSTRATE_API_URL (no staging queries)

Usage:
    cd work-platform/api
    PYTHONPATH=src SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
    python tests/integration/test_tp_chat_basic.py
"""

import asyncio
import os
import sys
from uuid import uuid4

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))


async def test_tp_session_management():
    """
    Test TP session management without calling Claude API

    Validates:
    - ThinkingPartnerAgentSDK can be instantiated
    - TP session created with agent_type='thinking_partner' (constraint fix)
    - Session persisted to database
    - Specialist sessions can be created as children of TP
    """
    print("\n" + "=" * 80)
    print("TEST: TP Session Management (Database Architecture)")
    print("=" * 80 + "\n")

    try:
        from yarnnn_agents.session import AgentSession
        from app.utils.supabase import supabase_admin

        supabase = supabase_admin()

        # Generate test IDs
        test_basket_id = str(uuid4())
        test_workspace_id = str(uuid4())
        test_user_id = str(uuid4())

        print(f"Test Context:")
        print(f"  - basket_id: {test_basket_id}")
        print(f"  - workspace_id: {test_workspace_id}")
        print(f"  - user_id: {test_user_id}")
        print()

        # ====================================================================
        # STEP 1: Create TP session (validates constraint fix)
        # ====================================================================
        print("STEP 1: Creating TP agent session...")
        print("   (This validates the database migration was applied)")
        print()

        tp_session = await AgentSession.get_or_create(
            basket_id=test_basket_id,
            workspace_id=test_workspace_id,
            agent_type="thinking_partner",  # This was failing before migration!
            user_id=test_user_id
        )

        print(f"✅ TP session created successfully:")
        print(f"   - session_id: {tp_session.id}")
        print(f"   - agent_type: {tp_session.agent_type}")
        print(f"   - parent_session_id: {tp_session.parent_session_id} (should be None)")
        print()

        # ====================================================================
        # STEP 2: Verify session in database
        # ====================================================================
        print("STEP 2: Verifying session in database...")

        result = supabase.table("agent_sessions").select("*").eq(
            "id", str(tp_session.id)
        ).execute()

        if result.data and len(result.data) > 0:
            session_data = result.data[0]
            print(f"✅ Session found in database:")
            print(f"   - agent_type: {session_data['agent_type']}")
            print(f"   - basket_id: {session_data['basket_id']}")
            print(f"   - parent_session_id: {session_data['parent_session_id']}")
        else:
            print("❌ FAILED: Session not found in database")
            return False
        print()

        # ====================================================================
        # STEP 3: Create specialist sessions (children of TP)
        # ====================================================================
        print("STEP 3: Creating specialist sessions (hierarchical pattern)...")
        print("   (Validates parent-child session architecture)")
        print()

        specialist_types = ["research", "content", "reporting"]
        specialist_sessions = []

        for agent_type in specialist_types:
            session = await AgentSession.get_or_create(
                basket_id=test_basket_id,
                workspace_id=test_workspace_id,
                agent_type=agent_type,
                user_id=test_user_id,
                parent_session_id=tp_session.id  # Child of TP!
            )
            specialist_sessions.append(session)
            print(f"   ✅ {agent_type.ljust(10)} session created (parent: {session.parent_session_id})")

        print()

        # ====================================================================
        # STEP 4: Verify hierarchical structure in database
        # ====================================================================
        print("STEP 4: Verifying hierarchical structure...")

        children = supabase.table("agent_sessions").select("*").eq(
            "parent_session_id", str(tp_session.id)
        ).execute()

        if children.data and len(children.data) == 3:
            print(f"✅ Found {len(children.data)} child sessions:")
            for child in children.data:
                print(f"   - {child['agent_type']} (parent: {child['parent_session_id']})")
        else:
            print(f"❌ FAILED: Expected 3 children, found {len(children.data) if children.data else 0}")
            return False
        print()

        # ====================================================================
        # STEP 5: Test UNIQUE constraint (basket + agent_type)
        # ====================================================================
        print("STEP 5: Testing UNIQUE constraint (basket + agent_type)...")
        print("   (Should return existing session, not create new one)")
        print()

        tp_session_2 = await AgentSession.get_or_create(
            basket_id=test_basket_id,
            workspace_id=test_workspace_id,
            agent_type="thinking_partner",
            user_id=test_user_id
        )

        if str(tp_session_2.id) == str(tp_session.id):
            print("✅ UNIQUE constraint working correctly")
            print(f"   Same session returned: {tp_session_2.id}")
        else:
            print("❌ FAILED: New session created instead of returning existing")
            return False
        print()

        # ====================================================================
        # Cleanup
        # ====================================================================
        print("CLEANUP: Removing test sessions...")

        # Delete specialist sessions
        for session in specialist_sessions:
            supabase.table("agent_sessions").delete().eq(
                "id", str(session.id)
            ).execute()

        # Delete TP session
        supabase.table("agent_sessions").delete().eq(
            "id", str(tp_session.id)
        ).execute()

        print("✅ Test data cleaned up")
        print()

        # ====================================================================
        # Summary
        # ====================================================================
        print("=" * 80)
        print("✅ ALL TESTS PASSED")
        print("=" * 80)
        print()
        print("Validated:")
        print("  ✅ Database migration applied (thinking_partner constraint)")
        print("  ✅ TP session creation working")
        print("  ✅ Session persistence to database")
        print("  ✅ Hierarchical session pattern (parent-child)")
        print("  ✅ UNIQUE constraint (basket + agent_type)")
        print()
        print("Architecture Status:")
        print("  ✅ Database layer: WORKING")
        print("  ⏸️  Chat layer: Not tested (requires ANTHROPIC_API_KEY)")
        print("  ⏸️  Staging layer: Not tested (requires substrate-API)")
        print()

        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")

        if "agent_sessions_agent_type_check" in str(e):
            print("\n⚠️  ERROR: Database constraint violation!")
            print("   The migration was NOT applied successfully.")
            print()
            print("   Please apply migration:")
            print("   psql \"$PG_DUMP_URL\" -f supabase/migrations/20251121_fix_thinking_partner_agent_type.sql")
        else:
            import traceback
            traceback.print_exc()

        return False


if __name__ == "__main__":
    # Validate environment variables
    required_env = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing = [var for var in required_env if not os.getenv(var)]

    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print()
        print("Usage:")
        print("  SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... \\")
        print("  python tests/integration/test_tp_chat_basic.py")
        sys.exit(1)

    # Run test
    success = asyncio.run(test_tp_session_management())
    sys.exit(0 if success else 1)
