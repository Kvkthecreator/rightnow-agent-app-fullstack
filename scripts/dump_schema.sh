#!/usr/bin/env bash
set -euo pipefail
mkdir -p docs

# Supabase connection string for schema operations
PG_DUMP_URL="postgresql://postgres.galytxxkrbksilekmhcw:4ogIUdwWzVyPH0nU@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

echo "🔄 Starting concise pg_dump..."
pg_dump \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-comments \
  --dbname="$PG_DUMP_URL" \
  | grep -v -E '^(--|SET|SELECT pg_catalog|COMMENT ON EXTENSION|CREATE EXTENSION|ALTER TABLE ONLY public\..* OWNER TO)' \
  | sed '/^$/d' \
  > docs/SCHEMA_SNAPSHOT.sql
echo "✅ SCHEMA_SNAPSHOT.sql created successfully."

# Optional validation: ensure P0 capture default is 'direct' in governance flags
echo "🔍 Validating that onboarding_dump default is 'direct'..."
if grep -n -E "get_workspace_governance_flags" docs/SCHEMA_SNAPSHOT.sql >/dev/null 2>&1; then
  # Prefer ripgrep if available for nicer ergonomics
  if command -v rg >/dev/null 2>&1; then
    if rg -n --hidden -S "ep_onboarding_dump'.*'direct'" docs/SCHEMA_SNAPSHOT.sql >/dev/null 2>&1; then
      echo "✅ Validation passed: onboarding_dump default is 'direct'"
    else
      echo "❌ Validation failed: onboarding_dump default not set to 'direct' in get_workspace_governance_flags"
      echo "   Tip: apply migration supabase/migrations/20250908_153000_fix_p0_capture_defaults.sql"
      exit 1
    fi
  else
    # Fallback to grep (single-line match)
    if grep -n -E "ep_onboarding_dump'.*'direct'" docs/SCHEMA_SNAPSHOT.sql >/dev/null 2>&1; then
      echo "✅ Validation passed: onboarding_dump default is 'direct'"
    else
      echo "❌ Validation failed: onboarding_dump default not set to 'direct' in get_workspace_governance_flags"
      echo "   Tip: apply migration supabase/migrations/20250908_153000_fix_p0_capture_defaults.sql"
      exit 1
    fi
  fi
else
  echo "ℹ️  Skipping validation: could not locate get_workspace_governance_flags in snapshot"
fi

# Usage note for migrations:
# To execute migrations manually when CLI fails:
# psql "$PG_DUMP_URL" -f supabase/migrations/YYYYMMDD_your_migration.sql
# Example to fix P0 capture defaults:
# psql "$PG_DUMP_URL" -f supabase/migrations/20250908_153000_fix_p0_capture_defaults.sql
