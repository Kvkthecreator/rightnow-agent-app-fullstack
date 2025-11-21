#!/bin/bash

# Test TP chat endpoint
API_URL="https://yarnnn-work-platform-api.onrender.com/api/tp/chat"
BASKET_ID="c8656bd2-b0eb-4d32-9898-0d1f3e932310"

# Get auth token from environment (user needs to provide their JWT)
if [ -z "$JWT_TOKEN" ]; then
    echo "Error: JWT_TOKEN environment variable not set"
    echo "Usage: JWT_TOKEN=your_jwt_token ./test_tp_endpoint.sh"
    exit 1
fi

echo "Testing TP chat endpoint..."
echo "URL: $API_URL"
echo "Basket: $BASKET_ID"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"basket_id\": \"$BASKET_ID\",
    \"message\": \"Hello! Just testing if you're working.\"
  }" \
  -v

echo ""
echo "Test complete"
