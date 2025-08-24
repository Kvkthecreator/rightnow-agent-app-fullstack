#!/bin/bash
set -euo pipefail
PATTERN='basket_reflections|file_urls|file_refs[^_]|fn_context_item_create|/create\b'
matches=$(rg "$PATTERN" -n api web scripts shared supabase .github \
  --glob '!**/migrations/**' --glob '!node_modules/**' --glob '!**/*.md' --glob '!**/*.json' \
  --glob '!scripts/pattern_guard.sh' --glob '!web/lib/intelligence/conversationAnalyzer.ts' || true)
filtered=$(echo "$matches" | rg -v '^[^:]+:\d+:\s*(#|//|--)' || true)
if [ -n "$filtered" ]; then
  echo "$filtered"
  echo "Disallowed patterns found"
  exit 1
fi
