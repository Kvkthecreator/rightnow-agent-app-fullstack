#!/bin/bash

# Yarnnn concise schema dump script
# Dumps cleaned public schema to docs/SCHEMA_SNAPSHOT.sql
# Excludes noisy boilerplate and leaves only table/column essentials

PG_DUMP_URL="postgresql://postgres.galytxxkrbksilekmhcw:0Pikachu%21%21%40%40%23%23%24%24@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

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

if [ $? -eq 0 ]; then
  echo "✅ SCHEMA_SNAPSHOT.sql created successfully (concise version)."
else
  echo "❌ pg_dump failed. Check connection and credentials."
fi
