# Work-Platform Engine Documentation Index

## Overview

Complete technical documentation of the work-platform engine architecture, which bridges the Claude Agent SDK with a substrate-based backend.

**Status**: Complete and Mission-Ready
**Date**: 2025-11-15
**Thoroughness**: Comprehensive (all layers, patterns, flows, wiring documented)

---

## Documentation Files

### 1. [COMPREHENSIVE_ENGINE_SUMMARY.txt](./COMPREHENSIVE_ENGINE_SUMMARY.txt)
**Best for**: Executive overview and comprehensive reference

**Contains**:
- Executive summary of the 6-layer system
- Complete file map with absolute paths
- Critical execution paths (research agent flow)
- Context passing mechanisms (3 types)
- Design patterns (6 patterns implemented)
- Key insights and critical details
- Missing/TODO items
- Testing & deployment instructions
- Files analyzed list

**Length**: ~800 lines of detailed technical summary

---

### 2. [ENGINE_ARCHITECTURE_MAP.md](./ENGINE_ARCHITECTURE_MAP.md)
**Best for**: Deep technical understanding and detailed reference

**Contains**:
- 16 comprehensive sections covering:
  1. Executive summary
  2. Entry points (routes/triggers)
  3. App initialization & server setup
  4. Orchestration layer (factory & wiring)
  5. Adapter layer (SDK ↔ Substrate bridge)
  6. HTTP client layer (substrate communication)
  7. Authorization & permission layer (Phase 5)
  8. Data flow diagrams
  9. Domain services hierarchy
  10. Session lifecycle management
  11. Work request tracking
  12. Context passing mechanisms
  13. Execution flow example (research agent)
  14. Key design patterns
  15. Deployment entry point
  16. Summary

**Length**: ~1,110 lines of detailed architecture documentation

---

### 3. [ENGINE_QUICK_REFERENCE.md](./ENGINE_QUICK_REFERENCE.md)
**Best for**: Quick lookup and implementation reference

**Contains**:
- 7-layer pipeline diagram
- File locations (absolute paths)
- Primary entry point (`POST /api/agents/run`)
- Request flow (step-by-step)
- Key design patterns (6 patterns with descriptions)
- Context passing mechanisms (3 types)
- Phase 5 trial/subscription logic
- Substrate Client API (key methods)
- Agent types & tasks
- Environment variables
- Common issues & solutions
- Testing instructions
- Related documentation

**Length**: ~380 lines of practical reference

---

## Quick Navigation

### Finding Specific Information

**I need to understand...**

| If you want to know about... | Read this first | Then read |
|-----|-----|-----|
| Overall system architecture | COMPREHENSIVE_ENGINE_SUMMARY.txt | ENGINE_ARCHITECTURE_MAP.md §1 |
| How to make an agent request | ENGINE_QUICK_REFERENCE.md | ENGINE_ARCHITECTURE_MAP.md §13 |
| The factory pattern | ENGINE_QUICK_REFERENCE.md (Design Patterns) | ENGINE_ARCHITECTURE_MAP.md §3.1 |
| Context injection | ENGINE_QUICK_REFERENCE.md (Context Passing) | ENGINE_ARCHITECTURE_MAP.md §11 |
| Request authorization | COMPREHENSIVE_ENGINE_SUMMARY.txt (KEY INSIGHTS #5) | ENGINE_ARCHITECTURE_MAP.md §6 |
| Fault tolerance | ENGINE_QUICK_REFERENCE.md (Key Design Patterns) | COMPREHENSIVE_ENGINE_SUMMARY.txt (DESIGN PATTERNS) |
| Adapter pattern | ENGINE_ARCHITECTURE_MAP.md §4 | COMPREHENSIVE_ENGINE_SUMMARY.txt (DESIGN PATTERNS #2) |
| Trial/Subscription system | ENGINE_QUICK_REFERENCE.md (Phase 5) | ENGINE_ARCHITECTURE_MAP.md §10 |
| HTTP client details | COMPREHENSIVE_ENGINE_SUMMARY.txt (HTTP CLIENT LAYER) | ENGINE_ARCHITECTURE_MAP.md §5 |
| Critical files | COMPREHENSIVE_ENGINE_SUMMARY.txt (FILE MAP) | ENGINE_QUICK_REFERENCE.md (File Locations) |

---

## The 6-Layer Pipeline (Quick Summary)

```
[1] HTTP Request → /api/agents/run
       ↓
[2] FastAPI Middleware → JWT verification, correlation ID
       ↓
[3] Orchestration Route → run_agent_task()
       ↓ (Authorization, work request recording)
       ↓
[4] Factory → create_research_agent()
       ↓
[5] Adapters → SubstrateMemoryAdapter
       ↓ (Query basket blocks, inject assets/config)
       ↓
[6] HTTP Client → substrate_client (circuit breaker, retries)
       ↓
[7] Substrate API → Process request
       ↓ Response flows back through stack
       ↓
[6] Agent executes with enriched context
       ↓
[3] Status update, response to user
```

---

## Key Files (Absolute Paths)

| Component | File | Purpose |
|-----------|------|---------|
| Server | `/src/app/agent_server.py` | FastAPI app initialization |
| **PRIMARY ENTRY** | `/src/app/routes/agent_orchestration.py` | `POST /api/agents/run` |
| Factory | `/src/agents/factory.py` | Agent creation |
| Memory Adapter | `/src/adapters/memory_adapter.py` | Context provisioning |
| Governance Adapter | `/src/adapters/governance_adapter.py` | Change proposals |
| HTTP Client | `/src/clients/substrate_client.py` | Substrate communication |
| Permissions | `/src/utils/permissions.py` | Trial/subscription enforcement |
| Models | `/src/app/work/models/work_session.py` | Work session schema |
| Config | `/src/agents/config/research.yaml` | Agent YAML config |

---

## Primary Entry Point

### Route
```
POST /api/agents/run
```

### Request Body
```json
{
  "agent_type": "research",
  "task_type": "monitor",
  "basket_id": "550e8400-e29b-41d4-a716-446655440000",
  "parameters": {}
}
```

### Response
```json
{
  "status": "completed",
  "agent_type": "research",
  "task_type": "monitor",
  "result": { ... },
  "work_request_id": "abc123",
  "is_trial_request": true,
  "remaining_trials": 6
}
```

---

## Key Concepts

### Factory Pattern
- Centralizes agent creation (`create_research_agent()`, etc.)
- Loads YAML config
- Injects adapters for SDK compatibility
- See: `/src/agents/factory.py`

### Adapter Pattern
- Bridges SDK interfaces to substrate_client
- Memory adapter: `SubstrateMemoryAdapter(MemoryProvider)`
- Governance adapter: `SubstrateGovernanceAdapter(GovernanceProvider)`
- See: `/src/adapters/`

### Circuit Breaker
- Prevents cascading failures to substrate-api
- States: CLOSED → OPEN (cooldown) → HALF_OPEN → CLOSED
- Opens after 5 failures, 60s cooldown
- See: `/src/clients/substrate_client.py`

### Context Injection
- Blocks: From substrate-api (`/baskets/{basket_id}/blocks`)
- Assets: From substrate-api (`/api/substrate/baskets/{basket_id}/assets`)
- Config: From work-platform DB (`project_agents` table)
- Injected by: `SubstrateMemoryAdapter.query()`

### Phase 5 Trials
- 10 FREE requests total (across ALL agents)
- After exhausted → must subscribe
- Enforced in: `check_agent_work_request_allowed()`
- See: `/src/utils/permissions.py`

---

## Design Patterns Implemented

1. **Factory Pattern** - Agent creation with config injection
2. **Adapter Pattern** - SDK ↔ Substrate bridge
3. **Singleton Pattern** - Shared HTTP client instance
4. **Circuit Breaker Pattern** - Fault tolerance
5. **Retry Pattern** - Resilience with exponential backoff
6. **Dependency Injection** - FastAPI dependencies

---

## Critical Details

### NO Direct Database Access
- All substrate access is HTTP via `substrate_client`
- Preserves BFF architecture
- Work-platform DB used ONLY for: auth, config, trial tracking

### Governance is Separated
- Governance adapter created but set to None during execution
- Changes proposed AFTER execution
- Prevents blocking agent on approvals

### Context Injection at Memory Layer
- Not by SDK itself
- Happens transparently during `agent.query()`
- Injected as first Context in metadata

### Fault Tolerance
- Circuit breaker prevents cascading failures
- Exponential backoff handles rate limiting
- If substrate unavailable: agent continues with empty context

### Trial Enforcement
- Happens BEFORE factory (pre-flight check)
- Work request recorded BEFORE execution (accurate counting)
- Status updated AFTER execution (for analytics)

---

## Testing

### Local Setup
```bash
cd /Users/macbook/yarnnn-app-fullstack/work-platform/api
pip install -r requirements.txt
make run  # Server on :8000
```

### Test Request
```bash
curl -X POST http://localhost:8000/api/agents/run \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "research",
    "task_type": "monitor",
    "basket_id": "YOUR_BASKET_ID",
    "parameters": {}
  }'
```

### Required Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_JWT_SECRET`: JWT signing key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `ANTHROPIC_API_KEY`: Claude API key
- `SUBSTRATE_API_URL`: Substrate API base (default: http://localhost:10000)
- `SUBSTRATE_SERVICE_SECRET`: Service token

---

## Related Documentation

- **Phase 1 Deployment**: `PHASE1_DEPLOYMENT_SUMMARY.md`
- **Backend Hardening**: `BACKEND_HARDENING_REPORT.md`
- **API Delegation**: `API_DELEGATION_PATTERNS.md`

---

## Missing/TODO Items

1. **Semantic Search** - Falls back to `get_basket_blocks()`
2. **Checkpoint Resumption** - Not yet implemented
3. **Workspace Auto-creation** - Assumes workspace exists
4. **Stripe Integration** - Accepts IDs but doesn't validate
5. **work_session_id Scoping** - Passed as None currently

---

## Summary

The work-platform engine is a **well-architected, production-ready system** that successfully bridges the Claude Agent SDK with a substrate-based backend. It demonstrates:

✓ Clean separation of concerns (6+ layers)
✓ Robust fault tolerance (circuit breaker, retries, graceful degradation)
✓ Secure authorization (JWT, workspace isolation, trial enforcement)
✓ Flexible context injection (blocks, assets, config)
✓ Scalable agent factory (supports multiple agent types)
✓ HTTP-only backend communication (BFF pattern)
✓ Comprehensive trial/subscription system (Phase 5)

**Key Insight**: The system is a **6-layer pipeline** where everything flows from user request through factory → adapters → HTTP client → substrate API, with comprehensive trial enforcement and graceful degradation at every layer.

---

## Document Statistics

| Document | Lines | Focus | Best for |
|----------|-------|-------|----------|
| COMPREHENSIVE_ENGINE_SUMMARY.txt | ~800 | Comprehensive overview | Executive reference |
| ENGINE_ARCHITECTURE_MAP.md | ~1,110 | Detailed architecture | Deep understanding |
| ENGINE_QUICK_REFERENCE.md | ~380 | Quick lookup | Implementation |
| **Total** | **~2,290** | **Complete coverage** | **Mission critical** |

---

**Last Updated**: 2025-11-15
**Status**: Complete and verified against codebase
