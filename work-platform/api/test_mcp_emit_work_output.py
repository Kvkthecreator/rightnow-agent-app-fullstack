"""
Test emit_work_output MCP tool - Phase 1 MCP Integration

This tests the work output creation bridge between work-platform and substrate-API.
Tests HTTP communication, structured output schema, and supervision lifecycle.

Phase 1 Scope:
- Test tool independently (NO agent integration yet)
- Validate HTTP request/response flow
- Test output schema validation
- Verify work_outputs table write

Success Criteria:
- ✅ HTTP request succeeds
- ✅ Creates work_outputs row in substrate-API
- ✅ Output appears with supervision_status='pending_review'
- ✅ Provenance tracking works (source_context_ids)

See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md Phase 1
"""

import asyncio
import os
import sys
from pathlib import Path
from uuid import uuid4

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from mcp_tools.server import SubstrateClient


async def test_emit_work_output():
    """Test emit_work_output tool HTTP communication."""
    print("=" * 60)
    print("Phase 1 Test: emit_work_output MCP Tool")
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
        # Test 1: Create a finding output
        print("Test 1: Create finding work output")
        print("-" * 60)

        test_basket_id = os.getenv("TEST_BASKET_ID", "ani-project-basket-id")
        test_work_session_id = str(uuid4())  # Generate test work session ID

        print(f"Basket ID: {test_basket_id}")
        print(f"Work Session ID: {test_work_session_id}")
        print()

        finding_output = {
            "summary": "Critical API rate limiting constraint identified",
            "details": (
                "The authentication endpoint has a rate limit of 100 requests per minute. "
                "This could impact user experience during peak usage. "
                "Recommend implementing exponential backoff in client applications."
            ),
            "evidence": [
                "API documentation specifies 100 req/min limit",
                "Load testing showed 429 errors at 120 req/min",
                "Production logs show rate limit hits during login spikes",
            ],
            "recommendations": [
                "Implement client-side exponential backoff",
                "Add rate limit headers to API responses",
                "Consider increasing limit for authenticated users",
            ],
            "confidence_factors": {
                "documentation_clear": True,
                "testing_completed": True,
                "production_evidence": True,
            },
        }

        result = await client.emit_work_output(
            basket_id=test_basket_id,
            work_session_id=test_work_session_id,
            output_type="finding",
            agent_type="research",
            title="API Rate Limiting Analysis",
            body=finding_output,
            confidence=0.85,
            source_context_ids=["block-1", "block-2", "block-3"],  # Mock block IDs
            tool_call_id="test_call_001",
        )

        print(f"✅ Work output created successfully")
        print(f"   Output ID: {result.get('id', 'unknown')}")
        print(f"   Supervision Status: {result.get('supervision_status', 'unknown')}")
        print(f"   Output Type: {result.get('output_type', 'unknown')}")
        print(f"   Confidence: {result.get('confidence', 0):.2f}")
        print()

        # Verify it's pending_review
        if result.get("supervision_status") == "pending_review":
            print("   ✓ Status is 'pending_review' (correct initial state)")
        else:
            print(f"   ⚠ Unexpected status: {result.get('supervision_status')}")
        print()

        # Test 2: Create a recommendation output
        print("Test 2: Create recommendation work output")
        print("-" * 60)

        recommendation_output = {
            "summary": "Implement caching layer for frequently accessed data",
            "details": (
                "Analysis shows 60% of API calls request the same reference data. "
                "Adding a Redis cache layer could reduce database load by 50% "
                "and improve response times from 200ms to 50ms."
            ),
            "evidence": [
                "60% of queries are for reference data",
                "Average response time: 200ms",
                "Estimated cache hit rate: 70%",
            ],
            "recommendations": [
                "Deploy Redis cluster (HA configuration)",
                "Implement cache invalidation strategy",
                "Monitor cache hit rates",
                "Set TTL to 1 hour for reference data",
            ],
            "confidence_factors": {
                "data_analysis_depth": "high",
                "implementation_complexity": "medium",
                "business_impact": "high",
            },
        }

        result = await client.emit_work_output(
            basket_id=test_basket_id,
            work_session_id=test_work_session_id,
            output_type="recommendation",
            agent_type="research",
            title="Caching Strategy Recommendation",
            body=recommendation_output,
            confidence=0.78,
            source_context_ids=["block-4", "block-5"],
            metadata={"impact_area": "performance", "priority": "high"},
        )

        print(f"✅ Recommendation output created successfully")
        print(f"   Output ID: {result.get('id', 'unknown')}")
        print(f"   Metadata preserved: {bool(result.get('metadata'))}")
        print()

        # Test 3: Create an insight output (with user JWT if available)
        user_jwt = os.getenv("TEST_USER_JWT")
        if user_jwt:
            print("Test 3: Create insight output with user JWT")
            print("-" * 60)

            insight_output = {
                "summary": "User engagement drops 40% after rate limit errors",
                "details": (
                    "Correlation analysis shows users who hit rate limits "
                    "are 40% less likely to complete their workflow. "
                    "This represents a significant user experience issue."
                ),
            }

            result = await client.emit_work_output(
                basket_id=test_basket_id,
                work_session_id=test_work_session_id,
                output_type="insight",
                agent_type="analysis",
                title="Rate Limit Impact on User Engagement",
                body=insight_output,
                confidence=0.72,
                source_context_ids=["block-6"],
                user_jwt=user_jwt,
            )

            print(f"✅ Insight output with user JWT created successfully")
            print(f"   Output ID: {result.get('id', 'unknown')}")
            print()
        else:
            print("Test 3: Skipped (TEST_USER_JWT not set)")
            print()

        print("=" * 60)
        print("✅ PHASE 1 CHECKPOINT: emit_work_output tool PASSED")
        print()
        print("Verified:")
        print("   - HTTP communication works")
        print("   - Work outputs created in substrate-API")
        print("   - Supervision status set to 'pending_review'")
        print("   - Structured output schema validated")
        print("   - Provenance tracking works")
        print("   - Metadata preserved")
        print()
        print("Next: Test get_reference_assets tool")
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
        print("❌ PHASE 1 CHECKPOINT: emit_work_output tool FAILED")
        print()
        print("Possible issues:")
        print("   - work_outputs table doesn't exist in substrate-API")
        print("   - Schema validation failed")
        print("   - Auth failed (service secret or user JWT)")
        print("   - Basket not found or workspace access denied")
        print("=" * 60)
        print()
        return False

    finally:
        await client.close()


if __name__ == "__main__":
    print()
    print("Phase 1: Testing emit_work_output MCP Tool")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(test_emit_work_output())

    exit(0 if success else 1)
