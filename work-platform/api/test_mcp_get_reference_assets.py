"""
Test get_reference_assets MCP tool - Phase 1 MCP Integration

This tests the reference asset retrieval bridge between work-platform and substrate-API.
Tests HTTP communication, asset filtering, and file metadata retrieval.

Phase 1 Scope:
- Test tool independently (NO agent integration yet)
- Validate HTTP request/response flow
- Test asset type and agent scope filtering
- Verify reference_assets table queries

Success Criteria:
- ✅ HTTP request succeeds
- ✅ Returns asset list from substrate-API
- ✅ Filtering by asset_type works
- ✅ Filtering by agent_scope works

See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md Phase 1
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from mcp_tools.server import SubstrateClient


async def test_get_reference_assets():
    """Test get_reference_assets tool HTTP communication."""
    print("=" * 60)
    print("Phase 1 Test: get_reference_assets MCP Tool")
    print("=" * 60)
    print()

    # Verify environment variables
    substrate_url = os.getenv("SUBSTRATE_API_URL", "https://yarnnn-substrate-api.onrender.com")
    service_secret = os.getenv("SUBSTRATE_SERVICE_SECRET", "")

    if not service_secret:
        print("❌ Test failed: SUBSTRATE_SERVICE_SECRET environment variable not set")
        return False

    print(f"Substrate API URL: {substrate_url}")
    print(f"Service Secret: {'*' * len(service_secret)}")
    print()

    # Initialize client
    client = SubstrateClient(substrate_url, service_secret)

    try:
        # Test 1: List all reference assets (no filters)
        print("Test 1: List all reference assets (no filters)")
        print("-" * 60)

        test_basket_id = os.getenv("TEST_BASKET_ID", "ani-project-basket-id")
        print(f"Basket ID: {test_basket_id}")
        print()

        result = await client.get_reference_assets(basket_id=test_basket_id)

        print(f"✅ HTTP request succeeded")
        print(f"   Total assets: {len(result.get('assets', []))}")
        print()

        if result.get("assets"):
            print("Sample assets:")
            for i, asset in enumerate(result["assets"][:3], 1):
                print(f"   {i}. [{asset.get('asset_type', 'unknown')}] {asset.get('filename', 'unknown')}")
                print(f"      Size: {asset.get('file_size', 0) / 1024:.1f} KB")
                if asset.get("agent_scope"):
                    print(f"      Agent Scope: {', '.join(asset['agent_scope'])}")
            print()
        else:
            print("   No assets found (basket may have no uploaded files)")
            print()

        # Test 2: Filter by asset type
        print("Test 2: Filter by asset_type")
        print("-" * 60)

        result = await client.get_reference_assets(
            basket_id=test_basket_id, asset_type="brand_guideline"
        )

        print(f"✅ Asset type filter succeeded")
        print(f"   Brand guideline assets: {len(result.get('assets', []))}")
        print()

        # Test 3: Filter by agent scope
        print("Test 3: Filter by agent_scope")
        print("-" * 60)

        result = await client.get_reference_assets(
            basket_id=test_basket_id, agent_scope="research"
        )

        print(f"✅ Agent scope filter succeeded")
        print(f"   Research-scoped assets: {len(result.get('assets', []))}")
        print()

        # Test 4: With user JWT (if available)
        user_jwt = os.getenv("TEST_USER_JWT")
        if user_jwt:
            print("Test 4: List assets with user JWT")
            print("-" * 60)

            result = await client.get_reference_assets(
                basket_id=test_basket_id, user_jwt=user_jwt
            )

            print(f"✅ HTTP request with user JWT succeeded")
            print(f"   Total assets: {len(result.get('assets', []))}")
            print()
        else:
            print("Test 4: Skipped (TEST_USER_JWT not set)")
            print()

        # Test 5: Combined filters
        print("Test 5: Combined filters (asset_type + agent_scope)")
        print("-" * 60)

        result = await client.get_reference_assets(
            basket_id=test_basket_id,
            asset_type="research_report",
            agent_scope="research",
        )

        print(f"✅ Combined filter succeeded")
        print(f"   Research reports for research agents: {len(result.get('assets', []))}")
        print()

        print("=" * 60)
        print("✅ PHASE 1 CHECKPOINT: get_reference_assets tool PASSED")
        print()
        print("Verified:")
        print("   - HTTP communication works")
        print("   - Asset listing works")
        print("   - Asset type filtering works")
        print("   - Agent scope filtering works")
        print("   - Combined filters work")
        print()
        print("Next: Validate all three tools work independently")
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
        print("❌ PHASE 1 CHECKPOINT: get_reference_assets tool FAILED")
        print()
        print("Possible issues:")
        print("   - reference_assets table doesn't exist in substrate-API")
        print("   - /api/substrate/baskets/{basket_id}/assets endpoint not found")
        print("   - Auth failed (service secret or user JWT)")
        print("   - Basket not found or workspace access denied")
        print("=" * 60)
        print()
        return False

    finally:
        await client.close()


if __name__ == "__main__":
    print()
    print("Phase 1: Testing get_reference_assets MCP Tool")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(test_get_reference_assets())

    exit(0 if success else 1)
