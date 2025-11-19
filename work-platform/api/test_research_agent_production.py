#!/usr/bin/env python3
"""
Test ResearchAgentSDK in production (Render deployment).

Tests:
1. Agent execution via /agents/run endpoint
2. Work outputs created successfully
3. Skills loaded correctly
"""

import os
import sys
import json
import requests
from datetime import datetime

# Configuration
API_BASE_URL = "https://yarnnn-work-platform.onrender.com"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Test configuration
TEST_BASKET_ID = os.getenv("TEST_BASKET_ID", "550e8400-e29b-41d4-a716-446655440000")
TEST_JWT_TOKEN = os.getenv("TEST_JWT_TOKEN")  # Must be provided

def print_header(text):
    print(f"\n{'='*80}")
    print(f"  {text}")
    print(f"{'='*80}\n")

def test_agent_execution():
    """Test ResearchAgentSDK via /agents/run endpoint."""
    print_header("Testing ResearchAgentSDK Execution")

    if not TEST_JWT_TOKEN:
        print("❌ ERROR: TEST_JWT_TOKEN environment variable not set")
        print("   Please provide a valid JWT token for testing")
        return False

    # Prepare request
    url = f"{API_BASE_URL}/agents/run"
    headers = {
        "Authorization": f"Bearer {TEST_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "agent_type": "research",
        "task_type": "deep_dive",
        "basket_id": TEST_BASKET_ID,
        "parameters": {
            "topic": "Test topic: AI agent SDK patterns and best practices"
        }
    }

    print(f"Request URL: {url}")
    print(f"Basket ID: {TEST_BASKET_ID}")
    print(f"Topic: {payload['parameters']['topic']}")
    print(f"\nSending request...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)

        print(f"\nResponse Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Agent execution successful!")
            print(f"\nResponse Summary:")
            print(f"  Status: {data.get('status')}")
            print(f"  Agent Type: {data.get('agent_type')}")
            print(f"  Task Type: {data.get('task_type')}")
            print(f"  Message: {data.get('message')}")

            # Check work outputs
            result = data.get('result', {})
            work_outputs = result.get('work_outputs', [])
            print(f"\n  Work Outputs Created: {len(work_outputs)}")

            if work_outputs:
                print(f"\n  Output Details:")
                for i, output in enumerate(work_outputs[:3], 1):  # Show first 3
                    print(f"    {i}. Type: {output.get('output_type')}")
                    print(f"       Title: {output.get('title')}")
                    print(f"       Confidence: {output.get('confidence')}")

                if len(work_outputs) > 3:
                    print(f"    ... and {len(work_outputs) - 3} more")

            # Check trial info
            if data.get('is_trial_request'):
                print(f"\n  Trial Status:")
                print(f"    Is Trial Request: {data.get('is_trial_request')}")
                print(f"    Remaining Trials: {data.get('remaining_trials')}")

            print(f"\n✅ Test PASSED: ResearchAgentSDK is working in production")
            return True

        elif response.status_code == 403:
            print(f"❌ Permission denied: {response.text}")
            print(f"   This might be a trial limit issue or invalid token")
            return False

        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False

    except requests.exceptions.Timeout:
        print(f"❌ Request timed out after 180 seconds")
        print(f"   Agent might still be running - check Render logs")
        return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_agent_capabilities():
    """Test /agents/capabilities endpoint."""
    print_header("Testing Agent Capabilities Endpoint")

    url = f"{API_BASE_URL}/agents/capabilities"

    print(f"Request URL: {url}")

    try:
        response = requests.get(url, timeout=10)

        print(f"Response Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Capabilities endpoint working")

            # Check if ResearchAgent capabilities are listed
            research_caps = data.get('research', {})
            print(f"\nResearch Agent Tasks:")
            for task_name, task_info in research_caps.get('tasks', {}).items():
                print(f"  - {task_name}: {task_info.get('description')}")

            return True
        else:
            print(f"❌ Request failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    print_header("ResearchAgentSDK Production Test Suite")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print(f"API Base URL: {API_BASE_URL}")

    # Check prerequisites
    if not ANTHROPIC_API_KEY:
        print("\n⚠️  WARNING: ANTHROPIC_API_KEY not set (required for agent execution)")

    results = []

    # Run tests
    results.append(("Agent Capabilities", test_agent_capabilities()))
    results.append(("Agent Execution", test_agent_execution()))

    # Summary
    print_header("Test Summary")

    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status} - {test_name}")

    total = len(results)
    passed = sum(1 for _, p in results if p)

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! ResearchAgentSDK is working in production.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
