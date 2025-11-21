# Hierarchical Session Architecture: TP + Persistent Specialists

**Date**: 2025-11-21
**Status**: ✅ ARCHITECTURAL DECISION COMMITTED
**Pattern**: 1 TP Session : N Specialist Sessions (persistent within project)

---

## Executive Summary

**Decision**: Thinking Partner manages a **hierarchy of persistent sessions** per project:
- **1 TP Session** (parent) - Gateway and coordinator
- **3 Specialist Sessions** (children) - Research, Content, Reporting (persistent)

**Key Principle**: Each specialist agent maintains conversation continuity within a project, enabling iterative refinement and context retention across multiple work requests.

---

## Session Hierarchy Model

```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT (Basket)                                            │
│ basket_id: "basket_abc"                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓ 1:1
┌─────────────────────────────────────────────────────────────┐
│ TP SESSION (Parent)                                         │
│ - agent_type: "thinking_partner"                            │
│ - sdk_session_id: "tp_session_xyz"                          │
│ - parent_session_id: NULL (root)                            │
│ - Role: Gateway, context assembly, orchestration            │
└─────────────────────────────────────────────────────────────┘
            ↓ 1:3 (created on-demand, persistent)
    ┌───────────────┬───────────────┬───────────────┐
    ↓               ↓               ↓               ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ RESEARCH    │ │ CONTENT     │ │ REPORTING   │
│ SESSION     │ │ SESSION     │ │ SESSION     │
├─────────────┤ ├─────────────┤ ├─────────────┤
│ agent_type: │ │ agent_type: │ │ agent_type: │
│ "research"  │ │ "content"   │ │ "reporting" │
│             │ │             │ │             │
│ parent:     │ │ parent:     │ │ parent:     │
│ TP.id       │ │ TP.id       │ │ TP.id       │
│             │ │             │ │             │
│ sdk_session │ │ sdk_session │ │ sdk_session │
│ _id: "r123" │ │ _id: "c456" │ │ _id: "p789" │
│             │ │             │ │             │
│ PERSISTENT  │ │ PERSISTENT  │ │ PERSISTENT  │
│ within      │ │ within      │ │ within      │
│ project     │ │ project     │ │ project     │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## Database Schema Changes

### Migration: Add parent_session_id to agent_sessions

```sql
-- Migration: 20251121_hierarchical_sessions.sql

-- Add parent_session_id column (nullable for backward compatibility)
ALTER TABLE agent_sessions
ADD COLUMN parent_session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE;

-- Add index for parent-child lookups
CREATE INDEX idx_agent_sessions_parent
ON agent_sessions(parent_session_id)
WHERE parent_session_id IS NOT NULL;

-- Add index for basket + agent_type (existing UNIQUE constraint remains)
-- This supports get_or_create pattern for both TP and specialists
CREATE INDEX idx_agent_sessions_basket_type
ON agent_sessions(basket_id, agent_type);

-- Add constraint: Only TP sessions can be root (parent_session_id = NULL)
ALTER TABLE agent_sessions
ADD CONSTRAINT chk_tp_is_root
CHECK (
  (agent_type = 'thinking_partner' AND parent_session_id IS NULL)
  OR
  (agent_type != 'thinking_partner' AND parent_session_id IS NOT NULL)
);

-- Add created_by_session_id for audit trail (which session spawned this)
ALTER TABLE agent_sessions
ADD COLUMN created_by_session_id UUID REFERENCES agent_sessions(id);

COMMENT ON COLUMN agent_sessions.parent_session_id IS
'FK to parent agent_session. NULL for TP sessions (root). Non-null for specialist sessions (children).';

COMMENT ON COLUMN agent_sessions.created_by_session_id IS
'FK to agent_session that created this session. Used for audit trail of session spawning.';
```

### Updated Schema Definition

```python
class AgentSession(BaseModel):
    """
    Agent session with hierarchical support.

    Session Hierarchy:
    - TP sessions: parent_session_id = NULL (root)
    - Specialist sessions: parent_session_id = TP session ID (children)

    Lifecycle:
    - TP session created on first project interaction
    - Specialist sessions created on-demand when TP first delegates
    - All sessions persist for project lifetime
    - Specialist sessions accumulate conversation history across work_requests
    """

    id: Optional[str] = None
    workspace_id: str
    basket_id: str
    agent_type: str  # "thinking_partner" | "research" | "content" | "reporting"

    # Hierarchical session management (NEW)
    parent_session_id: Optional[str] = None
    created_by_session_id: Optional[str] = None

    # Claude SDK session
    sdk_session_id: Optional[str] = None
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)

    # Metadata
    state: Dict[str, Any] = Field(default_factory=dict)
    last_active_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    created_by_user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
```

---

## Implementation Pattern

### TP Creates and Manages Specialist Sessions

```python
class ThinkingPartnerAgentSDK:
    def __init__(self, basket_id: str, workspace_id: str, user_id: str):
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.user_id = user_id

        # Create or resume TP session (root)
        self.current_session = await AgentSession.get_or_create(
            basket_id=basket_id,
            workspace_id=workspace_id,
            agent_type="thinking_partner",
            user_id=user_id
        )

        # TP tracks specialist sessions (created on-demand)
        self._specialist_sessions = {
            "research": None,
            "content": None,
            "reporting": None
        }

        # Load existing specialist sessions if they exist
        await self._load_specialist_sessions()

    async def _load_specialist_sessions(self):
        """Load existing specialist sessions that are children of TP session."""
        from app.utils.supabase import supabase_admin
        supabase = supabase_admin()

        # Query for child sessions
        result = supabase.table("agent_sessions").select("*").eq(
            "parent_session_id", self.current_session.id
        ).execute()

        for session_data in result.data:
            agent_type = session_data["agent_type"]
            if agent_type in self._specialist_sessions:
                self._specialist_sessions[agent_type] = AgentSession(**session_data)
                logger.info(
                    f"Loaded existing {agent_type} session: {session_data['id']}"
                )

    async def _get_or_create_specialist_session(
        self,
        agent_type: str
    ) -> AgentSession:
        """
        Get or create persistent specialist session as child of TP.

        This ensures specialists maintain conversation continuity within project.
        """
        # Check if session already exists
        if self._specialist_sessions[agent_type]:
            logger.info(f"Reusing existing {agent_type} session")
            return self._specialist_sessions[agent_type]

        # Create new specialist session as child of TP
        logger.info(f"Creating new {agent_type} session (child of TP)")

        specialist_session = await AgentSession.get_or_create(
            basket_id=self.basket_id,
            workspace_id=self.workspace_id,
            agent_type=agent_type,
            user_id=self.user_id
        )

        # Link to TP as parent (via database update)
        from app.utils.supabase import supabase_admin
        supabase = supabase_admin()

        supabase.table("agent_sessions").update({
            "parent_session_id": self.current_session.id,
            "created_by_session_id": self.current_session.id
        }).eq("id", specialist_session.id).execute()

        # Update local state
        specialist_session.parent_session_id = self.current_session.id
        specialist_session.created_by_session_id = self.current_session.id

        # Cache for future delegations
        self._specialist_sessions[agent_type] = specialist_session

        return specialist_session

    async def _delegate_to_specialist(
        self,
        agent_type: str,
        task: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Delegate work to specialist with persistent session.

        TP coordinates specialist session lifecycle:
        1. Get or create specialist session (child of TP)
        2. Pass session to specialist agent
        3. Specialist resumes conversation with Claude
        4. Specialist executes work and returns outputs
        5. TP synthesizes outputs in its own session
        """
        # Get or create specialist session
        specialist_session = await self._get_or_create_specialist_session(agent_type)

        # Create work_request (links to TP session)
        work_request_id = await self._create_work_request(
            agent_session_id=self.current_session.id,  # TP session
            request_type=agent_type,
            parameters={"task": task}
        )

        # Create work_ticket (links to work_request AND specialist session)
        work_ticket_id = await self._create_work_ticket(
            work_request_id=work_request_id,
            agent_type=agent_type,
            agent_session_id=specialist_session.id  # Specialist session!
        )

        # Create specialist agent with persistent session
        if agent_type == "research":
            agent = ResearchAgentSDK(
                basket_id=self.basket_id,
                workspace_id=self.workspace_id,
                work_ticket_id=work_ticket_id,
                session=specialist_session,  # Pass persistent session
                memory=self.memory  # TP grants memory access
            )
            result = await agent.deep_dive(
                topic=task,
                claude_session_id=specialist_session.sdk_session_id
            )

        elif agent_type == "content":
            agent = ContentAgentSDK(
                basket_id=self.basket_id,
                workspace_id=self.workspace_id,
                work_ticket_id=work_ticket_id,
                session=specialist_session,
                memory=self.memory
            )
            result = await agent.create(
                platform=context.get("platform", "linkedin"),
                topic=task,
                claude_session_id=specialist_session.sdk_session_id
            )

        elif agent_type == "reporting":
            agent = ReportingAgentSDK(
                basket_id=self.basket_id,
                workspace_id=self.workspace_id,
                work_ticket_id=work_ticket_id,
                session=specialist_session,
                memory=self.memory
            )
            result = await agent.generate(
                report_type=context.get("report_type", "analysis"),
                claude_session_id=specialist_session.sdk_session_id
            )

        # Specialist's session is updated (sdk_session_id, conversation_history)
        # TP logs delegation in its own session
        self.current_session.state.setdefault("delegations", []).append({
            "agent_type": agent_type,
            "work_ticket_id": work_ticket_id,
            "specialist_session_id": specialist_session.id,
            "timestamp": datetime.utcnow().isoformat()
        })

        return result
```

---

## Specialist Agent Updates

### Specialist Receives Session from TP

```python
class ResearchAgentSDK:
    def __init__(
        self,
        basket_id: str,
        workspace_id: str,
        work_ticket_id: str,
        session: Optional[AgentSession] = None,  # NEW: Receive from TP
        memory: Optional[SubstrateMemoryAdapter] = None,  # NEW: Receive from TP
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5"
    ):
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.work_ticket_id = work_ticket_id

        # Use session from TP if provided, otherwise create (backward compat)
        if session:
            logger.info(f"Using session provided by TP: {session.id}")
            self.current_session = session
        else:
            logger.warning("No session provided - creating standalone (legacy)")
            self.current_session = await AgentSession.get_or_create(
                basket_id=basket_id,
                workspace_id=workspace_id,
                agent_type="research",
                user_id=workspace_id
            )

        # Use memory from TP if provided, otherwise create (backward compat)
        if memory:
            logger.info("Using memory adapter from TP")
            self.memory = memory
        else:
            logger.warning("No memory provided - creating standalone (legacy)")
            self.memory = SubstrateMemoryAdapter(basket_id, workspace_id)

        # API key and model
        self.api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        self.model = model

        # Create MCP server with context
        shared_tools = create_shared_tools_server(
            basket_id=basket_id,
            work_ticket_id=work_ticket_id,
            agent_type="research"
        )

        self._options = ClaudeAgentOptions(
            model=self.model,
            system_prompt=self._build_system_prompt(),
            mcp_servers={"shared_tools": shared_tools},
            allowed_tools=[
                "mcp__shared_tools__emit_work_output",
                "web_search"
            ],
            max_tokens=8000
        )
```

---

## Work Request & Work Ticket Schema

### Link to Sessions

```sql
-- work_requests links to TP session
ALTER TABLE work_requests
ADD COLUMN agent_session_id UUID REFERENCES agent_sessions(id);

COMMENT ON COLUMN work_requests.agent_session_id IS
'FK to TP agent_session. Tracks which TP session created this work request.';

-- work_tickets links to specialist session
ALTER TABLE work_tickets
ADD COLUMN agent_session_id UUID REFERENCES agent_sessions(id);

COMMENT ON COLUMN work_tickets.agent_session_id IS
'FK to specialist agent_session. Tracks which specialist session executed this work.';
```

### Relational Model

```
agent_sessions (TP session)
  ↓ 1:N
work_requests (user asks TP)
  ↓ 1:N
work_tickets (specialist executions)
  ↓ N:1
agent_sessions (specialist sessions)
```

**Query Pattern**: "Show me all work done by Research agent in this project"
```sql
SELECT wt.*, wo.*
FROM work_tickets wt
JOIN agent_sessions s ON wt.agent_session_id = s.id
LEFT JOIN work_outputs wo ON wo.work_ticket_id = wt.id
WHERE s.basket_id = 'basket_abc'
  AND s.agent_type = 'research'
ORDER BY wt.created_at DESC;
```

---

## Benefits of Hierarchical Sessions

### 1. Conversation Continuity
```python
# First delegation
User → TP: "Research AI pricing models"
TP → Research Agent (creates session)
Research → Returns findings

# Later: Refinement
User → TP: "Add more detail on enterprise pricing"
TP → Research Agent (RESUMES SAME SESSION)
Research (remembers previous work): "I found earlier that..."
```

### 2. Context Accumulation
- Research agent builds up domain expertise across multiple work requests
- Content agent learns user's voice and preferences over time
- Reporting agent understands data patterns from previous reports

### 3. Session Audit Trail
```python
# Query: "What work has this project's research agent done?"
specialist_session = get_session(basket_id, agent_type="research")
work_tickets = get_tickets_by_session(specialist_session.id)
# Shows all research work across all work_requests
```

### 4. Clean Lifecycle Management
- Sessions created on-demand (lazy initialization)
- Sessions persist for project lifetime
- Sessions deleted when project deleted (CASCADE)

---

## Migration Path

### Phase 1: Schema Migration
1. Add `parent_session_id` column (nullable)
2. Add `created_by_session_id` column (nullable)
3. Add indexes and constraints
4. Deploy schema changes

### Phase 2: Code Migration
1. Update `AgentSession` model with new fields
2. Update `ThinkingPartnerAgentSDK` with session coordination
3. Update specialist agents to accept session parameter
4. Update `work_orchestration` to link sessions

### Phase 3: Data Migration (Optional)
- Existing agent_sessions remain independent (parent_session_id = NULL for all)
- New sessions follow hierarchical pattern
- Gradual migration as users interact with TP

### Phase 4: Validation
- Test TP → specialist delegation with session persistence
- Test specialist session resumption across work_requests
- Monitor session creation and reuse

---

## Testing Strategy

### Unit Tests
```python
async def test_specialist_session_creation():
    """Test that TP creates specialist sessions as children."""
    tp = ThinkingPartnerAgentSDK(basket_id="test", workspace_id="ws", user_id="u1")

    # First delegation creates session
    session1 = await tp._get_or_create_specialist_session("research")
    assert session1.parent_session_id == tp.current_session.id

    # Second delegation reuses session
    session2 = await tp._get_or_create_specialist_session("research")
    assert session1.id == session2.id

async def test_session_hierarchy_query():
    """Test querying child sessions."""
    tp = ThinkingPartnerAgentSDK(...)

    # Create multiple specialist sessions
    await tp._get_or_create_specialist_session("research")
    await tp._get_or_create_specialist_session("content")

    # Query children
    children = query_child_sessions(tp.current_session.id)
    assert len(children) == 2
    assert set([s.agent_type for s in children]) == {"research", "content"}
```

### Integration Tests
```python
async def test_end_to_end_session_persistence():
    """Test that specialist sessions persist across work_requests."""
    tp = ThinkingPartnerAgentSDK(...)

    # First work request
    result1 = await tp.chat("Research AI pricing")
    research_session_id1 = tp._specialist_sessions["research"].id

    # Second work request (should reuse session)
    result2 = await tp.chat("Add more pricing details")
    research_session_id2 = tp._specialist_sessions["research"].id

    assert research_session_id1 == research_session_id2
    # Specialist remembered context from first request
```

---

## Open Questions & Future Considerations

### 1. Session Garbage Collection
**Question**: When to delete specialist sessions?
**Options**:
- A: Never (persist forever with project)
- B: After N days of inactivity
- C: User-initiated cleanup
**Recommendation**: Option A (simple, storage is cheap)

### 2. Session Forking
**Question**: Should users be able to fork specialist sessions for experimentation?
**Use Case**: "Try different research approaches without losing original"
**Decision**: Defer to future (add fork_from_session_id if needed)

### 3. Cross-Session Learning
**Question**: Should research from Project A inform research in Project B?
**Decision**: No - sessions are project-scoped for privacy/isolation

---

**Status**: Architecture defined, ready for implementation.
**Next**: Create schema migration and update agent code.
