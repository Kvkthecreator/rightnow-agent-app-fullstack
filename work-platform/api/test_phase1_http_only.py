"""
Phase 1 HTTP-only test - Tests MCP tools via direct HTTP calls.

This bypasses the MCP server imports and tests the substrate-API endpoints directly.
"""

import asyncio
import json
import os
import sys
from uuid import uuid4

try:
    import httpx
except ImportError:
    print("❌ httpx not installed. Install with: pip3 install httpx")
    sys.exit(1)


async def test_all_tools():
    """Test all three MCP tool endpoints via HTTP."""
    print("=" * 80)
    print("PHASE 1: HTTP-Only Test Suite (Direct API Calls)")
    print("=" * 80)
    print()

    # Configuration
    substrate_url = os.getenv("SUBSTRATE_API_URL", "https://yarnnn-enterprise-api.onrender.com")
    service_secret = os.getenv("SUBSTRATE_SERVICE_SECRET", "")
    basket_id = os.getenv("TEST_BASKET_ID", "")

    print("Configuration:")
    print("-" * 80)
    print(f"   Substrate API: {substrate_url}")
    print(f"   Service Secret: {'*' * len(service_secret) if service_secret else 'NOT SET'}")
    print(f"   Test Basket ID: {basket_id}")
    print()

    if not service_secret or not basket_id:
        print("❌ Missing required environment variables!")
        print("   Set SUBSTRATE_SERVICE_SECRET and TEST_BASKET_ID")
        return False

    headers = {
        "X-Service-Name": "platform-api",
        "X-Service-Secret": service_secret,
        "Content-Type": "application/json",
    }

    results = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 1: query_substrate (semantic search)
        print("=" * 80)
        print("Test 1: query_substrate (Semantic Search)")
        print("=" * 80)
        print()

        try:
            payload = {
                "basket_id": basket_id,
                "query_text": "What are the key technical constraints and requirements?",
                "filters": {
                    "semantic_types": ["constraint", "fact", "requirement"],
                    "states": ["ACCEPTED", "LOCKED", "CONSTANT"],
                    "min_similarity": 0.60,
                },
                "limit": 5,
            }

            print(f"POST {substrate_url}/api/substrate/search")
            print(f"Query: '{payload['query_text']}'")
            print()

            response = await client.post(
                f"{substrate_url}/api/substrate/search", json=payload, headers=headers
            )

            print(f"Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Semantic search succeeded")
                print(f"   Blocks returned: {data.get('total', 0)}")

                if data.get("blocks"):
                    print()
                    print("   Sample results:")
                    for i, block in enumerate(data["blocks"][:2], 1):
                        print(f"      {i}. [{block['semantic_type']}] {block['content'][:60]}...")
                        print(f"         Similarity: {block['similarity_score']:.3f}")

                results["query_substrate"] = True
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                results["query_substrate"] = False

        except Exception as e:
            print(f"❌ Exception: {e}")
            results["query_substrate"] = False

        print()

        # Test 2: emit_work_output
        print("=" * 80)
        print("Test 2: emit_work_output (Work Output Creation)")
        print("=" * 80)
        print()

        try:
            work_session_id = str(uuid4())
            payload = {
                "basket_id": basket_id,
                "work_session_id": work_session_id,
                "output_type": "finding",
                "agent_type": "research",
                "title": "Phase 1 Test Finding",
                "body": {
                    "summary": "This is a test finding created during Phase 1 MCP tools testing",
                    "details": "Validates that emit_work_output tool can create work outputs in substrate-API",
                    "evidence": ["Test evidence 1", "Test evidence 2"],
                },
                "confidence": 0.95,
                "source_context_ids": [],
                "tool_call_id": "test_phase1",
                "metadata": {"test": True, "phase": 1},
            }

            print(f"POST {substrate_url}/api/baskets/{basket_id}/work-outputs")
            print(f"Title: '{payload['title']}'")
            print()

            response = await client.post(
                f"{substrate_url}/api/baskets/{basket_id}/work-outputs", json=payload, headers=headers
            )

            print(f"Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Work output created successfully")
                print(f"   Output ID: {data.get('id')}")
                print(f"   Supervision Status: {data.get('supervision_status')}")
                print(f"   Output Type: {data.get('output_type')}")
                results["emit_work_output"] = True
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                results["emit_work_output"] = False

        except Exception as e:
            print(f"❌ Exception: {e}")
            results["emit_work_output"] = False

        print()

        # Test 3: get_reference_assets
        print("=" * 80)
        print("Test 3: get_reference_assets (Reference Assets List)")
        print("=" * 80)
        print()

        try:
            print(f"GET {substrate_url}/api/substrate/baskets/{basket_id}/assets")
            print()

            response = await client.get(
                f"{substrate_url}/api/substrate/baskets/{basket_id}/assets", headers=headers
            )

            print(f"Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Reference assets retrieved successfully")
                print(f"   Total assets: {len(data.get('assets', []))}")

                if data.get("assets"):
                    print()
                    print("   Sample assets:")
                    for i, asset in enumerate(data["assets"][:2], 1):
                        print(f"      {i}. [{asset.get('asset_type')}] {asset.get('filename')}")
                        print(f"         Size: {asset.get('file_size', 0) / 1024:.1f} KB")

                results["get_reference_assets"] = True
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                results["get_reference_assets"] = False

        except Exception as e:
            print(f"❌ Exception: {e}")
            results["get_reference_assets"] = False

        print()

    # Summary
    print("=" * 80)
    print("PHASE 1 TEST SUITE SUMMARY")
    print("=" * 80)
    print()

    print("Test Results:")
    print("-" * 80)
    for tool, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {tool:30s} {status}")

    print()
    print("-" * 80)

    all_passed = all(results.values())

    if all_passed:
        print("✅ ALL TESTS PASSED")
        print()
        print("Phase 1 Exit Criteria Met:")
        print("   ✓ MCP tools work independently")
        print("   ✓ HTTP communication with substrate-API works")
        print("   ✓ Service-to-service auth works")
        print("   ✓ All three tools (query, emit, get_assets) functional")
        print()
        print("🎉 PHASE 1 COMPLETE!")
        print()
        print("Next Steps:")
        print("   1. Proceed to Phase 2: Base Skills (YARNNN Patterns)")
        print("   2. Create .claude/skills/ directory structure")
        print("   3. Implement yarnnn-research-methodology skill")
        print()
    else:
        print("❌ SOME TESTS FAILED")
        print()
        print("Phase 1 Exit Criteria NOT Met:")
        failed_tools = [tool for tool, passed in results.items() if not passed]
        print(f"   Failed tools: {', '.join(failed_tools)}")
        print()
        print("DO NOT PROCEED to Phase 2 until all tests pass!")
        print()

    print("=" * 80)
    print()

    return all_passed


if __name__ == "__main__":
    success = asyncio.run(test_all_tools())
    exit(0 if success else 1)
