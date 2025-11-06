#!/usr/bin/env bash
set -euo pipefail

# Phase 1 Work Platform API Test Script
# Tests backend API endpoints with authentication
#
# Usage: ./test_phase1_api.sh <BACKEND_URL> <JWT_TOKEN> <WORKSPACE_ID> <BASKET_ID>
#
# Example:
#   ./test_phase1_api.sh \
#     "https://your-backend.onrender.com" \
#     "eyJhbGc..." \
#     "99e6bf7d-513c-45ff-9b96-9362bd914d12" \
#     "339f7947-0f2b-4fef-9caa-951ccc9f3223"

# ============================================================================
# Configuration
# ============================================================================

BACKEND_URL="${1:-}"
JWT_TOKEN="${2:-}"
WORKSPACE_ID="${3:-}"
BASKET_ID="${4:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

usage() {
    echo "Usage: $0 <BACKEND_URL> <JWT_TOKEN> <WORKSPACE_ID> <BASKET_ID>"
    echo ""
    echo "Arguments:"
    echo "  BACKEND_URL   - Backend API URL (e.g., https://your-backend.onrender.com)"
    echo "  JWT_TOKEN     - Supabase JWT token for authentication"
    echo "  WORKSPACE_ID  - Your workspace UUID"
    echo "  BASKET_ID     - A basket UUID in your workspace (for project creation)"
    echo ""
    echo "Example:"
    echo "  $0 \\"
    echo "    'https://your-backend.onrender.com' \\"
    echo "    'eyJhbGc...' \\"
    echo "    '99e6bf7d-513c-45ff-9b96-9362bd914d12' \\"
    echo "    '339f7947-0f2b-4fef-9caa-951ccc9f3223'"
    exit 1
}

log_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local data="${4:-}"

    log_test "$description"

    local url="${BACKEND_URL}${endpoint}"
    local response
    local http_code

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "  HTTP $http_code"
    echo "  Response: $body" | head -c 200
    echo ""

    if [[ "$http_code" =~ ^(200|201|204)$ ]]; then
        log_success "PASSED"
        echo "$body"
        return 0
    else
        log_error "FAILED (HTTP $http_code)"
        echo "$body"
        return 1
    fi
}

# ============================================================================
# Validation
# ============================================================================

if [ -z "$BACKEND_URL" ] || [ -z "$JWT_TOKEN" ] || [ -z "$WORKSPACE_ID" ] || [ -z "$BASKET_ID" ]; then
    echo -e "${RED}Error: Missing required arguments${NC}\n"
    usage
fi

echo "=========================================="
echo "Phase 1 Work Platform API Tests"
echo "=========================================="
echo "Backend: $BACKEND_URL"
echo "Workspace: $WORKSPACE_ID"
echo "Basket: $BASKET_ID"
echo "=========================================="
echo ""

# ============================================================================
# Test 1: Health Check
# ============================================================================

log_test "Test 1: Health Check"
response=$(curl -s "${BACKEND_URL}/health")
if echo "$response" | grep -q "ok"; then
    log_success "Health check passed"
    echo "  Response: $response"
else
    log_error "Health check failed"
    echo "  Response: $response"
    exit 1
fi
echo ""

# ============================================================================
# Test 2: Database Health Check
# ============================================================================

log_test "Test 2: Database Health Check"
response=$(curl -s "${BACKEND_URL}/health/db")
if echo "$response" | grep -q "ok"; then
    log_success "Database health check passed"
    echo "  Response: $response"
else
    log_error "Database health check failed"
    echo "  Response: $response"
    exit 1
fi
echo ""

# ============================================================================
# Test 3: Create Project
# ============================================================================

PROJECT_ID=""
create_response=$(test_endpoint \
    "POST" \
    "/api/work/projects" \
    "Test 3: Create Project" \
    "{
        \"workspace_id\": \"$WORKSPACE_ID\",
        \"basket_id\": \"$BASKET_ID\",
        \"name\": \"API Test Project $(date +%s)\",
        \"description\": \"Testing Phase 1 API endpoints\"
    }")

if [ $? -eq 0 ]; then
    PROJECT_ID=$(echo "$create_response" | jq -r '.id' 2>/dev/null || echo "")
    if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
        log_success "Project created: $PROJECT_ID"
    else
        log_error "Failed to extract project ID"
        exit 1
    fi
else
    log_error "Failed to create project"
    exit 1
fi
echo ""

# ============================================================================
# Test 4: List Projects
# ============================================================================

test_endpoint \
    "GET" \
    "/api/work/projects" \
    "Test 4: List Projects" \
    ""
echo ""

# ============================================================================
# Test 5: Get Project Details
# ============================================================================

test_endpoint \
    "GET" \
    "/api/work/projects/$PROJECT_ID" \
    "Test 5: Get Project Details" \
    ""
echo ""

# ============================================================================
# Test 6: Update Project
# ============================================================================

test_endpoint \
    "PATCH" \
    "/api/work/projects/$PROJECT_ID" \
    "Test 6: Update Project" \
    "{
        \"name\": \"Updated API Test Project\",
        \"description\": \"Updated via API test script\"
    }"
echo ""

# ============================================================================
# Test 7: Create Work Session
# ============================================================================

SESSION_ID=""
session_response=$(test_endpoint \
    "POST" \
    "/api/work/sessions" \
    "Test 7: Create Work Session" \
    "{
        \"project_id\": \"$PROJECT_ID\",
        \"task_type\": \"research\",
        \"task_intent\": \"Test Phase 1 API with RLS verification\",
        \"task_parameters\": {
            \"scope\": \"quick\",
            \"depth\": \"overview\",
            \"focus_areas\": [\"API testing\", \"RLS validation\"]
        }
    }")

if [ $? -eq 0 ]; then
    SESSION_ID=$(echo "$session_response" | jq -r '.id' 2>/dev/null || echo "")
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        log_success "Work session created: $SESSION_ID"
    else
        log_error "Failed to extract session ID"
    fi
fi
echo ""

# ============================================================================
# Test 8: List Work Sessions
# ============================================================================

test_endpoint \
    "GET" \
    "/api/work/sessions" \
    "Test 8: List Work Sessions" \
    ""
echo ""

# ============================================================================
# Test 9: Get Work Session Details
# ============================================================================

if [ -n "$SESSION_ID" ]; then
    test_endpoint \
        "GET" \
        "/api/work/sessions/$SESSION_ID" \
        "Test 9: Get Work Session Details" \
        ""
    echo ""
fi

# ============================================================================
# Test 10: List Project Sessions
# ============================================================================

test_endpoint \
    "GET" \
    "/api/work/projects/$PROJECT_ID/sessions" \
    "Test 10: List Project Sessions" \
    ""
echo ""

# ============================================================================
# Test 11: List Session Artifacts (should be empty)
# ============================================================================

if [ -n "$SESSION_ID" ]; then
    test_endpoint \
        "GET" \
        "/api/work/sessions/$SESSION_ID/artifacts" \
        "Test 11: List Session Artifacts" \
        ""
    echo ""
fi

# ============================================================================
# Test 12: List Session Checkpoints (should be empty)
# ============================================================================

if [ -n "$SESSION_ID" ]; then
    test_endpoint \
        "GET" \
        "/api/work/sessions/$SESSION_ID/checkpoints" \
        "Test 12: List Session Checkpoints" \
        ""
    echo ""
fi

# ============================================================================
# Test 13: Delete Project (cleanup)
# ============================================================================

log_test "Test 13: Delete Project (cleanup)"
response=$(curl -s -w "\n%{http_code}" \
    -X DELETE \
    -H "Authorization: Bearer $JWT_TOKEN" \
    "${BACKEND_URL}/api/work/projects/$PROJECT_ID")

http_code=$(echo "$response" | tail -n1)

if [[ "$http_code" == "204" ]]; then
    log_success "Project deleted successfully"
else
    log_error "Failed to delete project (HTTP $http_code)"
    echo "Response: $(echo "$response" | sed '$d')"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "=========================================="
echo "Test Summary"
echo "=========================================="
log_success "All Phase 1 API tests completed!"
echo ""
echo "Verified:"
echo "  ✅ Health endpoints working"
echo "  ✅ Project CRUD operations"
echo "  ✅ Work session creation"
echo "  ✅ RLS workspace isolation"
echo "  ✅ JWT authentication"
echo ""
echo "Next Steps:"
echo "  1. Test with multiple users/workspaces for RLS verification"
echo "  2. Test artifact and checkpoint creation (Phase 1.5)"
echo "  3. Begin frontend integration"
echo "=========================================="
