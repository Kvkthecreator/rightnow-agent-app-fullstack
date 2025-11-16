# Work-Platform Engine Architecture Map

## Executive Summary

The work-platform engine is a **multi-layered orchestration system** that bridges the Claude Agent SDK with a substrate-based backend (Phase 3 BFF pattern). It manages the complete lifecycle of agent-powered work requests: from user trigger → authorization → agent execution → context provisioning → artifact generation → output persistence.

**Key Insight**: The entire system is a `User Request → Factory → Agent → Adapters → HTTP Client → Substrate API` pipeline.

---

## 1. ENTRY POINTS (Routes/Triggers)

### Primary Agent Execution Endpoint
**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/routes/agent_orchestration.py`

- **Route**: `POST /api/agents/run`
- **Handler**: `run_agent_task(request: AgentTaskRequest, user: dict)`
- **Accepts**:
  - `agent_type`: "research" | "content" | "reporting"
  - `task_type`: Task-specific string (e.g., "monitor", "deep_dive", "create")
  - `basket_id`: Context container UUID
  - `parameters`: Task parameters dict

**Request Flow**:
```
User HTTP Request
    ↓
JWT Verification (verify_jwt dependency)
    ↓
Permission Check (check_agent_work_request_allowed)
    ↓
Work Request Recording (record_work_request)
    ↓
Agent Factory Dispatch
    ↓
Agent Execution
    ↓
Status Update (update_work_request_status)
    ↓
Response to User
```

### Secondary Entry Points

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/routes/agent_run.py`
- Route: `POST /agents/{name}/run` (stub, legacy compatibility)

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/agent_entrypoints.py`
- Routes: `/api/agent`, `/api/agent/direct` (legacy stubs)

---

## 2. APP INITIALIZATION & SERVER SETUP

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/agent_server.py`

### FastAPI Application Creation
```python
app = FastAPI(title="RightNow Agent Server", lifespan=lifespan)
```

### Middleware Stack (in order)
1. **AuthMiddleware** - JWT verification (exempt: /health, /docs, /auth/mcp)
2. **CorrelationIdMiddleware** - Request correlation tracking
3. **CORSMiddleware** - Cross-origin requests (allows localhost:3000, yarnnn.com)

### Router Registration
```python
routers = (
    agent_orchestration_router,      # /api/agents/run (PRIMARY)
    agent_run_router,                # /api/agents/{name}/run
    agents_router,                   # /api/agents (legacy)
    project_work_sessions_router,    # /api/work-sessions
    work_platform_router,            # /api/work (projects, sessions)
    work_review_router,              # /api/work/artifacts, checkpoints
    # ... 20+ additional routers
)

for r in routers:
    app.include_router(r, prefix="/api")
```

---

## 3. ORCHESTRATION LAYER (The Factory & Wiring)

### 3.1 Agent Factory

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/agents/factory.py`

The factory is the **bridge between SDK and substrate**. It:
1. Loads agent config from YAML
2. Creates memory/governance adapters
3. Instantiates SDK agent with adapters

#### Factory Functions

**`create_research_agent(basket_id, workspace_id, user_id, project_id, work_session_id)`**
```python
# 1. Load config
config = load_agent_config("research")

# 2. Create adapters with enhanced context
memory = SubstrateMemoryAdapter(
    basket_id=basket_id,
    workspace_id=workspace_id,
    agent_type="research",
    project_id=project_id,
    work_session_id=work_session_id
)

governance = None  # NOTE: Not used during execution

# 3. Create SDK agent with adapters
agent = ResearchAgent(
    agent_id=config["agent"]["id"],
    memory=memory,
    governance=governance,
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    monitoring_domains=config["research"]["monitoring_domains"],
    # ... other SDK params
)
```

**Similar functions**: `create_content_agent()`, `create_reporting_agent()`

#### Agent Configs (YAML)

**research.yaml**:
```yaml
agent:
  id: yarnnn_research_agent
research:
  monitoring_domains: [ai_agents, market_trends, competitors]
  monitoring_frequency: daily
  signal_threshold: 0.7
  synthesis_mode: insights
```

**content.yaml** (placeholder, to be configured)
**reporting.yaml** (placeholder, to be configured)

### 3.2 Main Orchestration Route

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/routes/agent_orchestration.py`

#### `run_agent_task()` - Main Execution Coordinator

**Step-by-step flow**:

```python
async def run_agent_task(request: AgentTaskRequest, user: dict):
    
    # STEP 1: Extract & validate user
    user_id = user.get("sub") or user.get("user_id")
    
    # STEP 2: Authorization (Phase 5)
    workspace_id = await _get_workspace_id_for_user(user_id)
    permission_info = await check_agent_work_request_allowed(
        user_id, workspace_id, request.agent_type
    )
    
    # STEP 3: Record work request (for trial counting)
    work_request_id = await record_work_request(
        user_id, workspace_id, basket_id, agent_type, 
        task_type, parameters, permission_info
    )
    
    # STEP 4: Update status to 'running'
    await update_work_request_status(work_request_id, "running")
    
    # STEP 5: Dispatch to agent-specific executor
    if request.agent_type == "research":
        result = await _run_research_agent(request, user_id)
    elif request.agent_type == "content":
        result = await _run_content_agent(request, user_id)
    elif request.agent_type == "reporting":
        result = await _run_reporting_agent(request, user_id)
    
    # STEP 6: Update status to 'completed'
    await update_work_request_status(
        work_request_id, "completed", 
        result_summary=f"Completed {task_type} task"
    )
    
    # STEP 7: Return response
    return AgentTaskResponse(
        status="completed",
        agent_type=request.agent_type,
        work_request_id=work_request_id,
        result=result,
        remaining_trials=permission_info.get("remaining_trial_requests")
    )
```

#### Agent-Specific Executors

**`_run_research_agent(request, user_id)`**:
```python
# 1. Get workspace & validate basket access
workspace_id = await _get_workspace_id_for_user(user_id)
await _validate_basket_access(request.basket_id, workspace_id)

# 2. Get project_id (for config injection)
project = supabase_admin_client.table("projects")
    .select("id").eq("basket_id", request.basket_id)
    .limit(1).execute()
project_id = project.data[0]["id"] if project.data else None

# 3. CREATE AGENT (factory call)
agent = create_research_agent(
    basket_id=request.basket_id,
    workspace_id=workspace_id,
    user_id=user_id,
    project_id=project_id,
    work_session_id=None
)

# 4. Execute task
if request.task_type == "monitor":
    result = await agent.monitor()
elif request.task_type == "deep_dive":
    result = await agent.deep_dive(topic=request.parameters.get("topic"))

# 5. Return result
return result
```

**Similar patterns**: `_run_content_agent()`, `_run_reporting_agent()`

---

## 4. ADAPTER LAYER (SDK ↔ Substrate Bridge)

The adapters translate SDK provider interfaces into substrate_client HTTP calls.

### 4.1 Memory Adapter (Context Provisioning)

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/adapters/memory_adapter.py`

**Class**: `SubstrateMemoryAdapter(MemoryProvider)`

**Implements SDK MemoryProvider interface**:
```python
class SubstrateMemoryAdapter(MemoryProvider):
    def __init__(self, basket_id, workspace_id, agent_type, project_id, work_session_id):
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.agent_type = agent_type
        self.project_id = project_id
        self.work_session_id = work_session_id
        self.client = get_substrate_client()
        self._assets_cache = None
        self._config_cache = None
    
    async def query(query, filters, limit=20) -> List[Context]:
        """Query substrate for context blocks"""
        # Call substrate-api via HTTP
        blocks = self.client.get_basket_blocks(
            basket_id=self.basket_id,
            states=filters.get("states", ["ACCEPTED", "LOCKED"]),
            limit=limit
        )
        
        # Convert blocks to SDK Context format
        contexts = [self._block_to_context(block) for block in blocks]
        
        # Phase 1+2 ENHANCEMENT: Inject assets + config
        if self.agent_type and self.project_id:
            assets = await self._get_reference_assets()
            config = await self._get_agent_config()
            
            metadata_context = Context(
                content="[AGENT EXECUTION CONTEXT]",
                metadata={
                    "reference_assets": assets,
                    "agent_config": config
                }
            )
            contexts.insert(0, metadata_context)
        
        return contexts
    
    async def store(context: Context) -> str:
        """Store context in substrate"""
        result = self.client.create_dump(
            basket_id=self.basket_id,
            content=context.content,
            metadata=context.metadata or {}
        )
        return result.get("id") or result.get("dump_id")
    
    async def get_all(filters) -> List[Context]:
        """Get all context from substrate"""
        return await self.query("", filters=filters, limit=10000)
```

**Key Phase 1+2 Features**:
- **Reference Assets Injection**: Fetches permanent reference assets scoped to agent type
- **Agent Config Injection**: Queries work-platform DB for project_agents config
- **Caching**: Caches assets & config once per session

#### Assets Fetching

```python
async def _get_reference_assets(self) -> List[Dict]:
    """Fetch reference assets scoped to agent"""
    if self._assets_cache:
        return self._assets_cache
    
    assets = self.client.get_reference_assets(
        basket_id=self.basket_id,
        agent_type=self.agent_type,
        work_session_id=self.work_session_id,
        permanence="permanent"
    )
    
    self._assets_cache = assets
    return assets
```

#### Config Fetching

```python
async def _get_agent_config(self) -> Dict[str, Any]:
    """Fetch agent config from work-platform DB"""
    if self._config_cache:
        return self._config_cache
    
    response = supabase_admin_client.table("project_agents").select(
        "config"
    ).eq("project_id", self.project_id).eq(
        "agent_type", self.agent_type
    ).eq("is_active", True).limit(1).execute()
    
    self._config_cache = response.data[0].get("config", {}) if response.data else {}
    return self._config_cache
```

### 4.2 Governance Adapter (Change Proposals)

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/adapters/governance_adapter.py`

**Class**: `SubstrateGovernanceAdapter(GovernanceProvider)`

**Note**: Not used during agent execution (set to None in factory). Governance happens separately:
- Agent executes and proposes changes
- Changes → work approval → substrate proposals (separate bridge)

**Implements**:
```python
async def propose(change_type, data, confidence=0.7) -> str:
    """Propose change to substrate via HTTP"""
    # Map SDK change types to substrate operations
    ops = self._map_change_to_ops(change_type, data)
    
    # Call substrate-api via HTTP
    result = self.client.initiate_work(
        basket_id=self.basket_id,
        work_mode="governance_proposal",
        payload={
            "ops": ops,
            "confidence": confidence,
            "change_type": change_type
        },
        user_id=self.user_id
    )
    
    return result.get("work_id") or result.get("id")

async def check_approval(proposal_id: str) -> bool:
    """Check if proposal approved"""
    status = await self.get_proposal_status(proposal_id)
    return status in ["approved", "completed", "success"]

async def commit_change(proposal_id: str) -> bool:
    """Commit approved change via HTTP"""
    if not await self.check_approval(proposal_id):
        return False
    
    self.client.retry_work(work_id=proposal_id)
    return True
```

---

## 5. HTTP CLIENT LAYER (Substrate Communication)

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/clients/substrate_client.py`

**Class**: `SubstrateClient`

This is the **Phase 3 BFF Foundation** - HTTP client with:
- Service token authentication
- Automatic retries with exponential backoff (tenacity library)
- Circuit breaker for fault tolerance
- Connection pooling (httpx.Client)
- Request/response logging

### Initialization
```python
client = SubstrateClient(
    base_url=os.getenv("SUBSTRATE_API_URL", "http://localhost:10000"),
    service_secret=os.getenv("SUBSTRATE_SERVICE_SECRET"),
    timeout=30.0
)
```

### Circuit Breaker Pattern
```python
class CircuitBreaker:
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests for cooldown
    HALF_OPEN = "half_open"  # Testing if service recovered
    
    # After 5 failures → OPEN circuit
    # After cooldown (60s) → try HALF_OPEN
    # If success in HALF_OPEN → close circuit
```

### Key Endpoints Called

**Memory/Context Operations**:
```python
def get_basket_blocks(basket_id, states=None, limit=None) -> list[dict]
    GET /baskets/{basket_id}/blocks

def create_dump(basket_id, content, metadata) -> dict
    POST /api/dumps/new

def get_reference_assets(basket_id, agent_type, permanence) -> list[dict]
    GET /api/substrate/baskets/{basket_id}/assets
```

**Work Orchestration (Canon v2.1)**:
```python
def initiate_work(basket_id, work_mode, payload, user_id) -> dict
    POST /api/work/initiate

def get_work_status(work_id) -> dict
    GET /api/work/{work_id}/status

def retry_work(work_id) -> dict
    POST /api/work/{work_id}/retry
```

**Singleton Pattern**:
```python
_substrate_client: Optional[SubstrateClient] = None

def get_substrate_client() -> SubstrateClient:
    global _substrate_client
    if _substrate_client is None:
        _substrate_client = SubstrateClient()
    return _substrate_client
```

---

## 6. AUTHORIZATION & PERMISSION LAYER (Phase 5)

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/utils/permissions.py`

### Permission Check Flow

```python
async def check_agent_work_request_allowed(
    user_id: str, 
    workspace_id: str, 
    agent_type: str
) -> dict:
    """
    Business Rules:
    - 10 FREE trial requests total (across ALL agents)
    - After trial exhausted → must subscribe to agent
    - Subscription = unlimited requests for that agent
    
    Returns:
    {
        "can_request": bool,
        "is_subscribed": bool,
        "subscription_id": UUID | None,
        "remaining_trial_requests": int | None
    }
    """
    
    # Call Supabase function to check trial limit
    response = supabase.rpc(
        "check_trial_limit",
        {
            "p_user_id": user_id,
            "p_workspace_id": workspace_id,
            "p_agent_type": agent_type
        }
    ).execute()
    
    permission_info = response.data
    
    if not permission_info.get("can_request"):
        raise PermissionDeniedError(
            f"Trial limit exhausted (0/10 remaining). "
            f"Subscribe to {agent_type} for unlimited requests."
        )
    
    return permission_info
```

### Work Request Recording

```python
async def record_work_request(
    user_id, workspace_id, basket_id, agent_type, work_mode,
    request_payload, permission_info
) -> str:
    """Record work request in database"""
    
    is_trial = not permission_info.get("is_subscribed", False)
    subscription_id = permission_info.get("subscription_id")
    
    response = supabase.table("agent_work_requests").insert({
        "user_id": user_id,
        "workspace_id": workspace_id,
        "basket_id": basket_id,
        "agent_type": agent_type,
        "work_mode": work_mode,
        "request_payload": request_payload,
        "is_trial_request": is_trial,
        "subscription_id": subscription_id,
        "status": "pending"
    }).execute()
    
    return response.data[0]["id"]
```

### Status Updates

```python
async def update_work_request_status(
    work_request_id: str,
    status: str,  # "running" | "completed" | "failed"
    result_summary: Optional[str] = None,
    error_message: Optional[str] = None
) -> None:
    """Update work request after execution"""
    
    update_data = {"status": status}
    
    if status == "completed":
        update_data["completed_at"] = "now()"
        if result_summary:
            update_data["result_summary"] = result_summary
    
    elif status == "failed":
        update_data["completed_at"] = "now()"
        if error_message:
            update_data["error_message"] = error_message
    
    supabase.table("agent_work_requests").update(update_data).eq("id", work_request_id).execute()
```

### Trial Status & Subscriptions

```python
async def get_trial_status(user_id: str, workspace_id: str) -> dict:
    """Get trial status (remaining free requests)"""
    
    # Count used trial requests
    trial_response = supabase.table("agent_work_requests").select(
        "id", count="exact"
    ).eq("user_id", user_id).eq(
        "workspace_id", workspace_id
    ).eq("is_trial_request", True).execute()
    
    used_count = trial_response.count or 0
    remaining = max(0, 10 - used_count)
    
    # Get active subscriptions
    subs = supabase.table("user_agent_subscriptions").select(
        "agent_type"
    ).eq("user_id", user_id).eq(
        "workspace_id", workspace_id
    ).eq("status", "active").execute()
    
    subscribed_agents = [sub["agent_type"] for sub in (subs.data or [])]
    
    return {
        "used_trial_requests": used_count,
        "remaining_trial_requests": remaining,
        "total_trial_limit": 10,
        "subscribed_agents": subscribed_agents
    }
```

---

## 7. DATA FLOW DIAGRAM

```
User HTTP Request (POST /api/agents/run)
    ↓
AuthMiddleware: JWT Verification
    ↓
agent_orchestration.run_agent_task()
    ↓
[AUTHORIZATION LAYER]
    ├─ _get_workspace_id_for_user()
    ├─ check_agent_work_request_allowed() → check_trial_limit() [Supabase RPC]
    └─ record_work_request() → INSERT agent_work_requests table
    ↓
[FACTORY LAYER]
    ├─ Determine agent type (research/content/reporting)
    ├─ _run_research_agent() / _run_content_agent() / _run_reporting_agent()
    ├─ Get workspace_id & project_id (from Supabase)
    └─ factory.create_research_agent() [or content/reporting]
    ↓
[FACTORY IMPLEMENTATION]
    ├─ load_agent_config("research.yaml")
    ├─ SubstrateMemoryAdapter.__init__()
    │   ├─ Store: basket_id, workspace_id, agent_type, project_id
    │   └─ get_substrate_client() → singleton
    └─ ResearchAgent.__init__(memory=adapter, governance=None, ...)
    ↓
[AGENT EXECUTION - SDK Internal]
    ├─ agent.monitor() / agent.deep_dive(topic) / ...
    ├─ Agent calls memory.query(query_string) → SubstrateMemoryAdapter.query()
    ├─ Agent calls memory.store(context) → SubstrateMemoryAdapter.store()
    └─ Agent generates result (artifacts, findings)
    ↓
[ADAPTER LAYER - SubstrateMemoryAdapter.query()]
    ├─ substrate_client.get_basket_blocks(basket_id, states, limit)
    │   → HTTP GET /baskets/{basket_id}/blocks
    │   → Circuit breaker + retry logic
    │   → Response: [block1, block2, ...]
    ├─ substrate_client.get_reference_assets(basket_id, agent_type)
    │   → HTTP GET /api/substrate/baskets/{basket_id}/assets?agent_scope=research
    │   → Response: [asset1, asset2, ...] + signed URLs
    ├─ supabase_admin_client.table("project_agents").select("config")
    │   → Query work-platform DB for agent config
    │   → Response: { "config": {...} }
    ├─ Convert blocks to Context objects
    └─ Inject assets + config into Context.metadata
    ↓
[AGENT EXECUTION - Continues with enriched context]
    ├─ Agent processes blocks + assets + config
    └─ Agent generates output/artifacts
    ↓
[STATUS UPDATE & RESPONSE]
    ├─ update_work_request_status(work_request_id, "completed")
    │   → UPDATE agent_work_requests SET status='completed'
    └─ Return AgentTaskResponse {
        status: "completed",
        agent_type: "research",
        task_type: "monitor",
        work_request_id: UUID,
        result: {...},
        remaining_trials: 7,
        is_trial_request: true
    }
```

---

## 8. DOMAIN SERVICES HIERARCHY

```
Agent Orchestration Layer
├── Authentication & Authorization
│   ├── verify_jwt (dependency injection)
│   ├── _get_workspace_id_for_user()
│   ├── _validate_basket_access()
│   └── check_agent_work_request_allowed()
│
├── Agent Factory
│   ├── load_agent_config(agent_type) → YAML config
│   ├── create_research_agent()
│   ├── create_content_agent()
│   └── create_reporting_agent()
│
├── Adapters (SDK ↔ Substrate Bridge)
│   ├── SubstrateMemoryAdapter
│   │   ├── query() → substrate_client.get_basket_blocks()
│   │   ├── store() → substrate_client.create_dump()
│   │   ├── get_all() → substrate_client.get_basket_blocks(limit=10000)
│   │   ├── _get_reference_assets()
│   │   └── _get_agent_config()
│   │
│   └── SubstrateGovernanceAdapter (not used in execution)
│       ├── propose() → substrate_client.initiate_work()
│       ├── check_approval() → substrate_client.get_work_status()
│       └── commit_change() → substrate_client.retry_work()
│
├── Permission Management
│   ├── check_agent_work_request_allowed() → Supabase RPC check_trial_limit()
│   ├── record_work_request() → INSERT agent_work_requests
│   ├── update_work_request_status() → UPDATE agent_work_requests
│   └── get_trial_status() → COUNT agent_work_requests (trial)
│
└── HTTP Communication Layer
    ├── SubstrateClient
    │   ├── Circuit Breaker (fault tolerance)
    │   ├── Retry Logic (tenacity: 3 attempts, exponential backoff)
    │   ├── Connection Pooling (httpx.Client)
    │   └── Service Token Auth (X-Service-Name, Bearer token)
    │
    └── Endpoints:
        ├── GET /baskets/{basket_id}/blocks
        ├── POST /api/dumps/new
        ├── GET /api/substrate/baskets/{basket_id}/assets
        ├── POST /api/work/initiate
        ├── GET /api/work/{work_id}/status
        └── POST /api/work/{work_id}/retry
```

---

## 9. SESSION LIFECYCLE (Work Sessions Model)

**File**: `/Users/macbook/yarnnn-app-fullstack/work-platform/api/src/app/work/models/work_session.py`

```python
class WorkSession(BaseModel):
    id: UUID
    project_id: UUID           # Which project this belongs to
    basket_id: UUID            # Context source
    workspace_id: UUID
    initiated_by_user_id: UUID
    
    # Task definition
    task_type: TaskType        # RESEARCH, CONTENT_CREATION, ANALYSIS
    task_intent: str           # Natural language intent
    task_parameters: Dict      # Flexible params (JSONB)
    
    # Execution state
    status: WorkSessionStatus  # PENDING → RUNNING → PAUSED/COMPLETED/FAILED
    executed_by_agent_id: Optional[str]
    
    # Timestamps
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    
    # Metadata
    metadata: Dict[str, Any]
```

**Status Transitions**:
```
PENDING (created)
    ↓
RUNNING (executing agent)
    ├─ PAUSED (at checkpoint, waiting for user review)
    │   ↓
    ├─ COMPLETED (successfully finished)
    └─ FAILED (execution error)
```

---

## 10. WORK REQUEST TRACKING (Phase 5 - Trials & Subscriptions)

**Tables**:
- `agent_work_requests`: Tracks all work requests (trial vs. paid)
- `user_agent_subscriptions`: Monthly subscriptions per agent
- `agent_catalog`: Agent pricing & metadata

**Request Lifecycle**:
```
1. POST /api/agents/run
    ↓
2. check_agent_work_request_allowed()
    ├─ Trial exhausted? → Raise PermissionDeniedError
    └─ Is subscribed? → Check subscription status
    ↓
3. record_work_request()
    ├─ is_trial_request = NOT is_subscribed
    └─ INSERT agent_work_requests { status: 'pending', ... }
    ↓
4. update_work_request_status(work_request_id, 'running')
    ↓
5. [Agent Execution]
    ↓
6. update_work_request_status(work_request_id, 'completed'|'failed')
    ├─ completed_at = now()
    └─ result_summary / error_message
```

---

## 11. CONTEXT PASSING MECHANISMS

### 1. Basket Context (Substrate Blocks)

**Source**: substrate-api (`/baskets/{basket_id}/blocks`)

**Flow**:
```
Agent Execution
    ↓
agent.memory.query("find similar patterns")
    ↓
SubstrateMemoryAdapter.query()
    ↓
substrate_client.get_basket_blocks(
    basket_id=xyz,
    states=["ACCEPTED", "LOCKED"],
    limit=20
)
    ↓
HTTP GET /baskets/xyz/blocks
    ↓
[block1, block2, ...]
    ↓
Convert to Context objects
    ↓
Inject into agent's memory system
```

### 2. Reference Assets (Phase 1+2)

**Source**: substrate-api (`/api/substrate/baskets/{basket_id}/assets`)

**Scope**: Per agent type (research, content, reporting)

**Flow**:
```
SubstrateMemoryAdapter.__init__()
    ├─ agent_type = "research"
    └─ work_session_id = None (temporary assets)
    ↓
During agent.query():
    ├─ Call _get_reference_assets()
    │   ├─ substrate_client.get_reference_assets(
    │   │   basket_id=xyz,
    │   │   agent_scope="research",
    │   │   permanence="permanent"
    │   │)
    │   └─ [asset1, asset2, ...] with signed URLs
    ├─ Create metadata_context
    │   └─ Context.metadata["reference_assets"] = assets
    └─ Insert as first context item
```

### 3. Agent Config (Phase 1+2)

**Source**: work-platform DB (`project_agents` table)

**Flow**:
```
SubstrateMemoryAdapter.__init__()
    ├─ project_id = UUID
    └─ agent_type = "research"
    ↓
During agent.query():
    ├─ Call _get_agent_config()
    │   ├─ supabase_admin_client.table("project_agents")
    │   │   .select("config")
    │   │   .eq("project_id", project_id)
    │   │   .eq("agent_type", "research")
    │   │   .eq("is_active", True)
    │   └─ response.data[0]["config"]
    ├─ Create metadata_context
    │   └─ Context.metadata["agent_config"] = config
    └─ Insert as first context item
```

---

## 12. KEY FILES SUMMARY

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Server Initialization** | `app/agent_server.py` | FastAPI app, middleware, router registration |
| **Orchestration Route** | `app/routes/agent_orchestration.py` | Main `/api/agents/run` endpoint |
| **Agent Factory** | `agents/factory.py` | Creates SDK agents with adapters |
| **Memory Adapter** | `adapters/memory_adapter.py` | SDK MemoryProvider → substrate_client |
| **Governance Adapter** | `adapters/governance_adapter.py` | SDK GovernanceProvider (not used in execution) |
| **Substrate Client** | `clients/substrate_client.py` | HTTP client with circuit breaker, retries |
| **Permissions** | `utils/permissions.py` | Trial enforcement, work request tracking |
| **Work Session Model** | `app/work/models/work_session.py` | Work session schema |
| **Agent Configs** | `agents/config/*.yaml` | YAML configs for research/content/reporting |

---

## 13. EXECUTION FLOW EXAMPLE (Research Agent)

```
User Input:
POST /api/agents/run {
    "agent_type": "research",
    "task_type": "monitor",
    "basket_id": "550e8400-e29b-41d4-a716-446655440000",
    "parameters": {}
}

↓ [AuthMiddleware: JWT verified]
↓ [run_agent_task() called]

Step 1: Get workspace_id
    supabase.table("workspace_memberships")
        .eq("user_id", "user123")
    → workspace_id = "workspace-xyz"

Step 2: Check permission
    supabase.rpc("check_trial_limit", {
        p_user_id: "user123",
        p_workspace_id: "workspace-xyz",
        p_agent_type: "research"
    })
    → { can_request: true, is_subscribed: false, remaining_trial_requests: 7 }

Step 3: Record work request
    supabase.table("agent_work_requests").insert({
        user_id: "user123",
        workspace_id: "workspace-xyz",
        basket_id: "basket-abc",
        agent_type: "research",
        work_mode: "monitor",
        is_trial_request: true,
        status: "pending"
    })
    → work_request_id = "req-123"

Step 4: Update to 'running'
    supabase.table("agent_work_requests")
        .update({ status: "running" })
        .eq("id", "req-123")

Step 5: Get project_id
    supabase.table("projects")
        .select("id")
        .eq("basket_id", "basket-abc")
    → project_id = "project-xyz"

Step 6: CREATE RESEARCH AGENT
    load_agent_config("research")
    
    memory = SubstrateMemoryAdapter(
        basket_id="basket-abc",
        workspace_id="workspace-xyz",
        agent_type="research",
        project_id="project-xyz",
        work_session_id=None
    )
    
    agent = ResearchAgent(
        agent_id="yarnnn_research_agent",
        memory=memory,
        governance=None,
        anthropic_api_key="sk-...",
        monitoring_domains=["ai_agents", "market_trends", "competitors"],
        monitoring_frequency="daily",
        signal_threshold=0.7,
        synthesis_mode="insights"
    )

Step 7: EXECUTE AGENT TASK
    agent.monitor()
    
    [Agent calls]
    await memory.query("Find trends in AI agent space")
    
    [Memory Adapter Implementation]
    SubstrateMemoryAdapter.query():
        
        A) Get blocks from substrate
        substrate_client.get_basket_blocks(
            basket_id="basket-abc",
            states=["ACCEPTED", "LOCKED"],
            limit=20
        )
        → HTTP GET /baskets/basket-abc/blocks
        → [block1{title, body, state}, block2{...}, ...]
        
        B) Get reference assets
        substrate_client.get_reference_assets(
            basket_id="basket-abc",
            agent_type="research",
            permanence="permanent"
        )
        → HTTP GET /api/substrate/baskets/basket-abc/assets?agent_scope=research
        → [asset1{name, type, signed_url}, ...]
        
        C) Get agent config
        supabase_admin_client.table("project_agents")
            .select("config")
            .eq("project_id", "project-xyz")
            .eq("agent_type", "research")
        → { "config": {"model": "claude-3-opus", ...} }
        
        D) Inject into context
        contexts = [
            Context(
                content="[AGENT EXECUTION CONTEXT]",
                metadata={
                    "reference_assets": [asset1, asset2, ...],
                    "agent_config": {...}
                }
            ),
            Context(title="Trend 1", body="...", metadata={...}),
            Context(title="Trend 2", body="...", metadata={...}),
            ...
        ]
        
        return contexts
    
    [Agent processes context]
    → Analyzes blocks + assets + config
    → Generates findings + recommendations
    → Returns result

Step 8: Update status to 'completed'
    supabase.table("agent_work_requests")
        .update({
            status: "completed",
            completed_at: "now()",
            result_summary: "Completed monitor task"
        })
        .eq("id", "req-123")

Step 9: Return response
    AgentTaskResponse {
        status: "completed",
        agent_type: "research",
        task_type: "monitor",
        message: "research task completed successfully",
        result: { findings: [...], recommendations: [...] },
        work_request_id: "req-123",
        is_trial_request: true,
        remaining_trials: 6
    }

↓ [HTTP 200 Response to user]
```

---

## 14. CRITICAL DESIGN PATTERNS

### 1. Factory Pattern (Agent Creation)
- Centralizes agent instantiation
- Loads config from YAML
- Injects adapters for SDK compatibility
- Validates environment variables

### 2. Adapter Pattern (SDK ↔ Backend)
- Translates SDK interfaces to substrate_client calls
- Preserves BFF architecture (HTTP-only backend communication)
- Allows multiple implementations (memory, governance)

### 3. Singleton Pattern (HTTP Client)
- Single SubstrateClient instance across app
- Connection pooling, circuit breaker shared
- Thread-safe initialization

### 4. Circuit Breaker Pattern (Fault Tolerance)
- Prevents cascading failures to substrate-api
- States: CLOSED → OPEN (cooldown) → HALF_OPEN → CLOSED
- Automatic recovery after cooldown

### 5. Retry Pattern (Resilience)
- Exponential backoff: 1s, 2s, 4s (max 10s)
- Max 3 attempts
- Only retries on 5xx and specific 4xx errors (408, 429)

### 6. Dependency Injection (FastAPI)
- `verify_jwt` for authentication
- Type hints for auto-injection
- Enables clean testing

---

## 15. CURRENT LIMITATIONS & TODOs

### Not Yet Implemented
1. **Semantic Search**: `substrate_client.search_semantic()` falls back to `get_basket_blocks()`
2. **Checkpoint Resumption**: `WorkSessionExecutor.resume_from_checkpoint()` not implemented
3. **Workspace Creation**: Assumes workspace already exists
4. **Stripe Integration**: Subscription endpoints accept Stripe IDs but don't validate with Stripe API
5. **Governance in Execution**: Adapter created but set to None (governance happens separately)

### TODOs in Code
- `_run_research_agent()`: "TODO: Pass work_session_id for temporary assets"
- `SubstrateClient.get_project_id_for_basket()`: NotImplementedError (should be in routes, not client)

---

## 16. DEPLOYMENT ENTRY POINT

**To start the server**:
```bash
make run
# or
uvicorn src.app.agent_server:app --reload --host 0.0.0.0 --port 8000
```

**Required Environment Variables**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_JWT_SECRET`: JWT signing key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for RPC calls
- `ANTHROPIC_API_KEY`: Claude API key
- `SUBSTRATE_API_URL`: Substrate API base URL (default: http://localhost:10000)
- `SUBSTRATE_SERVICE_SECRET`: Service token for substrate auth

---

## Summary: The Engine in One Sentence

**User Request → JWT Auth → Permission Check → Factory Creates Agent with Adapters → Agent Executes with Substrate Context (blocks + assets + config) → HTTP Client Calls Substrate-API (with Circuit Breaker + Retries) → Status Updated → Response Returned**

This is a **six-layer orchestration system** bridging the Claude Agent SDK to a substrate-based backend using adapters, with fault tolerance, trial enforcement, and enriched context injection for AI agent execution.
