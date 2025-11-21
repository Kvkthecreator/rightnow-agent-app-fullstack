"""
Test: Verify TP can create agent_sessions after constraint fix

This script validates that the database migration was successful by:
1. Attempting to create a TP agent session
2. Verifying it succeeds (no constraint violation)
3. Cleaning up test data

Usage:
    cd work-platform/api
    PYTHONPATH=src SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python test_tp_session_creation.py
"""

import asyncio
import os
import sys
from uuid import uuid4

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


async def test_tp_session_creation():
    """Test that TP can create agent_sessions with agent_type='thinking_partner'"""

    print("\n🧪 Testing TP Agent Session Creation\n")
    print("=" * 60)

    # Import after path is set
    from app.work.models.agent_session import AgentSession

    # Generate test IDs
    test_basket_id = str(uuid4())
    test_workspace_id = str(uuid4())
    test_user_id = str(uuid4())

    print(f"Test basket_id: {test_basket_id}")
    print(f"Test workspace_id: {test_workspace_id}")
    print(f"Test user_id: {test_user_id}")
    print()

    try:
        # Test 1: Create TP session (should NOT violate constraint)
        print("TEST 1: Creating TP agent session...")
        tp_session = await AgentSession.get_or_create(
            basket_id=test_basket_id,
            workspace_id=test_workspace_id,
            agent_type="thinking_partner",  # This was causing constraint violation!
            user_id=test_user_id
        )

        print(f"✅ SUCCESS: TP session created with ID: {tp_session.id}")
        print(f"   - agent_type: {tp_session.agent_type}")
        print(f"   - parent_session_id: {tp_session.parent_session_id}")
        print()

        # Test 2: Verify session was persisted
        print("TEST 2: Verifying session in database...")
        from app.utils.supabase import supabase_admin
        supabase = supabase_admin()

        result = supabase.table("agent_sessions").select("*").eq(
            "id", str(tp_session.id)
        ).execute()

        if result.data and len(result.data) > 0:
            session_data = result.data[0]
            print(f"✅ SUCCESS: Session found in database")
            print(f"   - agent_type: {session_data['agent_type']}")
            print(f"   - basket_id: {session_data['basket_id']}")
            print()
        else:
            print(f"❌ FAILED: Session not found in database")
            return False

        # Test 3: Create specialist sessions (children of TP)
        print("TEST 3: Creating specialist sessions (children of TP)...")

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
            print(f"   ✅ {agent_type} session created (parent: {session.parent_session_id})")

        print()

        # Cleanup
        print("CLEANUP: Removing test sessions...")
        for session in [tp_session] + specialist_sessions:
            supabase.table("agent_sessions").delete().eq(
                "id", str(session.id)
            ).execute()
        print("✅ Test data cleaned up")
        print()

        print("=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print()
        print("Summary:")
        print("1. ✅ TP can create agent_sessions with agent_type='thinking_partner'")
        print("2. ✅ Sessions are persisted to database correctly")
        print("3. ✅ Hierarchical session pattern works (parent-child)")
        print()
        print("Next step: Test TP chat in production (www.yarnnn.com)")
        print()

        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        print()

        if "agent_sessions_agent_type_check" in str(e):
            print("ERROR: Database constraint violation still present!")
            print("This means the migration was NOT applied successfully.")
            print()
            print("Please verify:")
            print("1. Migration file exists: supabase/migrations/20251121_fix_thinking_partner_agent_type.sql")
            print("2. Run migration: psql \"$PG_DUMP_URL\" -f <migration_file>")
        else:
            print(f"Unexpected error: {e}")
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
        print("  SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... python test_tp_session_creation.py")
        sys.exit(1)

    # Run test
    success = asyncio.run(test_tp_session_creation())
    sys.exit(0 if success else 1)
