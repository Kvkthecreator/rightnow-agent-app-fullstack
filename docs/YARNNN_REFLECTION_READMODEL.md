# Reflection Read-Model (Authoritative + Optimistic)

**Goal:** Deterministic reflections computed from substrate; same code can run on server (truth) and client (optimism).

## Inputs
- **Text window**: last N `raw_dumps` in basket
- **Graph window**: `context_items` + `substrate_relationships` touching those dumps

## Output
```ts
type Reflections = {
  pattern?: string;
  tension?: { a: string; b: string } | null;
  question?: string | null;
  reasons: string[]; // phrases/entities that justify the above
}
```

## Compute
- **Server (authoritative)**: build GraphProjection in memory, run `computeReflections(notes, graph)`, cache if needed.
- **Client (optimistic)**: run `computeReflections(notes)` without graph immediately after submit; reconcile to server result on revalidate.

## Guarantees
- **No schema changes**.
- **Cross-device consistency**: UI ultimately reflects server computation.
- **Zero silent mutations**: reflections are derived, never stored as state.

## "No-Drift" Checklist
- ✓ One write path: `/api/dumps/new` → `raw_dumps` → `dump.created`.
- ✓ Interpretation writes only to existing tables: `context_items`, `substrate_relationships`, optional `blocks`.
- ✓ Narrative writes to existing `documents(document_type='narrative')`.
- ✓ Reflections are computed; not stored (except optional caching).
- ✓ Agents are idempotent; UPSERT by stable keys.
- ✓ UI never mutates substrate except when user accepts a Suggest.