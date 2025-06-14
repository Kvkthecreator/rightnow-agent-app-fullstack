# Supabase Migrations

## Phase 1 DB Baseline

All DB changes must be reflected in migration files to avoid schema drift.

✅ Export your current schema to `000_phase1_baseline.sql` using pg_dump or Supabase UI export.

✅ No direct web UI changes without updating this migration file.

✅ All future DB updates must use new migration files in sequence.

Example export command:
```
pg_dump --schema-only --no-owner --no-privileges --dbname <connection_url> > supabase/migrations/000_phase1_baseline.sql
```
