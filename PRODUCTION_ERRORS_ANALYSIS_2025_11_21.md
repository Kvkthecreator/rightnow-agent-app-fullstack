# Production Error Analysis - Nov 21, 2025

## Status: CRITICAL - Multiple blocking issues identified

**User Impact**: TP chat stuck in "Processing..." loop. Backend returning 500 errors disguised as 200 OK responses.

---

## Error 1: Database Constraint Violation (BLOCKING)

### Error Message
```
postgrest.exceptions.APIError: {
  'message': 'new row for relation "agent_sessions" violates check constraint "agent_sessions_agent_type_check"',
  'code': '23514',
  'details': 'Failing row contains (..., thinking_partner, ...)'
}
```

### Root Cause
The `agent_sessions` table CHECK constraint does NOT include `'thinking_partner'` as a valid agent_type.

Phase 2e migration (`20251119_phase2e_agent_sessions_refactor.sql:27`) created constraint with only:
```sql
CHECK (agent_type IN ('research', 'content', 'reporting'))
```

But TP code tries to create sessions with `agent_type='thinking_partner'`.

### Evidence
**Code**: [thinking_partner_sdk.py:255-288](work-platform/api/src/agents_sdk/thinking_partner_sdk.py#L255-L288)
```python
self.current_session = await AgentSession.get_or_create(
    basket_id=basket_id,
    workspace_id=workspace_id,
    agent_type="thinking_partner",  # ❌ NOT in constraint!
    user_id=user_id
)
```

**Database**: Phase 2e migration line 27
```sql
agent_type TEXT NOT NULL CHECK (agent_type IN ('research', 'content', 'reporting')),
```

**Migrations Available** (NOT APPLIED):
1. `20251120_add_thinking_partner_agent_type.sql` - Ready to apply
2. `20251121_add_thinking_partner_to_agent_type.sql` - Duplicate, ready to apply

### Solution
**Apply migration to Supabase dashboard** (either one, they're equivalent):

```sql
ALTER TABLE agent_sessions
  DROP CONSTRAINT IF EXISTS agent_sessions_agent_type_check;

ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_agent_type_check
  CHECK (agent_type IN ('research', 'content', 'reporting', 'thinking_partner'));
```

**Impact**: CRITICAL - Blocks ALL TP chat requests from completing.

---

## Error 2: Claude SDK Parameter Errors (BLOCKING)

### Error Messages
```
TP chat failed: ClaudeAgentOptions.__init__() got unexpected keyword argument 'tools'
TP chat failed: ClaudeAgentOptions.__init__() got unexpected keyword argument 'max_tokens'
TP chat failed: ClaudeSDKClient.__init__() got unexpected keyword argument 'api_key'
```

### Root Cause
Code is using parameters that don't exist in the official Claude Agent SDK v0.1.8+.

### Evidence
**Location**: [thinking_partner_sdk.py:342-357](work-platform/api/src/agents_sdk/thinking_partner_sdk.py#L342-L357)
```python
options = ClaudeAgentOptions(
    model=self.model,
    max_tokens=128000,  # ❌ Not a valid parameter!
    mcp_servers={"shared_tools": shared_tools_server},
    allowed_tools=[
        "mcp__shared_tools__work_orchestration",
        "mcp__shared_tools__query_context"
    ],
    tools=[...]  # ❌ Not a valid parameter (use mcp_servers instead)!
)
```

**ClaudeSDKClient**: [thinking_partner_sdk.py:360](work-platform/api/src/agents_sdk/thinking_partner_sdk.py#L360)
```python
self.client = ClaudeSDKClient(
    api_key=self.api_key,  # ❌ Not a valid parameter!
    options=options
)
```

### Official SDK Signature
From `claude-agent-sdk` v0.1.8+ docs:
```python
class ClaudeAgentOptions:
    def __init__(
        self,
        model: str,
        mcp_servers: Optional[Dict[str, MCPServer]] = None,
        allowed_tools: Optional[List[str]] = None,
        # NO 'tools' parameter!
        # NO 'max_tokens' parameter!
    )

class ClaudeSDKClient:
    def __init__(
        self,
        options: ClaudeAgentOptions,
        # NO 'api_key' parameter!
        # API key comes from ANTHROPIC_API_KEY env var
    )
```

### Solution
**Fix thinking_partner_sdk.py**:

1. Remove `max_tokens` from `ClaudeAgentOptions`
2. Remove `tools` from `ClaudeAgentOptions` (use `mcp_servers` only)
3. Remove `api_key` from `ClaudeSDKClient` (use env var)

```python
options = ClaudeAgentOptions(
    model=self.model,
    mcp_servers={"shared_tools": shared_tools_server},
    allowed_tools=[
        "mcp__shared_tools__work_orchestration",
        "mcp__shared_tools__query_context"
    ]
)

self.client = ClaudeSDKClient(options=options)
```

**Impact**: CRITICAL - Prevents TP from initializing Claude SDK client.

---

## Error 3: Substrate API 401 Unauthorized (HIGH PRIORITY)

### Error Messages
```
ERROR: Substrate API error: HTTP 401 error
ERROR: Circuit breaker: Opening circuit after 5 failures
Substrate-api unavailable, returning empty context. Agent will execute without substrate context.
```

### Root Cause
User JWT token is being passed to substrate-API but not accepted.

### Evidence
**Logs**: Nov 21, 04:47-05:42 (multiple instances)
- 401 errors repeat 3 times per request (circuit breaker pattern)
- Circuit breaker opens after 5 consecutive failures
- TP continues execution without substrate context

### Hypothesis
Either:
1. JWT token extraction failing in `thinking_partner.py`
2. JWT token format incorrect for substrate-API
3. substrate-API auth middleware rejecting valid tokens

### Diagnostic Needed
**Check logs for**: `has_token=True/False` in staging debug messages

Expected in logs (NOT SEEN YET):
```
DEBUG: Staging: Loading substrate blocks for basket=..., has_token=True
```

If `has_token=False` → Problem in JWT extraction
If `has_token=True` + 401 → Problem in substrate-API auth

### Solution (Depends on Diagnostic)
**If JWT extraction failing**:
- Fix `thinking_partner.py:user.get("token")` mapping
- Verify `jwt.py:verify_jwt()` returns correct dict structure

**If substrate-API rejecting token**:
- Check substrate-API auth middleware
- Verify JWT signature/issuer matching
- Check if substrate-API expects different header format

**Impact**: HIGH - Prevents TP from accessing substrate context, but doesn't block chat entirely.

---

## Error 4: Module Import Error (RESOLVED?)

### Error Message (Early logs, Nov 20)
```
ModuleNotFoundError: No module named 'app.routes.agent_orchestration'
```

### Status
This error doesn't appear in recent logs (Nov 21), suggesting it may be resolved by deployment.

---

## Summary: Three Critical Fixes Needed

### Fix 1: Apply Database Migration (IMMEDIATE)
```sql
ALTER TABLE agent_sessions
  DROP CONSTRAINT IF EXISTS agent_sessions_agent_type_check;

ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_agent_type_check
  CHECK (agent_type IN ('research', 'content', 'reporting', 'thinking_partner'));
```

**How**: Apply via Supabase dashboard SQL editor

### Fix 2: Update Claude SDK Parameters (CODE FIX)
**File**: [thinking_partner_sdk.py:342-360](work-platform/api/src/agents_sdk/thinking_partner_sdk.py#L342-L360)

Remove:
- `max_tokens` from `ClaudeAgentOptions`
- `tools` from `ClaudeAgentOptions`
- `api_key` from `ClaudeSDKClient`

### Fix 3: Diagnose Substrate API Auth (INVESTIGATION)
Add enhanced logging to see if `user_token` is being passed correctly.

---

## Timeline of Errors

| Time (UTC) | Error Type | Status |
|------------|------------|--------|
| Nov 20 11:46 | Module import error | Resolved? |
| Nov 20 12:02 | Claude SDK 'tools' param error | ACTIVE |
| Nov 21 04:40 | Claude SDK 'max_tokens' param error | ACTIVE |
| Nov 21 04:43 | Database constraint violation | ACTIVE |
| Nov 21 04:47 | Substrate API 401 errors begin | ACTIVE |
| Nov 21 05:29 | Circuit breaker opens | ACTIVE |
| Nov 21 07:25 | Latest TP chat attempt (200 OK) | Unknown state |

---

## User Impact Analysis

**What user sees**:
- Message sends successfully
- "Processing..." indicator appears
- Message never completes
- Frontend stuck waiting for response

**What actually happens**:
1. Frontend sends POST to `/api/tp/chat`
2. Backend tries to create TP agent session
3. Database rejects `agent_type='thinking_partner'` (constraint violation)
4. Python exception occurs (500 error)
5. Exception handler catches error, logs "TP chat failed"
6. Backend returns generic error response (possibly 200 OK with error in body)
7. Frontend receives malformed response → stuck in "Processing..." state

**localStorage corruption**: Frontend's error handling creates corrupted state that persists across refreshes.

---

## Next Steps (Priority Order)

1. **IMMEDIATE**: Apply database migration via Supabase dashboard
2. **CODE FIX**: Update thinking_partner_sdk.py to remove invalid Claude SDK parameters
3. **DEPLOY**: Push code fix to Render
4. **TEST**: Send simple TP chat message to verify fix
5. **INVESTIGATE**: Substrate API 401 errors (not blocking chat, but prevents context loading)

---

**Last Updated**: Nov 21, 2025 (after Render log analysis)
**Deployment**: yarnnn-app-fullstack.onrender.com (srv-d4duig9r0fns73bbtl4g)
**Frontend**: www.yarnnn.com
