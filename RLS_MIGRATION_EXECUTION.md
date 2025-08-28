# RLS Migration Execution Steps

## Migration File Created
`supabase/migrations/20250828_fix_workspace_isolation_rls.sql`

## Manual Execution Steps

Since we can't run `supabase db push` directly here, follow these steps:

### 1. Execute Migration in Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/galytxxkrbksilekmhcw/sql
2. Copy the entire contents of `20250828_fix_workspace_isolation_rls.sql`
3. Paste into SQL Editor and run
4. Verify no errors in execution

### 2. Update Schema Snapshot
```bash
# After migration executes successfully
./scripts/dump_schema.sh
```

### 3. Verify RLS Policies Applied
Run this verification query in Supabase SQL editor:

```sql
-- Check RLS enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('baskets', 'blocks', 'context_items', 'documents', 'raw_dumps', 'events', 'narrative', 'timeline_events')
ORDER BY tablename;

-- Check workspace isolation policies exist
SELECT schemaname, tablename, policyname, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%workspace_member%'
ORDER BY tablename, policyname;
```

## Expected Results

### Tables that should have RLS enabled:
- ✅ blocks (NEW)
- ✅ context_items (NEW)  
- ✅ documents (NEW)
- ✅ raw_dumps (UPDATED)
- ✅ narrative (NEW)
- ✅ events (UPDATED - now workspace-scoped)

### Policies that should exist:
Each table should have 4-5 policies:
- `{table}_select_workspace_member`
- `{table}_insert_workspace_member`
- `{table}_update_workspace_member` 
- `{table}_delete_workspace_member`
- `{table}_service_role_all`

## Migration Success Criteria

1. All workspace-scoped tables have RLS enabled
2. All tables have proper workspace isolation policies
3. Service role maintains full access for backend operations
4. Cross-workspace data access is prevented
5. Canon compliance test failures reduced

## Next Steps After Migration

1. Run `./scripts/dump_schema.sh` to update schema snapshot
2. Commit and push changes
3. Run canon compliance tests to verify improvements
4. Move to next phase: workspace resolution fixes