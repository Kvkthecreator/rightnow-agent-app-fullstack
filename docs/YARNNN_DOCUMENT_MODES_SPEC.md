# YARNNN Document Modes — Canon v2.0 (Spec)

Version: 1.0.0
Status: Authoritative
Last Updated: 2025-09-09

## Purpose
Define the canonical document modes, UX contracts, and guardrails so P4 Presentation remains pure and consistent across FE/BE. This spec narrows scope to Read, Edit, Compare (v1), and introduces Analyze Lite (v1). Full Analyze can follow in v2.

## Modes

- Read: Finalized presentation. Renders authored prose + resolved substrate context. No substrate writes.
- Edit: Composition workspace. Author prose, attach/detach substrate references, manage role/weight/snippets. Optional Extract to Memory for new authored text.
- Compare: Version diff for prose and reference set. Uses immutable `document_versions`.
- Analyze Lite: Reference panel, composition_stats, coverage %, stale badge if referenced substrate changed. Links to proposals affecting this doc.

## Acceptance Criteria

### Read
- Renders current document with resolved substrate references (peers: block, dump, context_item, timeline_event).
- Shows references panel with role/weight and deep links to substrate.
- Emits no substrate writes; only consumes `documents`, `substrate_references`, and read-only substrate queries.

### Edit
- Prose editor present. Substrate picker supports all substrate types.
- Attach/detach references with role/weight/snippets. Save updates document; optional new `document_version` per save.
- Optional action: Extract to Memory → snapshot current prose to `raw_dump` (P0) with provenance; P1 proposals run async; user can later attach resulting substrate.
- No direct substrate writes from Edit. All substrate mutation uses P0/P1 via governance.

### Compare
- Version list with timestamps and author.
- Prose diff and references diff (added/removed/changed role/weight).
- Clear version semantics; compare current working copy vs any version.

### Analyze Lite
- Composition stats: counts per substrate type; total references.
- Coverage % of prose mapped to references (approximation accepted in v1).
- Stale badge if referenced substrate changed since this document_version.
- Link-outs to proposals impacting referenced substrate.

## Guardrails (Canon)
- P4-only writes: `documents`, `document_versions`, `substrate_references`.
- No P1/P2 RPCs from document routes; governance is separate.
- Reflections target `document_versions` (optional read), never used as substrate.
- No artifact recursion: documents do not compose documents; reflections do not reflect on reflections.

## RPC Allow-List (by mode)
- Read: read-only selects on `documents`, `substrate_references`, `raw_dumps`, `context_blocks`, `context_items`, `timeline_events`.
- Edit: `fn_document_create`, `fn_document_update`, `fn_document_version_create` (if exists), CRUD on `substrate_references`.
- Compare: read-only on `document_versions`, references-by-version view.
- Analyze Lite: read-only on projections: composition_stats_by_document, last_modified_by_id for referenced substrate.

## Events
- doc.created, doc.updated (edit), doc.versioned (compare/lock).
- Optional: doc.composition_stats.computed, doc.stale_detected (analyze-lite).

## Endpoints (v1)
- GET /api/documents/:id
- GET /api/documents/:id/composition
- GET /api/documents/:id/references
- POST /api/documents/:id/references
- DELETE /api/documents/:id/references
- POST /api/presentation/compose (P4 composition: narrative + references)
- Optional: POST /api/documents/:id/lock (create `document_version`)
- Optional: POST /api/documents/:id/extract-to-memory (snapshot → raw_dump)

## UX Notes
- Display substrate types as peers (no hierarchy), with type-specific affordances.
- Show clear messaging: “This text is not memory until you Extract to Memory.”
- On stale: surface impact gently; do not auto‑change prose.

## Definition of Done (v1)
- Read/Edit/Compare live behind P4 guardrails.
- substrate_references is the single attach/detach surface; no block-only endpoints.
- DocumentComposer wired to compose artifacts; no substrate writes.
- Analyze Lite metrics present (coverage %, counts, stale badge) sourced from read-only projections.

