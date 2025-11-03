# Next Phase: Integrate Claude Agent Framework into Work Platform

## Executive Summary

This document provides complete context for integrating the [yarnnn-claude-agents](https://github.com/Kvkthecreator/yarnnn-claude-agents) framework into work-platform as the true agentic orchestration layer.

---

## What's Been Completed (Phases 1-3.2)

### ✅ Phase 1: Import Fixes
- Work Platform no longer depends on `/shared` directory
- All imports use local copies: `app.utils.*`, `services.*`, `app.models.*`

### ✅ Phase 2: Architecture Refactor
**Directory Renames**:
- `enterprise/` → `substrate-api/` (P0-P4 agent pipeline + memory domain)
- `platform/` → `work-platform/` (consumer-facing app layer)
- `shared/` → `infra/` (infrastructure utilities only)

**Domain Separation Achieved**:
- **Substrate API** = P0-P4 agent pipeline + memory/context domain
- **Work Platform** = Consumer/work-facing application (to be rebuilt)
- **Infrastructure** = Pure utilities (auth, DB clients, shared types)

### ✅ Phase 3.1: BFF Foundation
**Created HTTP Infrastructure**:
- `work-platform/api/src/clients/substrate_client.py` (400+ lines)
  - Service token authentication
  - Circuit breaker pattern (CLOSED → OPEN → HALF_OPEN)
  - Automatic retries with exponential backoff
  - Connection pooling via httpx
  - Methods: `health_check()`, `get_basket_blocks()`, `initiate_work()`, `compose_document()`, etc.

- `substrate-api/api/src/middleware/service_to_service_auth.py`
  - Service-to-service authentication middleware
  - Rate limiting per service (1000 req/min default)
  - Feature flag: `ENABLE_SERVICE_AUTH` (default: false)

**Environment Configuration** (render.yaml):
```yaml
# Work Platform API
SUBSTRATE_API_URL=https://yarnnn-substrate-api.onrender.com
SUBSTRATE_SERVICE_SECRET=<shared-secret>

# Substrate API
ENABLE_SERVICE_AUTH=false  # Optional
SUBSTRATE_SERVICE_SECRET=<shared-secret>
ALLOWED_SERVICES=platform-api,chatgpt-app
```

### ✅ Phase 3.2: Domain Hardening
**Removed Duplicate Code** (17 files):
- Removed entire `work-platform/api/src/app/agents/pipeline/` (12 files)
  - P0-P4 agent code belongs in substrate-api only
- Removed substrate domain services from work-platform (5 files):
  - `embedding.py`, `llm.py`, `semantic_primitives.py`, `substrate_diff.py`, `substrate_ops.py`

**Result**: Clear domain boundaries, no duplicate code

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│  work-platform/api/                                     │
│  - Legacy routes (to be replaced)                       │
│  - substrate_client.py ✅ (HTTP client ready to use)    │
│  - Some direct substrate DB access (to be removed)      │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP (via substrate_client.py)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  substrate-api/api/                                     │
│  - P0-P4 Agent Pipeline (authoritative source)          │
│  - Memory blocks, documents, relationships, embeddings  │
│  - Universal work orchestration (Canon v2.1)            │
│  - Service auth middleware ✅                           │
└─────────────────────────────────────────────────────────┘
```

---

## The Problem: Work Platform Is Not Truly "Work Platform"

**Current State** (work-platform/api):
- Contains legacy routes with mixed concerns
- Some routes directly access substrate tables (11 remaining)
- No clear "work" or "project" abstraction
- Not agentic - just CRUD operations

**What It Should Be**:
- Agentic orchestration layer for "work" and "projects"
- Claude agent framework managing work sessions
- Memory provider calling substrate-api via HTTP
- Clean separation: work orchestration vs memory/context

---

## The Solution: Integrate yarnnn-claude-agents

### Repository to Integrate
**Source**: https://github.com/Kvkthecreator/yarnnn-claude-agents

**Key Components** (from that repo):
- Agent framework for orchestrating work
- Memory provider abstraction
- Project management concepts
- Work session handling

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  work-platform/api/ (NEW - Agentic Orchestration Layer)    │
│                                                             │
│  From yarnnn-claude-agents:                                 │
│  ├── agents/                                                │
│  │   ├── orchestrator.py    ← Work orchestration           │
│  │   ├── memory_provider.py ← Calls substrate_client ✅    │
│  │   └── ...                                                │
│  │                                                           │
│  ├── projects/               ← Project management           │
│  │   ├── models.py                                          │
│  │   └── routes.py                                          │
│  │                                                           │
│  ├── work/                   ← Work session orchestration   │
│  │   ├── sessions.py                                        │
│  │   └── routes.py                                          │
│  │                                                           │
│  └── clients/                                                │
│      └── substrate_client.py ✅ (already built!)            │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST
                 │ (substrate_client.py)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  substrate-api/api/ (P0-P4 + Memory Domain)                 │
│  - Receives HTTP requests from work-platform                │
│  - Returns memory/context data                              │
│  - Processes P0-P4 agent pipeline operations                │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Strategy

### Step 1: Wire Memory Provider to Substrate Client

**File to modify**: `memory_provider.py` (from yarnnn-claude-agents)

**Before** (direct DB access):
```python
# memory_provider.py
def get_context(basket_id):
    # Direct database access
    result = supabase.table("blocks").select("*").eq("basket_id", basket_id).execute()
    return result.data
```

**After** (HTTP via substrate_client):
```python
# memory_provider.py
from clients.substrate_client import get_substrate_client

def get_context(basket_id):
    # HTTP call to substrate-api
    client = get_substrate_client()
    blocks = client.get_basket_blocks(basket_id, states=["ACCEPTED", "LOCKED"])
    return blocks
```

### Step 2: Map Agent Operations to Substrate API Endpoints

**Agent Operation** → **Substrate API Endpoint** (via substrate_client.py)

| Agent Need | substrate_client Method | Substrate API Endpoint |
|------------|------------------------|------------------------|
| Get memory blocks | `get_basket_blocks(basket_id, states)` | `GET /baskets/{id}/blocks` |
| Get documents | N/A (need to add) | `GET /api/documents?basket_id=...` |
| Submit work | `initiate_work(basket_id, work_mode, payload)` | `POST /api/work/initiate` |
| Check work status | `get_work_status(work_id)` | `GET /api/work/{work_id}/status` |
| Compose document | `compose_document(basket_id, context_blocks)` | `POST /api/documents/compose-contextual` |
| Generate insight | `generate_insight_canon(basket_id)` | `POST /p3/insight-canon` |

### Step 3: Add Missing Methods to substrate_client.py

Some methods may be missing. Add them to `work-platform/api/src/clients/substrate_client.py`:

```python
# Add to SubstrateClient class

def get_basket_documents(self, basket_id: UUID | str) -> list[dict]:
    """Get all documents for a basket."""
    response = self._request("GET", f"/api/documents", params={"basket_id": str(basket_id)})
    return response.get("documents", [])

def get_basket_relationships(self, basket_id: UUID | str) -> list[dict]:
    """Get substrate relationships for a basket."""
    response = self._request("GET", f"/api/baskets/{basket_id}/relationships")
    return response.get("relationships", [])
```

### Step 4: Integrate yarnnn-claude-agents into work-platform

**Copy files from yarnnn-claude-agents repo**:
```bash
# From yarnnn-claude-agents repo
cp -r agents/ /path/to/work-platform/api/src/agents/
cp -r projects/ /path/to/work-platform/api/src/projects/
cp -r work/ /path/to/work-platform/api/src/work/
```

**Update imports**:
```python
# In copied files, update memory provider imports
from clients.substrate_client import get_substrate_client
```

### Step 5: Create Work Platform Routes

**New route structure**:
```python
# work-platform/api/src/app/routes/projects.py
from agents.orchestrator import WorkOrchestrator

@router.post("/projects")
async def create_project(request: ProjectCreateRequest):
    """Create new work project with agent orchestration."""
    orchestrator = WorkOrchestrator()
    project = await orchestrator.create_project(request)
    return project

@router.post("/projects/{project_id}/work")
async def run_work_session(project_id: str, request: WorkRequest):
    """Run agentic work session on project."""
    orchestrator = WorkOrchestrator()
    result = await orchestrator.execute_work(project_id, request)
    return result
```

### Step 6: Remove Legacy Routes (Optional)

**Routes to remove/refactor** (they use direct DB access):
```bash
work-platform/api/src/app/routes/
├── blocks.py              ← Remove (use substrate-api)
├── basket_snapshot.py     ← Remove (use substrate-api)
├── p3_insights.py         ← Remove (use substrate-api)
├── p4_canon.py            ← Remove (use substrate-api)
└── ... (others with direct substrate access)
```

**Keep**:
- `auth_*.py` (authentication routes)
- `health.py` (health checks)
- Any work-platform-specific routes (projects, work sessions)

---

## Key Files Reference

### Already Built (Use These!)

**HTTP Client**: `work-platform/api/src/clients/substrate_client.py`
```python
from clients.substrate_client import get_substrate_client

client = get_substrate_client()
blocks = client.get_basket_blocks(basket_id)
work = client.initiate_work(basket_id, "compose_canon", {})
```

**Available Methods**:
- `health_check()` - Basic health
- `get_basket_blocks(basket_id, states, limit)` - Get blocks
- `initiate_work(basket_id, work_mode, payload, user_id)` - Submit work
- `get_work_status(work_id)` - Check work status
- `retry_work(work_id)` - Retry failed work
- `compose_document(basket_id, context_blocks, intent)` - Compose doc
- `get_basket_inputs(basket_id)` - Get raw dumps
- `create_dump(basket_id, content, metadata)` - Create dump
- `generate_insight_canon(basket_id, force_regenerate)` - P3 insight

**Service Auth Middleware**: `substrate-api/api/src/middleware/service_to_service_auth.py`
- Already configured in render.yaml
- Disabled by default (`ENABLE_SERVICE_AUTH=false`)
- Can enable later for production security

### Need to Integrate (From yarnnn-claude-agents)

**Agent Framework**:
- `agents/orchestrator.py` - Work orchestration logic
- `agents/memory_provider.py` - Memory abstraction (wire to substrate_client)
- `agents/*.py` - Other agent components

**Project/Work Management**:
- `projects/` - Project management layer
- `work/` - Work session handling

---

## Testing Strategy

### Test 1: Substrate Client Works
```python
# test_substrate_client.py
from clients.substrate_client import get_substrate_client

def test_substrate_connection():
    client = get_substrate_client()
    health = client.health_check()
    assert health["status"] == "ok"

def test_get_blocks():
    client = get_substrate_client()
    blocks = client.get_basket_blocks("some-basket-id")
    assert isinstance(blocks, list)
```

### Test 2: Memory Provider Uses HTTP
```python
# test_memory_provider.py
from agents.memory_provider import MemoryProvider

def test_memory_provider_uses_http():
    provider = MemoryProvider()
    context = provider.get_context("basket-id")
    # Should NOT query database directly
    # Should call substrate_client.get_basket_blocks()
    assert context is not None
```

### Test 3: Work Orchestration End-to-End
```python
# test_work_orchestration.py
from agents.orchestrator import WorkOrchestrator

def test_work_session():
    orchestrator = WorkOrchestrator()
    result = orchestrator.execute_work(
        project_id="test-project",
        work_request={"action": "analyze_context"}
    )
    assert result["status"] in ["pending", "completed"]
```

---

## Environment Setup

### Render Dashboard Updates Needed

1. **Work Platform API Service**:
   - Name: `yarnnn-work-platform-api` (already updated in render.yaml)
   - Root: `work-platform/api/`
   - Set `SUBSTRATE_SERVICE_SECRET` in dashboard

2. **Substrate API Service**:
   - Name: `yarnnn-substrate-api` (already correct)
   - Root: `substrate-api/api/`
   - Set `SUBSTRATE_SERVICE_SECRET` (same value as work-platform)

### Local Development

```bash
# work-platform/.env
SUBSTRATE_API_URL=http://localhost:10001  # Substrate running locally
SUBSTRATE_SERVICE_SECRET=dev-secret

# substrate-api/.env
ENABLE_SERVICE_AUTH=false  # Disable for local dev
SUBSTRATE_SERVICE_SECRET=dev-secret
```

---

## Migration Checklist

### Before You Start
- [x] Phase 1-3.2 completed (domain separation, BFF foundation)
- [x] substrate_client.py built and tested
- [x] No duplicate agent code in work-platform
- [x] Clear understanding of work-platform vs substrate-api domains

### Integration Steps
- [ ] Clone yarnnn-claude-agents repo
- [ ] Review agent framework architecture
- [ ] Copy agent files into work-platform/api/src/agents/
- [ ] Wire memory_provider.py to use substrate_client.py
- [ ] Add any missing methods to substrate_client.py
- [ ] Create new work-platform routes (projects, work sessions)
- [ ] Update work-platform/api/src/app/agent_server.py with new routes
- [ ] Test memory provider uses HTTP (not direct DB)
- [ ] Test work orchestration end-to-end
- [ ] Remove/refactor legacy routes with direct substrate access
- [ ] Deploy and test in staging
- [ ] Update frontend to use new work-platform API

---

## Success Criteria

### Technical
✅ Memory provider in work-platform calls substrate-api via HTTP only
✅ Zero direct substrate table access in work-platform
✅ Agent orchestration framework integrated and working
✅ Work sessions can be created and executed via agents
✅ Both services can deploy independently

### Architectural
✅ **Work Platform** = Agentic orchestration layer (projects, work, agents)
✅ **Substrate API** = P0-P4 pipeline + memory domain (authoritative)
✅ Clear separation: work orchestration vs memory/context
✅ HTTP-based communication with resilience (circuit breaker, retries)

---

## Known Issues / Watch Out For

### Issue 1: Work Platform May Have Broken Imports
After removing agent pipeline code, some routes may import missing files.

**Solution**: Update routes to use substrate_client instead of deleted services.

### Issue 2: Substrate Client May Be Missing Methods
yarnnn-claude-agents may need substrate operations not in substrate_client.py yet.

**Solution**: Add methods to substrate_client.py as needed. Follow existing patterns.

### Issue 3: Service Auth Disabled by Default
BFF communication currently has no authentication (for backward compatibility).

**Solution**: Enable `ENABLE_SERVICE_AUTH=true` in production after testing.

---

## Documentation References

- **Architecture Overview**: `DEPLOYMENT_GUIDE_V4.md`
- **BFF Implementation Plan**: `PHASE3_BFF_IMPLEMENTATION_PLAN.md` (original roadmap)
- **Usage Guide**: `PHASE3_USAGE_GUIDE.md` (substrate_client examples)
- **Test Suite**: `test_bff_foundation.py`

---

## Summary: Where We Are

### ✅ Completed
- Clean domain separation (work-platform vs substrate-api)
- HTTP client infrastructure (substrate_client.py)
- Service auth middleware (optional, disabled by default)
- Removed all duplicate agent code
- Clear architectural boundaries

### 🎯 Next: Your Mission
**Integrate yarnnn-claude-agents into work-platform**:
1. Copy agent framework into work-platform
2. Wire memory provider to substrate_client.py
3. Build new work/project routes
4. Remove legacy substrate-accessing routes
5. Deploy and test

### 🚀 End Goal
```
work-platform = Agentic orchestration (Claude agents, projects, work)
                ↓ (HTTP only)
substrate-api = P0-P4 pipeline + memory domain
```

**You have a stable foundation. Ready to build the agentic layer!**

---

## Quick Start for Next Session

```bash
# 1. Clone yarnnn-claude-agents repo
git clone https://github.com/Kvkthecreator/yarnnn-claude-agents.git

# 2. Copy agent files to work-platform
cp -r yarnnn-claude-agents/agents work-platform/api/src/
cp -r yarnnn-claude-agents/projects work-platform/api/src/
cp -r yarnnn-claude-agents/work work-platform/api/src/

# 3. Wire memory provider to substrate_client
# Edit work-platform/api/src/agents/memory_provider.py
# Replace direct DB calls with:
from clients.substrate_client import get_substrate_client
client = get_substrate_client()

# 4. Test it works
cd work-platform/api
python -m pytest tests/

# 5. Deploy
git add . && git commit -m "Integrate Claude agent framework"
git push origin main
```

Good luck! 🚀
