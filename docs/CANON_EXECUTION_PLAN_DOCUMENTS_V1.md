# YARNNN Documents v1 — Execution Plan (Canon-Aligned)

Version: 1.0.0
Status: Working Plan
Last Updated: 2025-09-09

## Goals
- Ship Read, Edit, Compare, Analyze Lite for documents under strict P4 boundaries.
- Remove block-only composition paths; enforce generic substrate_references.
- Align docs → backend → frontend with a single canon.

## Phase 0 — Canon Prep (Docs)
- Add: YARNNN_DOCUMENT_MODES_SPEC.md ✅
- Add: YARNNN_COMPOSE_FROM_MEMORY.md ✅
- Add: YARNNN_EXTERNAL_SHARING_AND_INTEGRATIONS.md (future) ✅

## Phase 1 — Boundaries & Contracts
- FE/BE import same Zod contracts for documents + substrate_references.
- Middleware: ensure /api/presentation/* and /api/documents/* map to P4_PRESENTATION.
- Remove BlockLinkDTO from any live code paths; keep alias deprecated only.
- Ensure route inventory has: /api/presentation/compose, /api/documents/[id]/references, /api/documents/[id]/composition.

## Phase 2 — Cleanup Legacy
- Migrate off `block_links` (if present) → substrate_references. Confirm latest migrations drop `block_links` in production.
- Remove/replace `fn_document_attach_block` with generic attach function targeting `substrate_references`.
- Delete deprecated endpoints like `/api/documents/[id]/blocks` if lingering.

## Phase 3 — P4 Implementation
- Implement DocumentComposer.composeDocument to: create/update document, create document_version, attach substrate_references (no substrate writes).
- Add coverage + stale projections (read-only views):
  - `vw_document_composition_stats(document_id)`
  - `vw_document_staleness(document_id)` using last_modified timestamps of referenced substrate.
- Expose GET endpoints for stats and staleness; integrate into Analyze Lite panel.

## Phase 4 — UX Wiring
- Read: reference panel, deep links, composition stats; no substrate writes.
- Edit: prose editor + substrate picker; attach/detach; optional Extract to Memory action (P0 call).
- Compare: version list + prose diff + references diff.
- Analyze Lite: coverage %, counts, stale badge; link to proposals impacting references.

## Phase 5 — Tests & Guardrails
- E2E: compose from memory, attach/detach references, compare versions, stale detection.
- CI: RPC allow-list for P4 routes; enforce that no P1/P2 calls occur from these paths.
- ESLint: import boundaries between pipelines.

## Phase 6 — De-risk Integrations (Future)
- Lock/publish version; artifact_outbox (future).
- Connectors consume `document_versions` manifests via signed URLs (future).

## Known Hotspots (Audit Checklist)
- supabase/functions/fn_document_attach_block.sql → replace with generic reference attach.
- block_links presence in schema snapshots vs applied migrations.
- DocumentComposer is disabled; needs P4 implementation.
- Any code paths that use block-only joins or DTOs.

## Decision Log
- Intent default: artifact metadata; optional “Add intent to memory” off by default.
- Compose endpoint path: /api/presentation/compose (P4), not /api/documents/compose-from-memory.
- Analyze Lite in v1; full Analyze deferred.

