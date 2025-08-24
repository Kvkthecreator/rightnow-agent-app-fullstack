#!/usr/bin/env bash
set -euo pipefail

rg -n --hidden -S "rpc\\('fn_" api web || true
rg -n --hidden -e "INSERT\\s+INTO\\s+public\\.(documents|blocks|block_revisions|context_items|substrate_relationships)\\b" api web || true
rg -n --hidden -S "fn_timeline_emit" api sql || true
rg -n --hidden -S "document_type.*narrative|fn_document_create" api web || true
rg -n --hidden -S "persistReflection|fn_persist_reflection" api web || true
rg -n --hidden -S "fn_block_create|block_revision" api web || true
rg -n --hidden -S "context_items|substrate_relationships" api web || true
rg -n --hidden -S "CREATE POLICY|GRANT .* ON .* (documents|blocks|block_revisions|context_items|substrate_relationships)" docs/SCHEMA_SNAPSHOT.sql || true
rg -n --hidden -S "CREATE TABLE public\\.(documents|blocks|block_revisions|context_items|substrate_relationships)" docs/SCHEMA_SNAPSHOT.sql || true
rg -n --hidden -S "CREATE INDEX .*basket_id" docs/SCHEMA_SNAPSHOT.sql || true
