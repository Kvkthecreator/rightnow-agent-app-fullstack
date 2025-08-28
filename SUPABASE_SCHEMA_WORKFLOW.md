# Supabase Schema Management Workflow

## Quick Reference for Schema Changes

### 1. **Create Migration File**
```bash
# Create new migration file in supabase/migrations/
# Format: YYYYMMDD_description.sql
touch supabase/migrations/$(date +%Y%m%d_%H%M%S)_your_change_description.sql
```

### 2. **Execute Migration**
Try these methods in order:

**Method A: Supabase CLI (preferred)**
```bash
npx supabase db push
```

**Method B: Direct psql (if CLI fails)**
```bash
psql "postgresql://postgres.galytxxkrbksilekmhcw:4ogIUdwWzVyPH0nU@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require" \
  -f supabase/migrations/YYYYMMDD_your_migration.sql
```

**Method C: Supabase Dashboard SQL Editor**
Copy migration contents and paste into dashboard SQL editor.

### 3. **Update Schema Snapshot**
```bash
# Run the pg_dump script to update schema snapshot
./scripts/dump_schema.sh
```

### 4. **Verify Changes**
```bash
# Check that SCHEMA_SNAPSHOT.sql was updated
git diff docs/SCHEMA_SNAPSHOT.sql
```

## Current RLS Status (from audit)

### Tables WITH RLS:
- ✅ `agent_processing_queue`
- ✅ `baskets` 
- ✅ `basket_events`
- ✅ `block_revisions`
- ✅ `reflection_cache`
- ✅ `revisions`
- ✅ `substrate_references`
- ✅ `timeline_events`
- ✅ `workspace_memberships`
- ✅ `workspaces`

### Tables MISSING RLS (workspace-scoped):
- ❌ `blocks`
- ❌ `context_items` 
- ❌ `documents`
- ❌ `events`
- ❌ `narrative`
- ❌ `raw_dumps` (has service_role policies but no workspace RLS)

### Tables MISSING proper workspace policies:
- ⚠️ `events` (has RLS but user-scoped, not workspace-scoped)

## Canon Violation: Missing Workspace Isolation

The failing tests indicate these tables allow cross-workspace data access:
1. `blocks` - No RLS at all
2. `context_items` - No RLS at all  
3. `documents` - No RLS at all
4. `events` - User-scoped instead of workspace-scoped
5. `narrative` - No RLS at all
6. `raw_dumps` - Only service_role policies

This violates YARNNN Canon Principle: "Workspace Isolation" - Complete data isolation between workspaces.