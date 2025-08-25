#!/usr/bin/env bash
set -euo pipefail
mkdir -p docs

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
