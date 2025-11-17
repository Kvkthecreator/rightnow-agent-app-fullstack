# Work Output Lifecycle Implementation

**Status**: Implemented (Phase 1)
**Date**: 2025-11-17
**Commits**: 148144d7, 028d6143, d7cb97cb

## Executive Summary

Complete implementation of Work Output Lifecycle Management following the BFF (Backend-for-Frontend) pattern:
- Agents produce structured outputs via tool-use pattern
- Outputs are written to substrate-API for user supervision
- Clean separation between work-platform orchestration and substrate-api data ownership

## Architecture Overview

```
User Request
    ↓
work-platform (orchestrator)
    ├── Create work_session
    ├── Execute agent.deep_dive()
    │     ↓
    │   Claude API + emit_work_output tool
    │     ↓
    │   Parse structured outputs
    ├── Write outputs via BFF
    │     ↓
    │   substrate-API (data owner)
    │     ↓
    │   work_outputs table
    └── Update session status
    ↓
User Reviews Outputs
```

## Key Components

### 1. Database Schema (Supabase)

**work_outputs table** - Complete schema with:
- `basket_id`: Basket-scoped access (FK to baskets)
- `work_session_id`: Cross-DB reference (same Supabase, different domain)
- `output_type`: finding, recommendation, insight, draft_content, etc.
- `agent_type`: research, content, reporting
- `supervision_status`: pending_review → approved/rejected/revision_requested
- `confidence`: 0-1 confidence score
- `source_context_ids`: Provenance tracking (which blocks were used)
- `tool_call_id`: Claude's tool_use id for traceability

**Migrations Applied**:
- `20251117_work_outputs_recreate.sql` - Clean schema with RLS + GRANTS
- `20251117_work_outputs_functions.sql` - Helper functions (get_supervision_stats)

### 2. Tool-Use Pattern (work-platform/yarnnn_agents)

**Location**: `work-platform/api/src/yarnnn_agents/tools/`

```python
EMIT_WORK_OUTPUT_TOOL = {
    "name": "emit_work_output",
    "input_schema": {
        "properties": {
            "output_type": {"enum": ["finding", "recommendation", "insight", ...]},
            "title": {"type": "string", "maxLength": 200},
            "body": {
                "properties": {
                    "summary": {"type": "string"},
                    "details": {"type": "string"},
                    "evidence": {"type": "array"},
                    "recommendations": {"type": "array"},
                    "confidence_factors": {"type": "object"}
                },
                "required": ["summary"]
            },
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "source_block_ids": {"type": "array"}
        },
        "required": ["output_type", "title", "body", "confidence"]
    }
}
```

**Key Insight**: Forces Claude to emit structured outputs via `tool_choice`, ensuring machine-parseable deliverables with provenance tracking.

### 3. Agent Execution Flow (work-platform)

**Location**: `work-platform/api/src/app/routes/agent_orchestration.py`

```python
@router.post("/run")
async def run_agent_task(request, user):
    # 1. Check permissions (Phase 5 trial/subscription)
    # 2. Record work request
    # 3. Create work_session (NEW)
    work_session_id = await _create_work_session(...)

    # 4. Execute agent (returns work_outputs list)
    result = await _run_research_agent(request, user_id, work_session_id)

    # 5. Write outputs to substrate-API via BFF (NEW)
    work_outputs = result.get("work_outputs", [])
    output_write_result = write_agent_outputs(
        basket_id=request.basket_id,
        work_session_id=work_session_id,
        agent_type=request.agent_type,
        outputs=work_outputs,
    )

    # 6. Update session status
    await _update_work_session_status(work_session_id, "completed", output_count)
```

### 4. BFF Client (work-platform)

**Location**: `work-platform/api/src/clients/substrate_client.py`

Methods added:
- `create_work_output()` - Write single output
- `list_work_outputs()` - Query with filters
- `get_work_output()` - Get specific output
- `update_work_output_status()` - Approve/reject/revision
- `get_supervision_stats()` - Dashboard aggregation

**Auth Pattern**: Service-to-service via Bearer token + X-Service-Name header.

### 5. Substrate-API Routes

**Location**: `substrate-api/api/src/app/work_outputs/routes.py`

Endpoints (all under `/api/baskets/{basket_id}/work-outputs`):
- `POST /` - Create work output
- `GET /` - List with filters (supervision_status, agent_type, etc.)
- `GET /stats` - Supervision statistics
- `GET /{output_id}` - Get specific output
- `PATCH /{output_id}` - Update supervision status
- `DELETE /{output_id}` - Delete output

**Auth**: Supports both user JWT and service-to-service auth via `verify_user_or_service`.

### 6. Work-Platform Supervision Proxy

**Location**: `work-platform/api/src/app/routes/work_supervision.py`

**REWRITTEN** to use BFF pattern instead of direct DB access:
```python
@router.get("/baskets/{basket_id}/outputs")
async def list_outputs(basket_id, auth_info):
    client = get_substrate_client()
    return client.list_work_outputs(basket_id=basket_id, ...)

@router.post("/baskets/{basket_id}/outputs/{output_id}/approve")
async def approve_output(basket_id, output_id, request, auth_info):
    client = get_substrate_client()
    client.update_work_output_status(
        basket_id=basket_id,
        output_id=output_id,
        supervision_status="approved",
        reviewer_id=auth_info.get("user_id"),
    )
```

## Security Model

### RLS Policies (work_outputs table)

```sql
-- Users can view/create/update/delete outputs in their workspace baskets
USING (
    basket_id IN (
        SELECT b.id FROM baskets b
        JOIN workspace_memberships wm ON wm.workspace_id = b.workspace_id
        WHERE wm.user_id = auth.uid()
    )
)

-- Service role has full access
USING (auth.jwt()->>'role' = 'service_role')
```

### Service-to-Service Auth

**substrate-api/api/src/app/utils/service_auth.py**:
```python
def verify_user_or_service(request):
    # Check service auth first (ServiceToServiceAuthMiddleware)
    if hasattr(request.state, "service_name"):
        return {"service_name": ..., "is_service": True}

    # Then user JWT (AuthMiddleware)
    if hasattr(request.state, "user_id"):
        return {"user_id": ..., "is_service": False}

    raise HTTPException(401, "Authentication required")
```

## Data Flow Example

1. **User initiates research task**:
   ```json
   POST /agents/run
   {
     "agent_type": "research",
     "task_type": "deep_dive",
     "basket_id": "uuid",
     "parameters": {"topic": "competitor analysis"}
   }
   ```

2. **Agent executes** (uses emit_work_output tool):
   ```json
   {
     "output_type": "finding",
     "title": "Market Position Analysis",
     "body": {
       "summary": "Competitor X dominates 45% market share",
       "evidence": ["Source 1", "Source 2"],
       "recommendations": ["Focus on differentiation"]
     },
     "confidence": 0.85,
     "source_block_ids": ["block-uuid-1", "block-uuid-2"]
   }
   ```

3. **Outputs written to work_outputs** (via BFF):
   - supervision_status = "pending_review"
   - tool_call_id = Claude's tool_use id
   - source_context_ids = provenance tracking

4. **User reviews in supervision UI**:
   ```json
   POST /supervision/baskets/{basket_id}/outputs/{id}/approve
   {
     "notes": "Good analysis, incorporating into strategy"
   }
   ```

## Testing

### Local Testing

Use `test_research_agent.py` for local Claude API testing:
```bash
cd work-platform/api
python3 test_research_agent.py
```

### Integration Testing

After deployment:
1. Create basket/workspace
2. POST to `/agents/run` with research task
3. Check work_outputs table for pending_review entries
4. Verify outputs have proper structure and provenance

## Outstanding Items

1. **Deploy substrate-API to Render** - New routes need to be live
2. **Test tool-use with real Claude API** - Verify emit_work_output tool works
3. **Frontend supervision UI** - Build review interface
4. **Monitoring** - Add metrics for output approval rates, confidence calibration

## Files Modified

### New Files
- `supabase/migrations/20251117_work_outputs_recreate.sql`
- `supabase/migrations/20251117_work_outputs_functions.sql`
- `work-platform/api/src/yarnnn_agents/tools/__init__.py`
- `work-platform/api/src/yarnnn_agents/tools/work_output_tools.py`
- `work-platform/api/src/services/work_output_service.py`
- `substrate-api/api/src/app/work_outputs/__init__.py`
- `substrate-api/api/src/app/work_outputs/routes.py`
- `substrate-api/api/src/app/utils/service_auth.py`

### Modified Files
- `work-platform/api/src/yarnnn_agents/archetypes/research_agent.py` - Tool-use pattern
- `work-platform/api/src/yarnnn_agents/__init__.py` - Export tools
- `work-platform/api/src/clients/substrate_client.py` - BFF methods
- `work-platform/api/src/app/routes/agent_orchestration.py` - Session lifecycle + output writing
- `work-platform/api/src/app/routes/work_supervision.py` - **COMPLETE REWRITE** to BFF proxy
- `substrate-api/api/src/app/agent_server.py` - Router registration

## Key Design Decisions

1. **Tool-use pattern** - Forces structured outputs, enables provenance tracking
2. **BFF pattern** - work-platform orchestrates, substrate-api owns data
3. **Basket-scoped access** - RLS at basket level, not workspace level
4. **Cross-DB references** - work_session_id not FK-enforced (same DB, different domain)
5. **Dual auth support** - Both user JWT and service auth for flexibility
6. **Independent lifecycles** - Work supervision separate from substrate governance
