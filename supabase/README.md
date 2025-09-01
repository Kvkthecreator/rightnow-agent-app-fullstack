# Supabase Schema Management

## Migration Workflow

All DB changes must be reflected in migration files to avoid schema drift.

### 1. Create Migration File
```bash
# Create new migration file in supabase/migrations/
# Format: YYYYMMDD_HHMMSS_description.sql
npx supabase migration new your_change_description
```

### 2. Execute Migration
Try these methods in order:

**Method A: Supabase CLI (preferred)**
```bash
npx supabase db push
```

**Method B: Direct psql (when CLI fails)**
```bash
psql "postgresql://postgres.galytxxkrbksilekmhcw:4ogIUdwWzVyPH0nU@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require" \
  -f supabase/migrations/YYYYMMDD_your_migration.sql
```

**Method C: Supabase Dashboard SQL Editor**
Copy migration contents and paste into dashboard SQL editor.

### 3. Update Schema Snapshot
```bash
# ALWAYS run this after successful migration
./scripts/dump_schema.sh
```

### 4. Commit Changes
```bash
git add docs/SCHEMA_SNAPSHOT.sql supabase/migrations/
git commit -m "Add/update schema: description"
git push
```

## Schema Verification
Verify migration was applied:
```bash
psql "postgresql://postgres.galytxxkrbksilekmhcw:4ogIUdwWzVyPH0nU@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require" \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'your_table';"
```

## Important Notes
- ✅ No direct web UI changes without migration files
- ✅ ALWAYS update schema snapshot after migration
- ✅ All future DB updates must use migration files in sequence
- ✅ Schema snapshot is auto-generated - never edit manually
