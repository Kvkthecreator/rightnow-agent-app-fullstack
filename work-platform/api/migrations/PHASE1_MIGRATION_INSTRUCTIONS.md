# Phase 1: Work Platform Migration Instructions

## Issue

The work platform tables (`projects`, `work_sessions`, `work_artifacts`, `work_checkpoints`) already exist from Phase 6 with a different schema. The Phase 1 schema is simplified and incompatible with the Phase 6 schema.

## Solution

Run migration [004b_drop_recreate_work_platform.sql](004b_drop_recreate_work_platform.sql) to drop the old tables and create the new Phase 1 schema.

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `004b_drop_recreate_work_platform.sql`
4. Paste into the SQL editor
5. Click **Run**

### Option 2: Local psql (if you have PostgreSQL client installed)

```bash
# Using the connection string from scripts/dump_schema.sh
psql "postgresql://postgres.galytxxkrbksilekmhcw:4ogIUdwWzVyPH0nU@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require" -f migrations/004b_drop_recreate_work_platform.sql
```

### Option 3: Python Script (if local scripts hang)

The provided Python scripts (`run_migration_004b.py`, etc.) may hang due to asyncpg connection pooling issues with Supabase's pgbouncer.

## What the Migration Does

1. **Drops** existing Phase 6 tables:
   - `work_checkpoints`
   - `work_artifacts`
   - `work_sessions`
   - `projects`

2. **Creates** new Phase 1 simplified schema:
   - **projects**: Work containers (1:1 with baskets)
   - **work_sessions**: Work requests with JSONB task_parameters
   - **work_artifacts**: Agent outputs with review status
   - **work_checkpoints**: User review pause points

3. **Creates** indexes for performance
4. **Creates** update trigger for `projects.updated_at`

## Verification

After running the migration, verify the tables exist:

```sql
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'work_sessions', 'work_artifacts', 'work_checkpoints')
ORDER BY table_name;
```

Expected column counts:
- **projects**: 8 columns
- **work_sessions**: 13 columns
- **work_artifacts**: 10 columns
- **work_checkpoints**: 9 columns

## Schema Differences (Phase 6 → Phase 1)

### projects Table
**Removed columns:**
- `user_id` (renamed to `created_by_user_id`)
- `project_type`
- `status`
- `origin_template`
- `onboarded_at`
- `archived_at`
- `metadata`

**New columns:**
- `created_by_user_id` (replaces `user_id`)

### work_sessions Table
**Removed columns:**
- `agent_session_id`
- `task_document_id`
- `approval_strategy`
- `confidence_threshold`
- `reasoning_trail`
- `context_snapshot`
- `artifacts_count`
- `substrate_mutations_count`
- `updated_at`

**New columns:**
- `task_parameters` (JSONB - flexible params)
- `metadata` (JSONB - execution metadata)

### work_artifacts Table
**Removed columns:**
- `checkpoint_id`
- `becomes_block_id`
- `supersedes_block_id`
- `creates_document_id`
- `external_url`
- `external_type`
- `source_context_ids`
- `risk_level`
- `risk_factors`
- `review_decision`
- `applied_at`
- `metadata`

**Simplified columns:**
- Basic review fields only (reviewed_by, reviewed_at, review_feedback)

### work_checkpoints Table
**Removed columns:**
- `checkpoint_sequence`
- `review_scope`
- `artifacts_at_checkpoint`
- `agent_confidence`
- `agent_reasoning`
- `agent_summary`
- `user_feedback`
- `changes_requested`
- `risk_level`
- `risk_factors`

**New columns:**
- `reason` (simple text explanation)
- `metadata` (JSONB for future extensibility)

## Phase 1 Design Philosophy

Phase 1 focuses on:
- ✅ Project & work session management
- ✅ Task parameter validation
- ✅ Artifact & checkpoint tracking
- ✅ Basic review workflows
- ⏸️ **Substrate application deferred to Phase 2**
- ⏸️ **Complex governance deferred to Phase 2**

The schema is intentionally simplified to enable rapid iteration and clear separation of concerns.
