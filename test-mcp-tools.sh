#!/bin/bash

# YARNNN MCP Server Testing Script
# This script tests all MCP tools using curl
# More reliable than Inspector for automated testing

TOKEN="Bearer V3_UZKgbQq1dWkbnBnFWKwQhsG48LGB6VIQTvfOAR05trDD5ZaYElfcTVqU2bxmv"
SERVER="https://mcp.yarnnn.com"

echo "🧪 Testing YARNNN MCP Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Initialize (handshake)
echo "1️⃣  Testing MCP Initialize..."
curl -s -X POST "$SERVER/" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0"}
    },
    "id": 1
  }' | python3 -m json.tool
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2: List Tools
echo "2️⃣  Listing Available Tools..."
curl -s -X POST "$SERVER/" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }' | python3 -m json.tool | head -50
echo "... (output truncated)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 3: Get Substrate (simple query)
echo "3️⃣  Testing get_substrate tool..."
curl -s -X POST "$SERVER/" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_substrate",
      "arguments": {
        "keywords": ["test"],
        "format": "structured",
        "limit": 5
      }
    },
    "id": 3
  }' | python3 -m json.tool
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 4: Connect YARNNN (verify workspace)
echo "4️⃣  Testing connect_yarnnn tool..."
curl -s -X POST "$SERVER/" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "connect_yarnnn",
      "arguments": {}
    },
    "id": 4
  }' | python3 -m json.tool
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Testing complete!"
echo ""
echo "💡 To test other tools, use this format:"
echo ""
echo "curl -s -X POST '$SERVER/' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: $TOKEN' \\"
echo "  -d '{"
echo "    \"jsonrpc\": \"2.0\","
echo "    \"method\": \"tools/call\","
echo "    \"params\": {"
echo "      \"name\": \"TOOL_NAME\","
echo "      \"arguments\": { ... }"
echo "    },"
echo "    \"id\": 5"
echo "  }' | python3 -m json.tool"
echo ""
