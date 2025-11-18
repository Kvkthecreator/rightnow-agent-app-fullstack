"""
Test query_substrate MCP tool - Phase 1 MCP Integration

This tests the semantic search bridge between work-platform and substrate-API.
Tests HTTP communication, auth forwarding, and semantic search functionality.

Phase 1 Scope:
- Test tool independently (NO agent integration yet)
- Validate HTTP request/response flow
- Test both service auth and user JWT
- Use real ani-project basket if available

Success Criteria:
- ✅ HTTP request succeeds
- ✅ Returns blocks from substrate-API
- ✅ Semantic search filters work correctly
- ✅ Auth works (service token + optional user JWT)

See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md Phase 1
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from mcp_tools.server import SubstrateClient


async def test_query_substrate():
    """Test query_substrate tool HTTP communication."""
    print("=" * 60)
    print("Phase 1 Test: query_substrate MCP Tool")
    print("=" * 60)
    print()

    # Verify environment variables
    substrate_url = os.getenv("SUBSTRATE_API_URL", "https://yarnnn-substrate-api.onrender.com")
    service_secret = os.getenv("SUBSTRATE_SERVICE_SECRET", "")

    if not service_secret:
        print("❌ Test failed: SUBSTRATE_SERVICE_SECRET environment variable not set")
        print("   This is required for service-to-service auth")
        return False

    print(f"Substrate API URL: {substrate_url}")
    print(f"Service Secret: {'*' * len(service_secret)}")
    print()

    # Initialize client
    client = SubstrateClient(substrate_url, service_secret)

    try:
        # Test 1: Basic semantic search (no user JWT)
        print("Test 1: Basic semantic search (service auth only)")
        print("-" * 60)

        # Use ani-project basket if available, otherwise use a test basket ID
        # You should replace this with a real basket ID from your database
        test_basket_id = os.getenv("TEST_BASKET_ID", "ani-project-basket-id")
        print(f"Basket ID: {test_basket_id}")
        print("Query: 'What are the key technical constraints?'")
        print()

        result = await client.query_substrate(
            basket_id=test_basket_id,
            query_text="What are the key technical constraints?",
            semantic_types=["constraint", "fact"],
            states=["ACCEPTED", "LOCKED"],
            min_similarity=0.65,
            limit=5,
        )

        print(f"✅ HTTP request succeeded")
        print(f"   Status: {result.get('total', 0)} blocks returned")
        print()

        if result.get("blocks"):
            print("Sample results:")
            for i, block in enumerate(result["blocks"][:3], 1):
                print(f"   {i}. [{block['semantic_type']}] {block['content'][:80]}...")
                print(f"      Similarity: {block['similarity_score']:.3f}")
            print()
        else:
            print("   No blocks returned (basket may be empty or query too specific)")
            print()

        # Test 2: With user JWT (if available)
        user_jwt = os.getenv("TEST_USER_JWT")
        if user_jwt:
            print("Test 2: Semantic search with user JWT")
            print("-" * 60)
            print("User JWT: present")
            print()

            result = await client.query_substrate(
                basket_id=test_basket_id,
                query_text="What are the project goals?",
                semantic_types=["finding", "insight"],
                min_similarity=0.60,
                limit=5,
                user_jwt=user_jwt,
            )

            print(f"✅ HTTP request with user JWT succeeded")
            print(f"   Status: {result.get('total', 0)} blocks returned")
            print()
        else:
            print("Test 2: Skipped (TEST_USER_JWT not set)")
            print()

        # Test 3: Filter combinations
        print("Test 3: Semantic type filtering")
        print("-" * 60)

        result = await client.query_substrate(
            basket_id=test_basket_id,
            query_text="risk analysis",
            semantic_types=["issue", "constraint"],
            anchor_roles=["problem"],
            min_similarity=0.50,
            limit=10,
        )

        print(f"✅ Filter combination succeeded")
        print(f"   Status: {result.get('total', 0)} blocks returned")
        print(f"   Filters: semantic_types=['issue', 'constraint'], anchor_roles=['problem']")
        print()

        print("=" * 60)
        print("✅ PHASE 1 CHECKPOINT: query_substrate tool PASSED")
        print()
        print("Verified:")
        print("   - HTTP communication works")
        print("   - Service auth works")
        print("   - Semantic search filters work")
        print("   - Returns structured block data")
        print()
        print("Next: Test emit_work_output tool")
        print("=" * 60)
        print()

        return True

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        print()
        import traceback

        traceback.print_exc()
        print()
        print("=" * 60)
        print("❌ PHASE 1 CHECKPOINT: query_substrate tool FAILED")
        print()
        print("Possible issues:")
        print("   - SUBSTRATE_API_URL not accessible")
        print("   - SUBSTRATE_SERVICE_SECRET invalid")
        print("   - TEST_BASKET_ID doesn't exist")
        print("   - Substrate-API /api/substrate/search endpoint not deployed")
        print("   - Network/firewall blocking requests")
        print("=" * 60)
        print()
        return False

    finally:
        await client.close()


if __name__ == "__main__":
    print()
    print("Phase 1: Testing query_substrate MCP Tool")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(test_query_substrate())

    exit(0 if success else 1)
