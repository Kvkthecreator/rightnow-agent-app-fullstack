"""
Test Thinking Partner API Endpoints

Tests the actual HTTP API (not just the agent class).
Requires the server to be running on localhost:8000.
"""

import requests
import json
import os

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_BASKET_ID = "5004b9e1-67f5-4955-b028-389d45b1f5a4"

# Get JWT token from environment or prompt
JWT_TOKEN = os.getenv("TEST_JWT_TOKEN")

if not JWT_TOKEN:
    print("WARNING: No TEST_JWT_TOKEN environment variable set.")
    print("You'll need a valid JWT token to test authenticated endpoints.")
    print("\nTo get a token:")
    print("1. Log into the app")
    print("2. Check browser localStorage for 'sb-<project>-auth-token'")
    print("3. Export: export TEST_JWT_TOKEN='your-token-here'")
    print("\nContinuing with unauthenticated tests only...\n")


def test_capabilities():
    """Test GET /api/tp/capabilities (unauthenticated)"""
    print("\n=== Test 1: GET /api/tp/capabilities ===")

    try:
        response = requests.get(f"{API_BASE_URL}/api/tp/capabilities")

        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Capabilities endpoint working")
            print(f"   Description: {data.get('description', 'N/A')}")
            print(f"   Pattern: {data.get('pattern', 'N/A')}")
            print(f"   Tools: {', '.join(data.get('tools', {}).keys())}")
            print(f"   Agents: {', '.join(data.get('agents_available', []))}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the server running?")
        print("   Start with: cd work-platform/api && uvicorn app.agent_server:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_chat():
    """Test POST /api/tp/chat (requires JWT)"""
    print("\n=== Test 2: POST /api/tp/chat ===")

    if not JWT_TOKEN:
        print("⏭️  Skipped - no JWT token available")
        return None

    try:
        headers = {
            "Authorization": f"Bearer {JWT_TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "basket_id": TEST_BASKET_ID,
            "message": "Hello! What agents are available?",
            "claude_session_id": None
        }

        response = requests.post(
            f"{API_BASE_URL}/api/tp/chat",
            headers=headers,
            json=payload
        )

        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat endpoint working")
            print(f"   Message length: {len(data.get('message', ''))} chars")
            print(f"   Session ID: {data.get('claude_session_id', 'N/A')[:50]}...")
            print(f"   Work outputs: {len(data.get('work_outputs', []))}")
            print(f"   Actions taken: {len(data.get('actions_taken', []))}")
            print(f"\n   Response preview:")
            print(f"   {data.get('message', '')[:200]}...")
            return True
        elif response.status_code == 401:
            print(f"❌ Unauthorized - JWT token invalid or expired")
            print(f"   Get a fresh token from the app")
            return False
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_session_get():
    """Test GET /api/tp/session/{id} (requires JWT and session_id)"""
    print("\n=== Test 3: GET /api/tp/session/{id} ===")
    print("⏭️  Skipped - requires existing session_id from chat")
    return None


def run_all_tests():
    """Run all API tests"""
    print("=" * 70)
    print("THINKING PARTNER - API ENDPOINT TESTS")
    print("=" * 70)
    print(f"API Base URL: {API_BASE_URL}")
    print(f"JWT Token: {'✓ Available' if JWT_TOKEN else '✗ Not set'}")
    print("=" * 70)

    results = {
        "capabilities": test_capabilities(),
        "chat": test_chat(),
        "session_get": test_session_get()
    }

    print("\n" + "=" * 70)
    print("RESULTS:")
    passed = sum(1 for r in results.values() if r is True)
    failed = sum(1 for r in results.values() if r is False)
    skipped = sum(1 for r in results.values() if r is None)

    for name, result in results.items():
        status = "✅ PASSED" if result is True else "❌ FAILED" if result is False else "⏭️  SKIPPED"
        print(f"  {name}: {status}")

    print(f"\nTotal: {passed} passed, {failed} failed, {skipped} skipped")
    print("=" * 70)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
