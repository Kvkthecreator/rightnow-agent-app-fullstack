# Run Migration 005: Enhanced Work Session Fields

## What This Migration Does

Adds Phase 1 agent execution fields to `work_sessions` table:

1. **task_configuration** (JSONB) - Agent-specific configs (research_scope, content_spec, report_spec)
2. **task_document_id** (UUID) - Link to P4 context envelope document in substrate
3. **approval_strategy** (TEXT) - Checkpoint strategy (checkpoint_required/final_only/auto_approve_low_risk)
4. **project_agent_id** (UUID) - Link to project_agents table
5. **agent_work_request_id** (UUID) - Link to billing/trial tracking

## Prerequisites

✅ Migration 004b (drop/recreate work platform) must be run first
✅ `project_agents` table must exist

## How to Run

### Option 1: Supabase Dashboard (Recommended for Production)

1. Go to Supabase project dashboard: https://supabase.com/dashboard/project/galytxxkrbksilekmhcw
2. Navigate to **SQL Editor**
3. Copy the contents of `005_add_enhanced_work_session_fields.sql`
4. Paste into SQL editor
5. Click **Run**
6. Check the verification queries at the bottom show the new columns

### Option 2: Local Script

```bash
# From work-platform/api directory
cd /Users/macbook/yarnnn-app-fullstack/work-platform/api

# Run migration
psql "$PG_DUMP_URL" -f migrations/005_add_enhanced_work_session_fields.sql
```

## Verification

After running, verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'work_sessions'
ORDER BY ordinal_position;
```

You should see the new columns:
- `task_configuration` (jsonb, nullable)
- `task_document_id` (uuid, nullable)
- `approval_strategy` (text, nullable, default 'final_only')
- `project_agent_id` (uuid, nullable)
- `agent_work_request_id` (uuid, nullable)

## What You Can Test After Migration

Once this migration runs, you can test **end-to-end work request creation**:

1. ✅ Click agent card on project overview
2. ✅ Fill in agent-specific configuration form
3. ✅ Submit work request
4. ✅ Work session created with:
   - `task_configuration` → your form data
   - `task_document_id` → UUID of generated context envelope
   - `approval_strategy` → selected strategy
   - `status` → 'initialized'
5. ✅ Redirect to work session detail page

**What WON'T work yet (Phase 2):**
- ❌ Agent execution (status stays 'initialized')
- ❌ Checkpoint pausing
- ❌ Work output generation
- ❌ Approval workflows

## Rollback (if needed)

```sql
ALTER TABLE work_sessions
DROP COLUMN IF EXISTS task_configuration,
DROP COLUMN IF EXISTS task_document_id,
DROP COLUMN IF EXISTS approval_strategy,
DROP COLUMN IF EXISTS project_agent_id,
DROP COLUMN IF EXISTS agent_work_request_id;
```
