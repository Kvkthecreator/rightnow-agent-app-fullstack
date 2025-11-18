"""
Test all MCP tools together - Phase 1 MCP Integration

Runs all three MCP tool tests in sequence to validate Phase 1 completion.

Phase 1 Exit Criteria:
- ✅ MCP server starts without errors
- ✅ query_substrate returns blocks from substrate-API
- ✅ emit_work_output creates work_outputs rows
- ✅ get_reference_assets fetches files from Supabase Storage
- ✅ Auth works (service token + user JWT)
- ✅ Can call tools from test script (not agent yet)

See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md Phase 1
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))


async def run_all_tests():
    """Run all MCP tool tests."""
    print("=" * 80)
    print("PHASE 1: MCP Tools for Substrate - Comprehensive Test Suite")
    print("=" * 80)
    print()

    # Check required environment variables
    print("Environment Check:")
    print("-" * 80)

    required_vars = {
        "SUBSTRATE_API_URL": os.getenv("SUBSTRATE_API_URL", "https://yarnnn-substrate-api.onrender.com"),
        "SUBSTRATE_SERVICE_SECRET": os.getenv("SUBSTRATE_SERVICE_SECRET", ""),
        "TEST_BASKET_ID": os.getenv("TEST_BASKET_ID", ""),
    }

    optional_vars = {
        "TEST_USER_JWT": os.getenv("TEST_USER_JWT", ""),
    }

    print("Required Variables:")
    for key, value in required_vars.items():
        if value:
            display_value = "*" * len(value) if "SECRET" in key else value
            print(f"   ✓ {key}: {display_value}")
        else:
            print(f"   ✗ {key}: NOT SET")

    print()
    print("Optional Variables:")
    for key, value in optional_vars.items():
        if value:
            print(f"   ✓ {key}: present")
        else:
            print(f"   - {key}: not set (some tests will be skipped)")

    print()

    # Check if required variables are set
    if not all(required_vars.values()):
        print("❌ Required environment variables missing!")
        print()
        print("Please set:")
        print("   export SUBSTRATE_API_URL=https://yarnnn-substrate-api.onrender.com")
        print("   export SUBSTRATE_SERVICE_SECRET=your_service_secret")
        print("   export TEST_BASKET_ID=your_test_basket_id")
        print()
        print("Optional:")
        print("   export TEST_USER_JWT=your_user_jwt_token")
        print()
        return False

    # Import test modules
    from test_mcp_query_substrate import test_query_substrate
    from test_mcp_emit_work_output import test_emit_work_output
    from test_mcp_get_reference_assets import test_get_reference_assets

    results = {}

    # Test 1: query_substrate
    print()
    print("=" * 80)
    print("Running Test 1 of 3: query_substrate")
    print("=" * 80)
    print()

    try:
        results["query_substrate"] = await test_query_substrate()
    except Exception as e:
        print(f"❌ query_substrate test crashed: {e}")
        results["query_substrate"] = False

    # Test 2: emit_work_output
    print()
    print("=" * 80)
    print("Running Test 2 of 3: emit_work_output")
    print("=" * 80)
    print()

    try:
        results["emit_work_output"] = await test_emit_work_output()
    except Exception as e:
        print(f"❌ emit_work_output test crashed: {e}")
        results["emit_work_output"] = False

    # Test 3: get_reference_assets
    print()
    print("=" * 80)
    print("Running Test 3 of 3: get_reference_assets")
    print("=" * 80)
    print()

    try:
        results["get_reference_assets"] = await test_get_reference_assets()
    except Exception as e:
        print(f"❌ get_reference_assets test crashed: {e}")
        results["get_reference_assets"] = False

    # Summary
    print()
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
        print("   1. Deploy to Render (work-platform + substrate-API)")
        print("   2. Test in production environment")
        print("   3. Proceed to Phase 2: Base Skills (YARNNN Patterns)")
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
        print("Troubleshooting:")
        print("   1. Check substrate-API is deployed and accessible")
        print("   2. Verify environment variables are correct")
        print("   3. Check database tables exist (work_outputs, reference_assets)")
        print("   4. Review substrate-API logs for errors")
        print("   5. Test manually with curl/Postman")
        print()

    print("=" * 80)
    print()

    return all_passed


if __name__ == "__main__":
    print()
    print("Phase 1: MCP Tools for Substrate - Comprehensive Test")
    print("See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md")
    print()

    success = asyncio.run(run_all_tests())

    exit(0 if success else 1)
