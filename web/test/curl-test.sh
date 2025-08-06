#!/bin/bash

# Simple cURL-based test for context addition
# Usage: ./test/curl-test.sh [AUTH_COOKIE]

set -e

BASE_URL="https://www.yarnnn.com"
BASKET_ID="da75cf04-65e5-46ac-940a-74e2ffe077a2"
TEST_CONTENT="This is a simple curl test with fifteen words to verify the context addition flow works correctly."

# Check if auth cookie is provided
if [ -z "$1" ]; then
    echo "❌ Usage: $0 'AUTH_COOKIE'"
    echo ""
    echo "Get AUTH_COOKIE from browser dev tools:"
    echo "1. Open browser dev tools"
    echo "2. Go to Network tab"
    echo "3. Make any request to www.yarnnn.com"
    echo "4. Copy the Cookie header value"
    echo ""
    echo "Example:"
    echo "./test/curl-test.sh 'sb-galytxxkrbksilekmhcw-auth-token=...'"
    exit 1
fi

AUTH_COOKIE="$1"

echo "🧪 CURL CONTEXT ADDITION TEST"
echo "============================="
echo "🎯 Basket ID: $BASKET_ID"
echo "📝 Test Content: $TEST_CONTENT"
echo "🔢 Word Count: $(echo "$TEST_CONTENT" | wc -w | tr -d ' ') words"
echo ""

# Step 1: Get initial substrate state
echo "📊 Step 1: Getting initial substrate state..."
INITIAL_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -H "Cookie: $AUTH_COOKIE" \
  "$BASE_URL/api/substrate/basket/$BASKET_ID")

HTTP_STATUS=$(echo "$INITIAL_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
INITIAL_DATA=$(echo "$INITIAL_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ Failed to get initial substrate state (HTTP $HTTP_STATUS)"
    exit 1
fi

echo "✅ Initial state retrieved"
echo ""

# Step 2: Add context
echo "➕ Step 2: Adding context via /api/changes..."

CHANGE_ID=$(uuidgen)
PAYLOAD=$(cat <<EOF
{
  "id": "$CHANGE_ID",
  "type": "context_add",
  "basketId": "$BASKET_ID",
  "data": {
    "content": [{
      "type": "text",
      "content": "$TEST_CONTENT",
      "metadata": {
        "source": "curl-test",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
      }
    }],
    "triggerIntelligenceRefresh": false
  },
  "metadata": {
    "testRun": true
  },
  "origin": "test"
}
EOF
)

echo "📤 Sending request to /api/changes..."
ADD_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d "$PAYLOAD" \
  "$BASE_URL/api/changes")

ADD_HTTP_STATUS=$(echo "$ADD_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
ADD_DATA=$(echo "$ADD_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "📥 Response status: $ADD_HTTP_STATUS"

if [ "$ADD_HTTP_STATUS" != "200" ]; then
    echo "❌ Failed to add context (HTTP $ADD_HTTP_STATUS)"
    echo "Response: $ADD_DATA"
    exit 1
fi

# Check if response indicates success
if echo "$ADD_DATA" | grep -q '"success":true'; then
    echo "✅ Context addition successful"
else
    echo "❌ Context addition failed"
    echo "Response: $ADD_DATA"
    exit 1
fi

echo ""

# Step 3: Wait for processing
echo "⏳ Step 3: Waiting for processing..."
sleep 3
echo "✅ Wait complete"
echo ""

# Step 4: Get final substrate state
echo "📊 Step 4: Getting updated substrate state..."
FINAL_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -H "Cookie: $AUTH_COOKIE" \
  "$BASE_URL/api/substrate/basket/$BASKET_ID")

FINAL_HTTP_STATUS=$(echo "$FINAL_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
FINAL_DATA=$(echo "$FINAL_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$FINAL_HTTP_STATUS" != "200" ]; then
    echo "❌ Failed to get final substrate state (HTTP $FINAL_HTTP_STATUS)"
    exit 1
fi

echo "✅ Final state retrieved"
echo ""

# Step 5: Basic verification
echo "🔍 Step 5: Analyzing results..."

# Simple check - see if the response changed at all
if [ "$INITIAL_DATA" = "$FINAL_DATA" ]; then
    echo "❌ FAILURE: Substrate data unchanged"
    exit 1
else
    echo "✅ SUCCESS: Substrate data changed"
fi

echo ""
echo "🎉 CURL TEST COMPLETED!"
echo "======================="
echo "✅ Context was added successfully"
echo "✅ Substrate state changed"
echo "✅ API endpoints are working"
echo ""
echo "💡 For detailed word count analysis, use the Node.js test:"
echo "   export AUTH_COOKIE='$AUTH_COOKIE'"
echo "   node test/verify-context-flow.js"