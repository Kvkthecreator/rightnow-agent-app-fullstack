#!/usr/bin/env bash
set -euo pipefail

# Yarnnn concise schema dump script
# Dumps cleaned public schema to docs/SCHEMA_SNAPSHOT.sql (schema-only, minimal noise)

# ---- Supabase (pooled) connection ----
DB_USER="postgres"
DB_PASS="4ogIUdwWzVyPH0nU"                               # new Supabase DB password you just set
DB_HOST="aws-0-ap-northeast-2.pooler.supabase.com"      # pooled host
DB_PORT="6543"                                          # pooled port (NOT 5432)
DB_NAME="postgres"

PG_DUMP_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Optional: If you ever need direct (non-pooled) for tools that dislike the pooler,
# set USE_DIRECT=1 and provide your project ref below, then uncomment the PG_DUMP_URL line.
# SUPABASE_REF="your-project-ref"   # e.g., abcd1234efgh5678ijkl
# if [[ "${USE_DIRECT:-0}" == "1" ]]; then
#   PG_DUMP_URL="postgresql://${DB_USER}:${DB_PASS}@db.${SUPABASE_REF}.supabase.co:5432/${DB_NAME}?sslmode=require"
# fi

echo "🔄 Starting concise pg_dump..."
mkdir -p docs

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

echo "✅ SCHEMA_SNAPSHOT.sql created successfully (concise version)."
