# Project Scaffolding Refactor - Pre-Scaffolded Agent Sessions

**Date**: 2025-11-22
**Status**: Implemented (Ready for Commit)

---

## Summary

Refactored project scaffolder to **pre-scaffold ALL agent sessions** (TP + 3 specialists) during project creation, replacing legacy `project_agents` table approach with modern `agent_sessions` architecture.

---

## What Changed

### **Before** (Legacy - Phase 6)
```python
# Created 3 records in project_agents table
agent_types = ["research", "content", "reporting"]
agents_data = [
    {
        "project_id": project_id,
        "agent_type": agent_type,
        "display_name": f"{agent_type.title()} Agent",
        "is_active": True
    }
    for agent_type in agent_types
]
supabase_admin_client.table("project_agents").insert(agents_data).execute()
```

**Problems**:
- `project_agents` = UI metadata only (not execution)
- `agent_sessions` = Actual execution (created on-demand later)
- Dual approaches = Confusion, technical debt
- No hierarchical structure upfront

---

### **After** (New - Phase 6.5)
```python
# Pre-scaffold 4 agent sessions (TP + specialists)
from yarnnn_agents.session import AgentSession

# Step 5.1: Create TP session (root)
tp_session = await AgentSession.get_or_create(
    basket_id=basket_id,
    workspace_id=workspace_id,
    agent_type="thinking_partner",
    user_id=user_id,
)

# Step 5.2: Pre-create specialist sessions (children)
for agent_type in ["research", "content", "reporting"]:
    specialist = await AgentSession.get_or_create(
        basket_id=basket_id,
        workspace_id=workspace_id,
        agent_type=agent_type,
        user_id=user_id,
    )
    # Link as child of TP
    specialist.parent_session_id = tp_session.id
    specialist.created_by_session_id = tp_session.id
    await update_in_database()
```

**Benefits**:
- ✅ Single source of truth (`agent_sessions` only)
- ✅ Hierarchical structure from day 1 (TP parent → specialists children)
- ✅ No cold-start penalty (sessions ready immediately)
- ✅ Enables future dual-path architecture (direct invocation OR TP orchestration)
- ✅ Aligns with Phase 2e architecture (agent_sessions, hierarchical sessions)

---

## Architecture

### Hierarchical Session Tree

```
agent_sessions table:
┌──────────────────────────────────────┐
│ TP Session (root)                    │
│ - id: xxx                             │
│ - agent_type: "thinking_partner"     │
│ - parent_session_id: NULL            │
│ - basket_id: basket_123              │
└──────────────────────────────────────┘
          ↓ (parent)
┌──────────────────────────────────────┐
│ Research Session (child)             │
│ - id: yyy                             │
│ - agent_type: "research"             │
│ - parent_session_id: xxx (TP)        │
│ - created_by_session_id: xxx         │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Content Session (child)              │
│ - id: zzz                             │
│ - agent_type: "content"              │
│ - parent_session_id: xxx (TP)        │
│ - created_by_session_id: xxx         │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Reporting Session (child)            │
│ - id: aaa                             │
│ - agent_type: "reporting"            │
│ - parent_session_id: xxx (TP)        │
│ - created_by_session_id: xxx         │
└──────────────────────────────────────┘
```

### Database Impact

**Sessions Created Per Project**:
- Before: 1 TP session (on first chat) + specialists (on-demand)
- After: 4 sessions upfront (TP + 3 specialists)

**Storage Impact**:
- ~4 rows per project in `agent_sessions` table
- Minimal overhead (each row ~1KB with metadata)
- Trade-off: Upfront cost for predictable performance

---

## Files Modified

### Primary Changes

**1. [project_scaffolder.py](work-platform/api/src/services/project_scaffolder.py)**
- Lines 1-22: Updated docstring with new architecture description
- Lines 63-71: Updated flow documentation
- Lines 86-91: Changed return type (`agent_ids` → `agent_session_ids`)
- Lines 111: Changed variable (`agent_ids` → `agent_session_ids`)
- Lines 145: Updated basket metadata (`auto_scaffolded_agents` → `auto_scaffolded_sessions`)
- Lines 218: Updated project metadata (same change)
- Lines 246-325: **REPLACED** Step 5 (project_agents creation → agent_sessions pre-scaffolding)
- Lines 360-375: Updated return statement with session IDs

### Step 5 Implementation Details

**Old Code** (Deleted ~40 lines):
```python
# Create all 3 agent types in project_agents table
agent_types = ["research", "content", "reporting"]
agents_data = [...]
agent_response = supabase_admin_client.table("project_agents").insert(agents_data)
agent_ids = [agent["id"] for agent in agent_response.data]
```

**New Code** (Added ~70 lines):
```python
# Step 5.1: Create TP session (root)
tp_session = await AgentSession.get_or_create(...)
agent_session_ids["thinking_partner"] = tp_session.id

# Step 5.2: Pre-create specialist sessions (children)
for agent_type in ["research", "content", "reporting"]:
    specialist_session = await AgentSession.get_or_create(...)

    # Link as child of TP session
    if not specialist_session.parent_session_id:
        specialist_session.parent_session_id = tp_session.id
        specialist_session.created_by_session_id = tp_session.id
        # Update in database
        supabase_admin_client.table("agent_sessions").update({...})

    agent_session_ids[agent_type] = specialist_session.id
```

---

## Testing

### Validation Performed

✅ **Python Syntax**: `python3 -m py_compile` passed
✅ **Code Review**: All imports, async patterns, error handling verified
✅ **Logic Review**: Hierarchical linking logic validated

### Manual Testing Required

- [ ] Create new project via API
- [ ] Verify 4 agent_sessions created in database
- [ ] Verify TP session has `parent_session_id=NULL`
- [ ] Verify specialist sessions have `parent_session_id=<TP.id>`
- [ ] Test direct agent invocation (use pre-scaffolded session)
- [ ] Test TP chat orchestration (use pre-scaffolded sessions)

### Test Script Created

**File**: `work-platform/api/test_project_scaffolder.py`
- Validates project creation
- Checks session IDs returned
- Queries database to verify hierarchical structure
- (Requires environment variables to run)

---

## Response Format Change

### API Response Schema

**Before**:
```json
{
  "project_id": "...",
  "basket_id": "...",
  "dump_id": "...",
  "agent_ids": ["id1", "id2", "id3"],  // project_agents IDs
  "work_request_id": "..."
}
```

**After**:
```json
{
  "project_id": "...",
  "basket_id": "...",
  "dump_id": "...",
  "agent_session_ids": {
    "thinking_partner": "session_id_1",
    "research": "session_id_2",
    "content": "session_id_3",
    "reporting": "session_id_4"
  },
  "work_request_id": "..."
}
```

**Frontend Impact**:
- Any code consuming `agent_ids` must be updated to use `agent_session_ids`
- Structure changed from array to object for clearer agent type mapping

---

## Migration Notes

### Breaking Changes

**API Response**: `agent_ids` field removed, replaced with `agent_session_ids`

**Frontend Required Changes**:
```typescript
// Before
const agentIds = response.agent_ids; // ["id1", "id2", "id3"]

// After
const sessionIds = response.agent_session_ids; // { thinking_partner: "...", research: "...", ... }
const tpSessionId = sessionIds.thinking_partner;
const researchSessionId = sessionIds.research;
```

### Backwards Compatibility

- ✅ Existing projects with old `project_agents` records: Unaffected
- ✅ Existing agent_sessions: Unaffected
- ⚠️ New projects: Will use new pre-scaffolding approach
- ❌ API consumers: Must handle new response format

---

## Future Architecture Enablement

This change enables **dual-path architecture** (future):

### Path 1: TP Chat (Guided)
```
User: "Research AI competitors"
  ↓
TP Chat (uses pre-scaffolded TP session)
  ↓
TP orchestrates via work_orchestration
  ↓
Specialist executes (uses pre-scaffolded research session)
  ↓
Response synthesized by TP
```

### Path 2: Direct Invocation (Power Users)
```
User: Clicks "Research Agent" card
  ↓
POST /api/work-requests/create { agent_type: "research", task: "..." }
  ↓
Backend uses pre-scaffolded research session directly
  ↓
Specialist executes (no TP intermediary)
  ↓
Outputs shown directly
```

**Both paths benefit from pre-scaffolded sessions** (no cold-start penalty)

---

## Rollback Plan

If issues arise:

1. Revert [project_scaffolder.py](work-platform/api/src/services/project_scaffolder.py) to previous commit
2. No database migration needed (sessions are additive, not destructive)
3. Existing sessions remain valid
4. Frontend can continue using old response format from older projects

---

## Next Steps

1. ✅ **Code Complete**: Implementation finished
2. ⏸️ **Commit**: Ready to commit and push
3. ⏸️ **Deploy**: Deploy to staging/production
4. ⏸️ **Test**: Manual validation in deployed environment
5. ⏸️ **Monitor**: Watch logs for session creation success
6. ⏸️ **Separate Discussion**: TP vs Direct orchestration architecture (deferred)

---

## Decision Rationale

**Why Pre-Scaffold?**

1. **Performance**: No cold-start penalty (sessions ready immediately)
2. **Predictability**: All infrastructure created upfront (easier debugging)
3. **Flexibility**: Enables future dual-path (TP chat OR direct invocation)
4. **Alignment**: Matches current architecture (Phase 2e hierarchical sessions)
5. **UX**: Can show "4 agents ready" from day 1 in UI

**Why Not Lazy-Load?**

- Lazy-loading saves ~3 DB rows per project (minimal benefit)
- First-delegation latency penalty (~100-200ms)
- Less visibility in UI (agents appear over time)
- Trade-off not worth it given user expectations

---

**Summary**: Pre-scaffolding is optimal for user experience, performance predictability, and future architecture flexibility. Small upfront cost (4 DB rows) for significant benefits.
