# URGENT: Database Fix Required for TP Chat

## Problem
TP chat is **completely broken** in production due to database constraint violation.

**Error**: `agent_sessions_agent_type_check` constraint does NOT include `'thinking_partner'`

**Impact**: Every TP chat request fails with 500 error when trying to create agent session.

---

## Root Cause Timeline

1. **Phase 2e Migration** (Nov 19, applied): Created agent_sessions table with constraint:
   ```sql
   CHECK (agent_type IN ('research', 'content', 'reporting'))
   ```

2. **Hierarchical Sessions** (Nov 21, deployed): TP code tries to create sessions with `agent_type='thinking_partner'`

3. **Migration Not Applied** (Nov 20-21, created but not applied): Two migration files exist but neither applied to production database:
   - `20251120_add_thinking_partner_agent_type.sql`
   - `20251121_add_thinking_partner_to_agent_type.sql`

---

## Solution: Apply Migration via Supabase Dashboard

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select project: **galytxxkrbksilekmhcw**
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### Step 2: Run Migration SQL

Copy and paste this SQL:

```sql
-- Migration: Add 'thinking_partner' to agent_type constraint
-- Purpose: Fix blocking error preventing TP chat from working
-- Date: 2025-11-21
-- Issue: Phase 2e migration only allowed ('research', 'content', 'reporting')
--        but TP needs agent_type='thinking_partner'

BEGIN;

-- Drop existing constraint
ALTER TABLE agent_sessions
  DROP CONSTRAINT IF EXISTS agent_sessions_agent_type_check;

-- Add new constraint with thinking_partner included
ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_agent_type_check
  CHECK (agent_type IN ('research', 'content', 'reporting', 'thinking_partner'));

-- Add comment
COMMENT ON CONSTRAINT agent_sessions_agent_type_check ON agent_sessions IS
  'Valid agent types: research, content, reporting, thinking_partner (meta-agent)';

COMMIT;

-- Verify constraint was applied
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'agent_sessions_agent_type_check';
```

### Step 3: Verify Result

You should see output like:
```
conname                          | pg_get_constraintdef
---------------------------------|--------------------------------------------------
agent_sessions_agent_type_check  | CHECK ((agent_type = ANY (ARRAY['research'::text, 'content'::text, 'reporting'::text, 'thinking_partner'::text])))
```

### Step 4: Test TP Chat

1. Go to https://www.yarnnn.com
2. Open a project
3. Try sending a message in TP chat
4. Should complete successfully (no more "Processing..." stuck state)

---

## Expected Log Changes After Fix

### Before Fix (Current State)
```
TP chat failed: AgentSession.get_or_create failed:
  'message': 'new row violates check constraint "agent_sessions_agent_type_check"'
INFO: POST /api/tp/chat HTTP/1.1 500 Internal Server Error
```

### After Fix (Expected)
```
INFO: TP chat: user=..., basket=..., message=...
INFO: TP chat complete: XXX chars, 0 outputs, X actions
INFO: POST /api/tp/chat HTTP/1.1 200 OK
```

---

## Alternative: Use Migration Files

If you prefer to track this as a migration file:

**Option 1**: Delete both existing files and use the SQL above directly
**Option 2**: Apply one of the existing migrations via Supabase migration tool

Existing migrations (pick ONE):
- `supabase/migrations/20251120_add_thinking_partner_agent_type.sql` (longer, with comments)
- `supabase/migrations/20251121_add_thinking_partner_to_agent_type.sql` (shorter)

---

## Secondary Issue: Substrate API 401 Errors

**Status**: NOT BLOCKING (TP works without substrate context)

After the primary fix is applied, we'll investigate why substrate-API is returning 401 errors. This prevents TP from loading context but doesn't block basic chat functionality.

**Symptoms**:
- Circuit breaker opens after 5 401 failures
- TP executes without substrate context
- Chat completes but with limited context

**Next Steps** (after DB fix):
1. Check if `user_token` is being extracted correctly
2. Verify JWT format matches substrate-API expectations
3. Test substrate-API auth directly

---

## Deployment Status

**Last Deployed**: f9789aa8 (Nov 21, 16:17 GMT+9 = 07:17 UTC)
- Commit: "Fix: Improve error handling for TP chat and staging queries"
- Code is correct (Claude SDK parameters fixed)
- Only missing: Database migration

**Render Service**: srv-d4duig9r0fns73bbtl4g
**Render URL**: https://yarnnn-app-fullstack.onrender.com
**Frontend**: https://www.yarnnn.com

---

**URGENCY**: HIGH - TP chat completely non-functional until this migration is applied

**ETA**: 5 minutes to apply migration + test

**Risk**: LOW - Migration only adds value to constraint, doesn't change data
