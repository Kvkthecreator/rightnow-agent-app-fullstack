#!/bin/bash

# Context OS End-to-End Test Script
echo "🧪 Testing Complete Context OS Flow..."
echo "======================================="

# Configuration
BACKEND_URL="https://api.yarnnn.com"
FRONTEND_URL="http://localhost:3000"
TEST_BASKET_ID="test-$(date +%s)"

echo "📊 Backend: $BACKEND_URL"
echo "🌐 Frontend: $FRONTEND_URL"
echo "📦 Test Basket: $TEST_BASKET_ID"
echo ""

# Test 1: Backend Health Check
echo "1️⃣ Testing Backend Connectivity..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/" || echo "FAILED")
if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    echo "✅ Backend is accessible"
else
    echo "❌ Backend health check failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Agent Endpoint Check
echo ""
echo "2️⃣ Testing Agent Endpoints..."
AGENT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/agents/orch_block_manager/run" \
  -H "Content-Type: application/json" \
  -d "{\"basket_id\": \"$TEST_BASKET_ID\"}" 2>&1)

if [[ "$AGENT_RESPONSE" == *"Internal Server Error"* ]] || [[ "$AGENT_RESPONSE" == *"basket not found"* ]]; then
    echo "⚠️  Agent endpoint exists but needs valid basket (expected)"
else
    echo "❓ Unexpected agent response: $AGENT_RESPONSE"
fi

# Test 3: Database Connection Test (via frontend API)
echo ""
echo "3️⃣ Testing Frontend-Backend Integration..."
FRONTEND_TEST=$(curl -s "$FRONTEND_URL/api/health" 2>&1 || echo "FRONTEND_DOWN")
if [[ "$FRONTEND_TEST" != "FRONTEND_DOWN" ]]; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend not running on $FRONTEND_URL"
    echo "   Start with: cd web && npm run dev"
fi

# Test 4: Mock Detection Test
echo ""
echo "4️⃣ Checking for Mock Service Elimination..."
MOCK_FILES=$(find web -name "*.tsx" -o -name "*.ts" | xargs grep -l "MockIntelligenceService\|using mock" 2>/dev/null | head -5)
if [[ -z "$MOCK_FILES" ]]; then
    echo "✅ No mock service references found"
else
    echo "⚠️  Found potential mock references:"
    echo "$MOCK_FILES"
fi

# Test 5: Backend URL Configuration Check
echo ""
echo "5️⃣ Checking Backend URL Configuration..."
LOCALHOST_REFS=$(grep -r "localhost:8000" web --include="*.ts" --include="*.tsx" 2>/dev/null | head -3)
if [[ -z "$LOCALHOST_REFS" ]]; then
    echo "✅ No localhost:8000 hardcoded references found"
else
    echo "⚠️  Found localhost references:"
    echo "$LOCALHOST_REFS"
fi

# Test 6: Component Integration Check
echo ""
echo "6️⃣ Checking Component Integration..."

# Check if BlockReview is imported in work page
BLOCK_REVIEW_IMPORT=$(grep -n "BlockReview" web/app/baskets/\[id\]/work/page.tsx 2>/dev/null)
if [[ -n "$BLOCK_REVIEW_IMPORT" ]]; then
    echo "✅ BlockReview component integrated in work page"
else
    echo "❌ BlockReview component not found in work page"
fi

# Check if DocumentComposer is imported in document creation
DOC_COMPOSER_IMPORT=$(grep -n "DocumentComposer" web/app/baskets/\[id\]/work/documents/new/page.tsx 2>/dev/null)
if [[ -n "$DOC_COMPOSER_IMPORT" ]]; then
    echo "✅ DocumentComposer integrated in document creation"
else
    echo "❌ DocumentComposer not found in document creation"
fi

# Check if useProposedBlocksCount is imported in dashboard
BLOCKS_COUNT_IMPORT=$(grep -n "useProposedBlocksCount" web/components/dashboard/ConsciousnessDashboard.tsx 2>/dev/null)
if [[ -n "$BLOCKS_COUNT_IMPORT" ]]; then
    echo "✅ Proposed blocks count integrated in dashboard"
else
    echo "❌ Proposed blocks count not found in dashboard"
fi

# Test 7: Environment Configuration Check
echo ""
echo "7️⃣ Checking Environment Configuration..."
if [[ -f "web/.env.local" ]]; then
    API_URL_CONFIG=$(grep "NEXT_PUBLIC_API_BASE_URL" web/.env.local 2>/dev/null)
    if [[ "$API_URL_CONFIG" == *"api.yarnnn.com"* ]]; then
        echo "✅ Environment configured for production backend"
        echo "   Config: $API_URL_CONFIG"
    else
        echo "⚠️  Environment configuration:"
        echo "   $API_URL_CONFIG"
    fi
else
    echo "❌ web/.env.local not found"
fi

# Test Summary
echo ""
echo "📋 CONTEXT OS INTEGRATION SUMMARY:"
echo "=================================="
echo ""

# Check TypeScript build
echo "8️⃣ TypeScript Build Check..."
cd web
BUILD_CHECK=$(npm run build --silent 2>&1 | tail -10)
if [[ "$BUILD_CHECK" == *"error"* ]]; then
    echo "❌ TypeScript build has errors:"
    echo "$BUILD_CHECK"
else
    echo "✅ TypeScript build successful"
fi
cd ..

echo ""
echo "🎯 MANUAL TEST CHECKLIST:"
echo "========================"
echo ""
echo "Visit $FRONTEND_URL/baskets/[any-basket-id]/work and verify:"
echo ""
echo "□ BlockReview component visible (may be empty)"
echo "□ Dashboard shows 'X blocks awaiting review' when blocks exist"
echo "□ Thinking Partner shows processing steps during requests"
echo "□ Agent attribution appears on AI responses"
echo "□ Document creation shows ACCEPTED blocks for selection"
echo "□ No 'using mock' messages in browser console"
echo "□ Network tab shows calls to api.yarnnn.com (not localhost)"
echo ""

echo "🎉 Context OS Integration Test Complete!"
echo ""
echo "If all checks pass, the Context OS is now fully visible to users!"
echo "Users can see proposed blocks, accept them, and compose documents."
echo ""
echo "🚀 THE SLEEPING CONTEXT OS HAS AWAKENED! 🚀"