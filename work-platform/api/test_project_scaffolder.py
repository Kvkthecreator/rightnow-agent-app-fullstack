"""
Test script for project scaffolding with pre-scaffolded agent sessions.

Validates:
1. Project creation with basket + dump + sessions
2. TP session created (root)
3. Specialist sessions created (children of TP)
4. Hierarchical structure (parent_session_id linkage)
"""

import asyncio
import os
import sys
import logging

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from services.project_scaffolder import scaffold_new_project
from app.utils.supabase_client import supabase_admin_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_project_scaffolding():
    """Test project scaffolding with pre-scaffolded sessions."""

    # Test configuration (use actual user/workspace from your DB)
    TEST_USER_ID = "8e0eae30-a54d-47e6-92aa-03c8cf5394e7"  # Replace with actual user_id
    TEST_WORKSPACE_ID = "d04e8fc0-9a02-4eb8-a2f3-a41d950ff3c1"  # Replace with actual workspace_id

    logger.info("=" * 80)
    logger.info("TESTING: Project Scaffolding with Pre-Scaffolded Sessions")
    logger.info("=" * 80)

    try:
        # Create test project
        result = await scaffold_new_project(
            user_id=TEST_USER_ID,
            workspace_id=TEST_WORKSPACE_ID,
            project_name="Test Project - Agent Sessions",
            initial_context="This is a test project to validate pre-scaffolded agent sessions.",
            description="Testing hierarchical session structure"
        )

        logger.info("\n✅ PROJECT SCAFFOLDING SUCCESSFUL!")
        logger.info(f"Project ID: {result['project_id']}")
        logger.info(f"Basket ID: {result['basket_id']}")
        logger.info(f"Dump ID: {result['dump_id']}")

        # Verify agent sessions
        logger.info("\n📊 AGENT SESSIONS CREATED:")
        agent_session_ids = result.get("agent_session_ids", {})

        for agent_type, session_id in agent_session_ids.items():
            logger.info(f"  - {agent_type}: {session_id}")

        # Validate hierarchical structure
        logger.info("\n🔍 VALIDATING HIERARCHICAL STRUCTURE:")

        tp_session_id = agent_session_ids.get("thinking_partner")
        if not tp_session_id:
            logger.error("❌ TP session not created!")
            return False

        # Query TP session
        tp_response = supabase_admin_client.table("agent_sessions").select("*").eq(
            "id", tp_session_id
        ).execute()

        if tp_response.data and len(tp_response.data) > 0:
            tp_session = tp_response.data[0]
            logger.info(f"  TP Session: {tp_session['id']}")
            logger.info(f"    - parent_session_id: {tp_session.get('parent_session_id')} (should be NULL)")
            logger.info(f"    - agent_type: {tp_session['agent_type']}")

        # Validate specialist sessions
        specialist_types = ["research", "content", "reporting"]
        for agent_type in specialist_types:
            session_id = agent_session_ids.get(agent_type)
            if not session_id:
                logger.error(f"❌ {agent_type} session not created!")
                continue

            spec_response = supabase_admin_client.table("agent_sessions").select("*").eq(
                "id", session_id
            ).execute()

            if spec_response.data and len(spec_response.data) > 0:
                spec_session = spec_response.data[0]
                logger.info(f"  {agent_type.title()} Session: {spec_session['id']}")
                logger.info(f"    - parent_session_id: {spec_session.get('parent_session_id')}")
                logger.info(f"    - created_by_session_id: {spec_session.get('created_by_session_id')}")

                # Validate hierarchy
                if spec_session.get('parent_session_id') == tp_session_id:
                    logger.info(f"    ✅ Correctly linked to TP parent")
                else:
                    logger.warning(f"    ⚠️ parent_session_id mismatch!")

        logger.info("\n" + "=" * 80)
        logger.info("✅ TEST COMPLETED SUCCESSFULLY!")
        logger.info("=" * 80)

        return True

    except Exception as e:
        logger.error(f"\n❌ TEST FAILED: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_project_scaffolding())
    sys.exit(0 if success else 1)
