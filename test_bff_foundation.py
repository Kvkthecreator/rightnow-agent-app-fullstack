#!/usr/bin/env python3
"""
Phase 3.1 BFF Foundation Test

Tests the HTTP communication between Platform API and Substrate API.

Prerequisites:
1. Set environment variables:
   - SUBSTRATE_API_URL (or use default http://localhost:10000)
   - SUBSTRATE_SERVICE_SECRET
2. Both services running locally or pointing to deployed instances

Tests:
- Health check via HTTP
- Service authentication
- Circuit breaker behavior
- Rate limiting (if enabled)
"""

import os
import sys

# Add platform API to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "platform/api/src"))

from clients.substrate_client import SubstrateClient, SubstrateAPIError


def test_health_check():
    """Test basic health check endpoint."""
    print("=" * 60)
    print("Test 1: Health Check")
    print("=" * 60)

    try:
        client = SubstrateClient()
        result = client.health_check()
        print(f"✅ Health check passed: {result}")
        return True
    except SubstrateAPIError as e:
        print(f"❌ Health check failed: {e.message}")
        print(f"   Status: {e.status_code}")
        print(f"   Details: {e.details}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def test_work_queue_health():
    """Test work queue health endpoint."""
    print("\n" + "=" * 60)
    print("Test 2: Work Queue Health")
    print("=" * 60)

    try:
        client = SubstrateClient()
        result = client.work_queue_health()
        print(f"✅ Work queue health check passed")
        print(f"   Queue status: {result}")
        return True
    except SubstrateAPIError as e:
        print(f"❌ Work queue health check failed: {e.message}")
        if e.status_code == 401 or e.status_code == 403:
            print("   💡 This may require service auth to be configured")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def test_circuit_breaker():
    """Test circuit breaker opens after failures."""
    print("\n" + "=" * 60)
    print("Test 3: Circuit Breaker")
    print("=" * 60)

    try:
        # Create client with invalid URL to trigger failures
        client = SubstrateClient(base_url="http://invalid-host:9999", timeout=1.0)

        print("Triggering failures to open circuit breaker...")
        for i in range(6):
            try:
                client.health_check()
            except Exception:
                print(f"  Attempt {i+1}: Failed (expected)")

        print("\n⚠️  Circuit should be OPEN now")
        print("Attempting request with open circuit...")

        try:
            client.health_check()
            print("❌ Circuit breaker did not block request")
            return False
        except SubstrateAPIError as e:
            if "circuit breaker is OPEN" in e.message.lower():
                print(f"✅ Circuit breaker correctly blocked request: {e.message}")
                return True
            else:
                print(f"❌ Unexpected error: {e.message}")
                return False

    except Exception as e:
        print(f"❌ Test error: {e}")
        return False


def test_service_auth():
    """Test service authentication."""
    print("\n" + "=" * 60)
    print("Test 4: Service Authentication")
    print("=" * 60)

    secret = os.getenv("SUBSTRATE_SERVICE_SECRET")
    if not secret:
        print("⚠️  SUBSTRATE_SERVICE_SECRET not set - skipping auth test")
        return True

    try:
        # Test with correct secret
        client = SubstrateClient(service_secret=secret)
        client.health_check()
        print("✅ Service authentication with correct secret passed")

        # Test with wrong secret
        print("\nTesting with wrong secret...")
        client_invalid = SubstrateClient(service_secret="wrong-secret")
        try:
            client_invalid.health_check()
            print("❌ Authentication did not reject wrong secret")
            return False
        except SubstrateAPIError as e:
            if e.status_code == 401:
                print(f"✅ Wrong secret correctly rejected: {e.message}")
                return True
            else:
                print(f"❌ Unexpected error: {e.message}")
                return False

    except SubstrateAPIError as e:
        if e.status_code == 401:
            print(f"❌ Valid secret was rejected: {e.message}")
            print("   💡 Check that SUBSTRATE_SERVICE_SECRET matches on both services")
        else:
            print(f"❌ Service auth test failed: {e.message}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def print_config():
    """Print current configuration."""
    print("=" * 60)
    print("Configuration")
    print("=" * 60)
    print(f"SUBSTRATE_API_URL: {os.getenv('SUBSTRATE_API_URL', 'http://localhost:10000')}")
    print(f"SUBSTRATE_SERVICE_SECRET: {'SET' if os.getenv('SUBSTRATE_SERVICE_SECRET') else 'NOT SET'}")
    print()


def main():
    """Run all tests."""
    print("\n🚀 Phase 3.1 BFF Foundation Test Suite\n")

    print_config()

    tests = [
        ("Health Check", test_health_check),
        ("Work Queue Health", test_work_queue_health),
        ("Circuit Breaker", test_circuit_breaker),
        ("Service Authentication", test_service_auth),
    ]

    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed_count}/{total_count} tests passed")

    if passed_count == total_count:
        print("\n🎉 All tests passed! BFF foundation is working.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check logs above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
