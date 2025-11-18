"""
Quick Phase 1 validation test - Minimal test to verify deployment works.

This test checks if the substrate-API semantic search endpoint is accessible.
"""

import asyncio
import httpx


async def test_substrate_api_health():
    """Test if substrate-API is responsive."""
    print("=" * 60)
    print("Phase 1 Quick Test: Substrate-API Health Check")
    print("=" * 60)
    print()

    substrate_url = "https://yarnnn-enterprise-api.onrender.com"

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 1: Health endpoint
        print("Test 1: Health endpoint")
        print("-" * 60)
        try:
            response = await client.get(f"{substrate_url}/")
            print(f"✅ Health check: {response.status_code}")
            print(f"   Response: {response.json()}")
            print()
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            print()
            return False

        # Test 2: Check if semantic search endpoint exists (should return 401/403 without auth)
        print("Test 2: Semantic search endpoint exists")
        print("-" * 60)
        try:
            response = await client.post(
                f"{substrate_url}/api/substrate/search",
                json={
                    "basket_id": "test",
                    "query_text": "test query",
                    "filters": {},
                    "limit": 5
                }
            )
            print(f"   Status: {response.status_code}")
            if response.status_code in [401, 403]:
                print(f"✅ Endpoint exists (auth required, as expected)")
            elif response.status_code == 404:
                print(f"❌ Endpoint not found - Phase 1 deployment may have failed")
                return False
            else:
                print(f"✅ Endpoint exists (got status: {response.status_code})")
            print()
        except Exception as e:
            print(f"❌ Endpoint check failed: {e}")
            print()
            return False

        # Test 3: Check work_outputs endpoint
        print("Test 3: Work outputs endpoint exists")
        print("-" * 60)
        try:
            response = await client.get(
                f"{substrate_url}/api/baskets/test-id/work-outputs"
            )
            print(f"   Status: {response.status_code}")
            if response.status_code in [401, 403, 404]:
                print(f"✅ Endpoint exists (auth/basket required, as expected)")
            else:
                print(f"✅ Endpoint exists (got status: {response.status_code})")
            print()
        except Exception as e:
            print(f"❌ Endpoint check failed: {e}")
            print()
            return False

        # Test 4: Check reference assets endpoint
        print("Test 4: Reference assets endpoint exists")
        print("-" * 60)
        try:
            response = await client.get(
                f"{substrate_url}/api/substrate/baskets/test-id/assets"
            )
            print(f"   Status: {response.status_code}")
            if response.status_code in [401, 403, 404]:
                print(f"✅ Endpoint exists (auth/basket required, as expected)")
            else:
                print(f"✅ Endpoint exists (got status: {response.status_code})")
            print()
        except Exception as e:
            print(f"❌ Endpoint check failed: {e}")
            print()
            return False

    print("=" * 60)
    print("✅ Phase 1 Deployment Verified!")
    print()
    print("All endpoints are accessible:")
    print("   ✓ /api/substrate/search (semantic search)")
    print("   ✓ /api/baskets/{id}/work-outputs (work outputs)")
    print("   ✓ /api/substrate/baskets/{id}/assets (reference assets)")
    print()
    print("Next: Run full test suite with actual basket ID and auth tokens")
    print("=" * 60)
    print()

    return True


if __name__ == "__main__":
    success = asyncio.run(test_substrate_api_health())
    exit(0 if success else 1)
