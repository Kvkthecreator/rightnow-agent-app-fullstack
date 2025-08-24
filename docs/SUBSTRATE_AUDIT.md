# Canon v1.3.1 — docs clarification (no code change)
Aligns reflections (derived + optional cache), sacred write path endpoints, DTO wording (file_url), schema term context_blocks, basket lifecycle, and event tokens.

# Substrate Wiring Audit

## 1. Summary
- Writers audited: reflection_cache (optional, non-authoritative), documents, context_blocks, block_revisions, context_items, substrate_relationships, events
- RPC coverage: only reflection_cache (optional, non-authoritative) uses RPC (`fn_reflection_cache_upsert` → `fn_timeline_emit`)
- Direct inserts found: documents, context_blocks, block_revisions, context_items, substrate_relationships, events

Reflections are derived from substrate. If persisted, they live in reflection_cache as a non-authoritative cache; readers may recompute on demand.

## 2. Writers by Type
### 2.1 Reflections (reflection_cache)
- Paths: `web/app/_server/memory/persistReflection.ts`
 - RPC used: yes – `supabase.rpc("fn_reflection_cache_upsert")`
- Emits timeline: yes – RPC performs `fn_timeline_emit`

### 2.2 Narrative (documents: document_type='narrative')
- Paths: `api/src/app/documents/services/context_composition.py`, `api/src/app/routes/basket_from_template.py`, `api/src/app/services/template_cloner.py`, `api/src/services/substrate_ops.py`
- RPC used: no – direct `supabase.table('documents').insert/upsert`
- Emits timeline: no

### 2.3 Blocks (context_blocks)
- Paths: `api/src/services/upserts.py`, `api/src/app/memory/blocks/lifecycle.py`, `api/src/app/routes/blocks.py`, other direct insert sites
- RPC used: no
- Emits timeline: no

### 2.4 Block Revisions
- Paths: `api/src/app/routes/blocks.py`, `api/src/app/memory/blocks/lifecycle.py`
- RPC used: no
- Emits timeline: no

### 2.5 Context Items
- Paths: `api/src/app/routes/context_items.py`, `api/src/app/agents/services/context_tagger.py`, `api/src/services/upserts.py`, `api/src/app/routes/basket_from_template.py`
- RPC used: no
- Emits timeline: no

### 2.6 Substrate Relationships
- Paths: `api/src/services/upserts.py`
- RPC used: no
- Emits timeline: no

### 2.7 Events
- Paths: `api/src/app/documents/services/context_composition.py`, `api/src/app/memory/blocks/lifecycle.py`, and other agent/document services
- RPC used: no
- Emits timeline: no

## 3. Security (RLS/Grants)
- block_revisions → workspace-scoped RLS policies for modify/read (`docs/SCHEMA_SNAPSHOT.sql` lines ~640-652, 799-805)
- context_blocks → workspace-scoped RLS policies for modify/read/insert/update (`docs/SCHEMA_SNAPSHOT.sql` lines ~643-658, 723-732)
- documents → workspace-scoped RLS policies for modify/read (`docs/SCHEMA_SNAPSHOT.sql` lines ~646-657)
- context_items → workspace-scoped RLS policies for CRUD (`docs/SCHEMA_SNAPSHOT.sql` lines ~663-767)
- substrate_relationships → view policy within workspace (`docs/SCHEMA_SNAPSHOT.sql` lines ~678-682)
- reflection_cache (optional, non-authoritative) → service role and workspace member policies (`docs/SCHEMA_SNAPSHOT.sql` lines ~773-775, 795-798, 830, 834)
- Function EXECUTE grants: none found in schema snapshot

## 4. Indexes (hot paths)
- context_blocks → `idx_blocks_basket (basket_id)`
- block_revisions → no basket_id index observed
- documents → `idx_documents_basket (basket_id)`
- context_items → `idx_context_items_basket`, `idx_context_basket (basket_id)`
- substrate_relationships → `idx_relationships_from`, `idx_relationships_to`
- reflection_cache (optional, non-authoritative) → `idx_reflections_basket_ts (basket_id, computed_at desc)`

## 5. Gaps & Risks
- Most writers bypass RPCs and timeline emission
 - `fn_block_create`, `fn_document_create`, `fn_context_item_upsert_bulk` unused
- Missing EXECUTE grants may restrict RPC access
- Lack of basket-scoped index on `block_revisions`

## 6. Migration Plan (Prioritized)
1. Replace direct document inserts with `fn_document_create` to emit timeline
2. Replace block creation/upsert with `fn_block_create` and emit timeline
3. Wrap block revision inserts in an RPC that emits timeline events
 4. Introduce `fn_context_item_upsert_bulk` for all context item writes
5. Add RPCs for substrate_relationships and event writers to ensure timeline emission
