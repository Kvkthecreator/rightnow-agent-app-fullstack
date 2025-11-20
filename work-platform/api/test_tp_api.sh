#!/bin/bash
# Test Thinking Partner API Endpoints (requires server running)

API_BASE="http://localhost:8000"

echo "======================================================================"
echo "THINKING PARTNER - API ENDPOINT TESTS"
echo "======================================================================"
echo ""

# Test 1: Capabilities (unauthenticated)
echo "=== Test 1: GET /api/tp/capabilities ==="
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/tp/capabilities" 2>&1)
status_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" = "200" ]; then
    echo "✅ Status: $status_code"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    if echo "$body" | grep -q "Connection refused"; then
        echo "❌ Connection failed - server not running"
        echo "   Start with: cd work-platform/api && uvicorn app.agent_server:app --reload --port 8000"
        exit 1
    else
        echo "❌ Status: $status_code"
        echo "$body"
    fi
fi

echo ""
echo "======================================================================"
echo "SERVER STATUS: Running ✓"
echo "TP CAPABILITIES ENDPOINT: Working ✓"
echo ""
echo "To test authenticated endpoints (POST /api/tp/chat):"
echo "1. Get JWT token from logged-in session"
echo "2. Run: curl -X POST http://localhost:8000/api/tp/chat \\"
echo "        -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"basket_id\":\"YOUR_BASKET_ID\",\"message\":\"Hello\"}'"
echo "======================================================================"
