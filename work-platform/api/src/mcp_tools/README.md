## MCP Tools for Claude Agent SDK Integration - Phase 1

**Status:** Implemented
**Date:** 2025-11-18
**Phase:** Phase 1 of 6

### Overview

This module provides the bridge layer between Claude Agent SDK and YARNNN substrate-API. It exposes substrate capabilities (semantic search, work outputs, reference assets) as MCP (Model Context Protocol) tools that Claude agents can invoke.

### Architecture

```
Claude Agent (work-platform)
    ↓ MCP tool invocation
work-platform/mcp_tools (THIS MODULE)
    ↓ HTTP requests with service auth
substrate-API (data owner)
    ↓ Database operations
Supabase (blocks, work_outputs, reference_assets)
```

**Pattern:** BFF (Backend for Frontend)
- work-platform orchestrates agent execution
- substrate-API owns data and access control
- MCP tools translate between agent SDK and HTTP API

### MCP Tools

#### 1. query_substrate

**Purpose:** Semantic search across knowledge substrate

**Use Case:** Agent needs to understand existing project context before creating outputs

**Example:**
```python
result = await query_substrate(
    basket_id="ani-project-basket-id",
    query_text="What are the key technical constraints?",
    semantic_types=["constraint", "fact"],
    min_similarity=0.70,
    limit=20
)
```

**Returns:** List of blocks with similarity scores

#### 2. emit_work_output

**Purpose:** Create work output deliverables for user supervision

**Use Case:** Agent emits findings, recommendations, or insights that need user approval

**Example:**
```python
result = await emit_work_output(
    basket_id="ani-project-basket-id",
    work_session_id="ws_123",
    output_type="finding",
    agent_type="research",
    title="API Rate Limiting Analysis",
    body={
        "summary": "Critical rate limit constraint identified",
        "details": "...",
        "evidence": [...],
        "recommendations": [...]
    },
    confidence=0.85,
    source_context_ids=["block-1", "block-2"]
)
```

**Returns:** Created work output record (supervision_status='pending_review')

#### 3. get_reference_assets

**Purpose:** List reference assets (files) for a basket

**Use Case:** Agent needs to access brand guidelines, research reports, product specs before creating outputs

**Example:**
```python
result = await get_reference_assets(
    basket_id="ani-project-basket-id",
    asset_type="brand_guideline",
    agent_scope="research"
)
```

**Returns:** List of reference asset metadata with storage URLs

### Authentication

Supports two auth patterns:

1. **Service-to-Service Auth** (primary):
   - Headers: `X-Service-Name: platform-api`, `X-Service-Secret: <secret>`
   - Used when work-platform calls substrate-API
   - Bypasses workspace membership checks (service is trusted)

2. **User JWT Forwarding** (optional):
   - Header: `Authorization: Bearer <user_jwt>`
   - Used when agent needs user-specific permissions
   - Validates workspace membership

**Configuration:**
```bash
export SUBSTRATE_API_URL=https://yarnnn-substrate-api.onrender.com
export SUBSTRATE_SERVICE_SECRET=your_service_secret
```

### Testing

Phase 1 provides independent tool tests (NO agent integration yet):

```bash
# Test individual tools
python test_mcp_query_substrate.py
python test_mcp_emit_work_output.py
python test_mcp_get_reference_assets.py

# Run all tests
python test_mcp_all_tools.py
```

**Required Environment Variables:**
```bash
export SUBSTRATE_API_URL=https://yarnnn-substrate-api.onrender.com
export SUBSTRATE_SERVICE_SECRET=your_service_secret
export TEST_BASKET_ID=your_test_basket_id

# Optional
export TEST_USER_JWT=your_user_jwt_token
```

### Phase 1 Success Criteria

- ✅ MCP server starts without errors
- ✅ `query_substrate` returns blocks from substrate-API
- ✅ `emit_work_output` creates work_outputs rows
- ✅ `get_reference_assets` fetches files from Supabase Storage
- ✅ Auth works (service token + user JWT)
- ✅ Can call tools from test script (not agent yet)

### Next Steps (Phase 2)

After Phase 1 is deployed and verified:

1. Create Base Skills (`.claude/skills/`)
   - `yarnnn-research-methodology`
   - `yarnnn-quality-standards`
   - `yarnnn-substrate-patterns`

2. Test Skills load correctly in agent context

3. Proceed to Phase 3: Simple Research Agent (end-to-end integration)

### Files

**Core Implementation:**
- `mcp_tools/__init__.py` - Module exports
- `mcp_tools/server.py` - MCP server with three tools + SubstrateClient

**Substrate-API Extensions:**
- `substrate-api/src/app/routes/substrate_search.py` - Semantic search endpoint
- `substrate-api/src/app/work_outputs/routes.py` - Work output CRUD (already existed)
- `substrate-api/src/app/reference_assets/routes.py` - Reference asset CRUD (already existed)

**Tests:**
- `test_mcp_query_substrate.py` - Test semantic search tool
- `test_mcp_emit_work_output.py` - Test work output creation tool
- `test_mcp_get_reference_assets.py` - Test reference asset retrieval tool
- `test_mcp_all_tools.py` - Comprehensive test runner

### References

- [Claude Agent SDK Implementation Plan](../../../docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md)
- [Work Output Lifecycle Implementation](../../../docs/canon/WORK_OUTPUT_LIFECYCLE_IMPLEMENTATION.md)
- [Agent Substrate Architecture](../../../docs/canon/AGENT_SUBSTRATE_ARCHITECTURE.md)
