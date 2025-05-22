## codex/tasks/1_task-M5-d-patch-fix_competitor_table_import.md

# Fix import case mismatch in CompetitorTable

## Context
Next.js build fails because `Card.tsx` is capitalised while the import in
`CompetitorTable.tsx` used lower-case `card`.

## Changes
```diff
* web/components/renderers/CompetitorTable.tsx


*** 🔧 Patch ***
- import { Card, CardContent } from "@/components/ui/card";
+ import { Card, CardContent } from "@/components/ui/Card";

