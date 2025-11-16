# Work-Platform Engine - Quick Reference Guide

## The 7-Layer Pipeline

```
[1] HTTP Request
     ↓
[2] Middleware (Auth, Correlation)
     ↓
[3] Route Handler (agent_orchestration.run_agent_task)
     ↓
[4] Factory (create_research_agent / create_content_agent / create_reporting_agent)
     ↓
[5] Adapters (SubstrateMemoryAdapter, SubstrateGovernanceAdapter)
     ↓
[6] HTTP Client (SubstrateClient with Circuit Breaker + Retries)
     ↓
[7] Substrate API (backend service)
```

---

## File Locations (Absolute Paths)

| Layer | Component | File |
|-------|-----------|------|
| Server | FastAPI App + Middleware | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/agent_server.py` |
| Route | Agent Orchestration (PRIMARY) | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/routes/agent_orchestration.py` |
| Authorization | Permission Checks | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/utils/permissions.py` |
| Factory | Agent Creation | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/agents/factory.py` |
| Memory Adapter | Context Provisioning | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/adapters/memory_adapter.py` |
| Governance Adapter | Change Proposals | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/adapters/governance_adapter.py` |
| HTTP Client | Substrate Communication | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/clients/substrate_client.py` |
| Config | YAML Configs | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/agents/config/{research,content,reporting}.yaml` |
| Models | Work Session Schema | `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/work/models/work_session.py` |

---

## Primary Entry Point

**Route**: `POST /api/agents/run`

**Request Body**:
```json
{
  "agent_type": "research",
  "task_type": "monitor",
  "basket_id": "550e8400-e29b-41d4-a716-446655440000",
  "parameters": {}
}
```

**Response**:
```json
{
  "status": "completed",
  "agent_type": "research",
  "task_type": "monitor",
  "message": "research task completed successfully",
  "result": { ... },
  "work_request_id": "abc123",
  "is_trial_request": true,
  "remaining_trials": 6
}
```

---

## Request Flow (Step-by-Step)

1. **User sends HTTP request** to `/api/agents/run`
2. **AuthMiddleware** verifies JWT
3. **run_agent_task()** extracted user_id, agent_type, basket_id
4. **_get_workspace_id_for_user()** queries workspace_memberships
5. **check_agent_work_request_allowed()** calls Supabase RPC check_trial_limit()
6. **record_work_request()** inserts agent_work_requests record (trial vs. paid)
7. **Factory dispatch** based on agent_type:
   - Research → `_run_research_agent()` → `create_research_agent()`
   - Content → `_run_content_agent()` → `create_content_agent()`
   - Reporting → `_run_reporting_agent()` → `create_reporting_agent()`
8. **Factory implementation**:
   - Load YAML config
   - Create SubstrateMemoryAdapter with basket_id, workspace_id, agent_type, project_id
   - Create SDK agent (ResearchAgent, ContentCreatorAgent, ReportingAgent)
9. **Agent execution** (SDK internal):
   - Calls `memory.query()` → SubstrateMemoryAdapter.query()
   - Calls `memory.store()` → SubstrateMemoryAdapter.store()
10. **Memory Adapter.query()** implementation:
    - Get basket blocks via `substrate_client.get_basket_blocks()`
    - Get reference assets via `substrate_client.get_reference_assets()`
    - Get agent config via `supabase_admin_client.table("project_agents")`
    - Convert to Context objects
    - Inject assets + config into metadata
11. **SubstrateClient** makes HTTP calls:
    - GET /baskets/{basket_id}/blocks
    - GET /api/substrate/baskets/{basket_id}/assets
    - POST /api/dumps/new (if storing)
    - Circuit breaker + retry logic applied
12. **Agent processes context** and generates result
13. **update_work_request_status()** updates status to "completed"
14. **Response returned** to user with result + remaining trials

---

## Key Design Patterns

### Factory Pattern
- `factory.py` centralizes agent creation
- Loads config from YAML
- Injects adapters for SDK compatibility

### Adapter Pattern
- Memory adapter implements SDK MemoryProvider interface
- Governance adapter implements SDK GovernanceProvider interface
- Translates SDK calls to substrate_client HTTP calls

### Singleton Pattern
- One SubstrateClient instance shared across app
- Connection pooling, circuit breaker, retries shared

### Circuit Breaker
- Prevents cascading failures
- States: CLOSED → OPEN (cooldown) → HALF_OPEN → CLOSED
- Opened after 5 failures, 60s cooldown

### Retry Logic
- Exponential backoff: 1s, 2s, 4s (max 10s)
- Max 3 attempts
- Only retries on 5xx and specific 4xx (408, 429)

---

## Context Passing (How Agent Gets Data)

### 1. Basket Blocks (from substrate-api)
```
agent.memory.query("find patterns")
    ↓
SubstrateMemoryAdapter.query()
    ↓
substrate_client.get_basket_blocks(basket_id, states=["ACCEPTED", "LOCKED"])
    ↓
HTTP GET /baskets/{basket_id}/blocks
    ↓
[block1, block2, ...] converted to Context
```

### 2. Reference Assets (from substrate-api)
```
SubstrateMemoryAdapter._get_reference_assets()
    ↓
substrate_client.get_reference_assets(basket_id, agent_type="research")
    ↓
HTTP GET /api/substrate/baskets/{basket_id}/assets?agent_scope=research
    ↓
[asset1, asset2, ...] with signed URLs
    ↓
Injected into Context.metadata["reference_assets"]
```

### 3. Agent Config (from work-platform DB)
```
SubstrateMemoryAdapter._get_agent_config()
    ↓
supabase_admin_client.table("project_agents").select("config")
    .eq("project_id", project_id).eq("agent_type", "research")
    ↓
{ "config": {...} }
    ↓
Injected into Context.metadata["agent_config"]
```

---

## Phase 5: Trial & Subscription Logic

**Business Rules**:
- 10 FREE trial requests total (across ALL agents)
- After trial exhausted → must subscribe to specific agent
- Subscription = unlimited requests for that agent

**Tracking**:
- `agent_work_requests` table: records every work request (trial vs. paid)
- `user_agent_subscriptions` table: monthly subscriptions per agent
- `agent_catalog` table: agent pricing & metadata

**Flow**:
1. User makes work request
2. `check_agent_work_request_allowed()` calls `check_trial_limit()` RPC
3. If trial exhausted AND no subscription → PermissionDeniedError
4. `record_work_request()` marks as trial or paid
5. `update_work_request_status()` updates after execution

---

## Substrate Client API (Key Methods)

```python
# Get basket blocks (memory context)
get_basket_blocks(basket_id, states=None, limit=20) -> list[dict]

# Store agent output
create_dump(basket_id, content, metadata) -> dict

# Get reference assets (photos, PDFs, etc.)
get_reference_assets(basket_id, agent_type, permanence) -> list[dict]

# Propose changes (governance)
initiate_work(basket_id, work_mode, payload, user_id) -> dict

# Check work status
get_work_status(work_id) -> dict

# Retry work
retry_work(work_id) -> dict
```

---

## Agent Types & Tasks

### Research Agent
- **Task Types**: `monitor`, `deep_dive`
- **Parameters**: `topic` (for deep_dive)
- **Config**: monitoring_domains, signal_threshold, synthesis_mode
- **File**: `agents/config/research.yaml`

### Content Agent (Placeholder)
- **Task Types**: `create`, `repurpose`
- **Parameters**: `platform`, `topic`, `content_type`, `source_content`, `target_platforms`
- **File**: `agents/config/content.yaml` (to be configured)

### Reporting Agent (Placeholder)
- **Task Types**: `generate`
- **Parameters**: `report_type`, `format`, `data`
- **File**: `agents/config/reporting.yaml` (to be configured)

---

## Environment Variables

**Required**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_JWT_SECRET`: JWT signing key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role for RPC calls
- `ANTHROPIC_API_KEY`: Claude API key

**Optional**:
- `SUBSTRATE_API_URL`: Substrate API base URL (default: http://localhost:10000)
- `SUBSTRATE_SERVICE_SECRET`: Service token for substrate auth

---

## Common Issues & Solutions

### "Circuit breaker is OPEN"
- Substrate API is down or failing
- Automatic recovery after 60s cooldown
- Check substrate-api logs

### "Trial limit exhausted"
- User has used 10/10 trial requests
- Solution: Subscribe to agent for unlimited requests

### "No workspace found for user"
- User not in any workspace
- Solution: Create workspace and add user as member

### "Basket not found or access denied"
- Basket doesn't belong to user's workspace
- Solution: Verify basket_id and workspace ownership

### "ANTHROPIC_API_KEY not set"
- Missing API key for Claude SDK
- Solution: Set ANTHROPIC_API_KEY environment variable

---

## Testing the Engine

### Local Setup
```bash
cd /Users/macbook/yarnnn-app-fullstack/work-platform/api
pip install -r requirements.txt
make run  # Starts server on :8000
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

---

## Related Documentation

- Full architecture map: `ENGINE_ARCHITECTURE_MAP.md`
- Phase 1 deployment: `PHASE1_DEPLOYMENT_SUMMARY.md`
- Backend hardening: `BACKEND_HARDENING_REPORT.md`
- API delegation patterns: `API_DELEGATION_PATTERNS.md`

