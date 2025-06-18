#!/bin/bash

# Yarnnn schema dump script
# Dumps the public schema to docs/SCHEMA_SNAPSHOT.sql
# Uses session pooler (5432) and percent-encoded password

PG_DUMP_URL="postgresql://postgres.galytxxkrbksilekmhcw:0Pikachu%21%21%40%40%23%23%24%24@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

echo "Starting pg_dump..."
pg_dump --schema-only \
  --no-owner \
  --no-privileges \
  --no-comments \
  --file=docs/SCHEMA_SNAPSHOT.sql \
  --dbname="$PG_DUMP_URL"

if [ $? -eq 0 ]; then
  echo "✅ SCHEMA_SNAPSHOT.sql created successfully."
else
  echo "❌ pg_dump failed. Check connection and credentials."
fi
