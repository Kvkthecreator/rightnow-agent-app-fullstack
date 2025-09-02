# Canon v1.4.0 — docs clarification (no code change)
Aligns reflections (derived + optional cache), sacred write path endpoints, DTO wording (file_url), schema term context_blocks, basket lifecycle, and event tokens.

# Reflection Read-Model (Authoritative + Optimistic)

**Goal:** Deterministic reflections computed from substrate; same code can run on server (truth) and client (optimism).

## Inputs
- **Text window**: last N `raw_dumps` in basket
- **Graph window**: `context_items` + `substrate_relationships` touching those dumps

Blocks (**context_blocks**) may be referenced when reflections require structured context.

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
- **Server (authoritative)**: compute → (optional) UPSERT `reflection_cache` → INSERT `timeline_events(kind='reflection')` → EMIT `events(kind='reflection.computed')`.
- **Client (optimistic)**: run `computeReflections(notes)` without graph immediately after submit; reconcile to server result on revalidate.

## Storage
- **Optional cache**: `reflection_cache` stores the computed shape with timestamp; non-authoritative
- **Stream**: `timeline_events` append-only log of all memory events (dump|reflection|narrative|system_note)
- **Events**: canonical `events` table (basket_events deprecated)

Reflections are derived from substrate. If persisted, they live in reflection_cache as a non-authoritative cache; readers may recompute on demand.

## Guarantees
- **No schema changes**.
- **Cross-device consistency**: UI ultimately reflects server computation.
- **Zero silent mutations**: reflections are derived, never stored as state.

## "No-Drift" Checklist
- ✓ One write path: `/api/dumps/new` → `raw_dumps` → `dump.created`.
- ✓ Interpretation writes only to existing tables: `context_items`, `substrate_relationships`, optional `context_blocks`.
- ✓ Narrative writes to existing `documents(document_type='narrative')`.
- ✓ Reflections are computed; not stored (except optional caching).
- ✓ Agents are idempotent; UPSERT by stable keys.
- ✓ UI never mutates substrate except when user accepts a Suggest.