#!/bin/bash
# Smoke tests for hardened PDF ingestion and real deltas

# Configuration
API="${API:-http://localhost:8000}"
JWT="${JWT:-your-jwt-token}"
BID="${BID:-$(uuidgen | tr '[:upper:]' '[:lower:]')}"
PUBLIC_PDF_URL="${PUBLIC_PDF_URL:-https://your-bucket.supabase.co/storage/v1/object/public/test.pdf}"

echo "🧪 Running smoke tests for hardened backend..."
echo "API: $API"
echo "Basket ID: $BID"
echo ""

# Test 1: PDF Ingestion
echo "1️⃣ Testing PDF ingestion..."
DUMP_RESPONSE=$(curl -s -X POST "$API/api/dumps/new" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Req-Id: smoke-pdf-001" \
  -d "{
    \"basket_id\":\"$BID\",
    \"text_dump\":\"Initial context for the basket\",
    \"file_urls\":[\"$PUBLIC_PDF_URL\"]
  }")

echo "Response: $DUMP_RESPONSE"

# Extract dump ID
if echo "$DUMP_RESPONSE" | grep -q "raw_dump_ids"; then
  DUMP_ID=$(echo "$DUMP_RESPONSE" | jq -r '.raw_dump_ids[0]')
else
  DUMP_ID=$(echo "$DUMP_RESPONSE" | jq -r '.raw_dump_id')
fi

if [ -z "$DUMP_ID" ] || [ "$DUMP_ID" = "null" ]; then
  echo "❌ Failed to create dump"
  exit 1
fi

echo "✅ Created dump: $DUMP_ID"
echo ""

# Test 2: Init Build Mode
echo "2️⃣ Testing init_build mode..."
INIT_RESPONSE=$(curl -s -X POST "$API/api/baskets/$BID/work" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Req-Id: smoke-init-001" \
  -d "{
    \"mode\":\"init_build\",
    \"sources\":[{\"type\":\"raw_dump\",\"id\":\"$DUMP_ID\"}],
    \"options\":{\"trace_req_id\":\"smoke-init-001\"}
  }")

echo "Response: $INIT_RESPONSE" | jq '.'

# Verify real entity changes
CHANGE_COUNT=$(echo "$INIT_RESPONSE" | jq '.changes | length')
if [ "$CHANGE_COUNT" -gt 0 ]; then
  FIRST_ID=$(echo "$INIT_RESPONSE" | jq -r '.changes[0].id')
  if [[ "$FIRST_ID" == *"block_"*"_"* ]]; then
    echo "⚠️  Warning: Synthetic IDs detected"
  else
    echo "✅ Real entity IDs returned"
  fi
else
  echo "❌ No changes returned"
fi
echo ""

# Test 3: Evolve Turn Mode
echo "3️⃣ Testing evolve_turn mode..."
# Create another dump for evolution
NEW_DUMP_RESPONSE=$(curl -s -X POST "$API/api/dumps/new" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Req-Id: smoke-pdf-002" \
  -d "{
    \"basket_id\":\"$BID\",
    \"text_dump\":\"Additional information for evolution\"
  }")

NEW_DUMP_ID=$(echo "$NEW_DUMP_RESPONSE" | jq -r '.raw_dump_id // .raw_dump_ids[0]')

EVOLVE_RESPONSE=$(curl -s -X POST "$API/api/baskets/$BID/work" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Req-Id: smoke-evolve-001" \
  -d "{
    \"mode\":\"evolve_turn\",
    \"sources\":[{\"type\":\"raw_dump\",\"id\":\"$NEW_DUMP_ID\"}],
    \"policy\":{\"allow_structural_changes\":true}
  }")

echo "Response: $EVOLVE_RESPONSE" | jq '.'

# Check for version updates
HAS_VERSIONS=$(echo "$EVOLVE_RESPONSE" | jq '.changes[] | select(.from_version != null)')
if [ -n "$HAS_VERSIONS" ]; then
  echo "✅ Version tracking working"
else
  echo "ℹ️  All new entities created (no updates)"
fi
echo ""

# Test 4: Idempotency
echo "4️⃣ Testing idempotency..."
RETRY_RESPONSE=$(curl -s -X POST "$API/api/baskets/$BID/work" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Req-Id: smoke-init-001" \
  -d "{
    \"mode\":\"init_build\",
    \"sources\":[{\"type\":\"raw_dump\",\"id\":\"$DUMP_ID\"}],
    \"options\":{\"trace_req_id\":\"smoke-init-001\"}
  }")

RETRY_DELTA_ID=$(echo "$RETRY_RESPONSE" | jq -r '.delta_id')
ORIG_DELTA_ID=$(echo "$INIT_RESPONSE" | jq -r '.delta_id')

if [ "$RETRY_DELTA_ID" = "$ORIG_DELTA_ID" ]; then
  echo "✅ Idempotency working (same delta returned)"
else
  echo "❌ Idempotency failed (different delta)"
fi
echo ""

# Test 5: Narrative Jobs (if enabled)
echo "5️⃣ Testing narrative jobs..."
NARRATIVE_RESPONSE=$(curl -s -X POST "$API/api/baskets/$BID/narrative/jobs" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"mode\":\"from_scaffold\"}")

if echo "$NARRATIVE_RESPONSE" | grep -q "job_id"; then
  JOB_ID=$(echo "$NARRATIVE_RESPONSE" | jq -r '.job_id')
  echo "✅ Narrative job created: $JOB_ID"
  
  # Check job status
  sleep 1
  JOB_STATUS=$(curl -s -X GET "$API/api/jobs/$JOB_ID" \
    -H "Authorization: Bearer $JWT")
  echo "Job status: $(echo "$JOB_STATUS" | jq -r '.state')"
elif echo "$NARRATIVE_RESPONSE" | grep -q "not enabled"; then
  echo "ℹ️  Narrative jobs not enabled (expected)"
else
  echo "❌ Unexpected narrative response: $NARRATIVE_RESPONSE"
fi
echo ""

# Test 6: Error Cases
echo "6️⃣ Testing error handling..."

# Disallowed URL
SSRF_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/dumps/new" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"basket_id\":\"$BID\",
    \"text_dump\":\"\",
    \"file_urls\":[\"https://evil.com/malicious.pdf\"]
  }")

if [ "$SSRF_RESPONSE" = "400" ]; then
  echo "✅ SSRF protection working (400)"
else
  echo "❌ SSRF protection failed (expected 400, got $SSRF_RESPONSE)"
fi

# No content
NO_CONTENT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/dumps/new" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"basket_id\":\"$BID\",\"text_dump\":\"\",\"file_urls\":[]}")

if [ "$NO_CONTENT_RESPONSE" = "422" ]; then
  echo "✅ Empty content validation (422)"
else
  echo "❌ Empty content check failed (expected 422, got $NO_CONTENT_RESPONSE)"
fi

echo ""
echo "🏁 Smoke tests complete!"
echo ""
echo "Summary:"
echo "- PDF ingestion: Check if dump was created with metadata"
echo "- Init build: Verify real entity IDs in changes"
echo "- Evolve turn: Check for version tracking"
echo "- Idempotency: Same request returns cached delta"
echo "- Error handling: Proper HTTP status codes"