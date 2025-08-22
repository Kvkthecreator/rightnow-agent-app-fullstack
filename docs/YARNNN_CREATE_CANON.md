# /create Canon (Capture)

**Purpose:** One sacred entry: capture → `raw_dump`. Nothing else.

## Contract
- **Input:** `{ basket_id, text_dump, client_ts? }`
- **Write:** `raw_dumps` (immutable)
- **Emit:** `dump.created` (payload: `{ dump_id, basket_id, user_id, created_at }`)
- **Memory Flow:** dump.created → triggers reflection computation → INSERT basket_reflections → timeline_events
- **No side effects here:** no reflections/narrative computed in this step.

## Notes
- Basket creation is **decoupled**: user explicitly selects an existing basket or chooses "New basket".
- Idempotency: `(basket_id, dump_request_id)` or `(user_id, hash(text)+client_ts)` per existing practice.

## "No-Drift" Checklist
- ✓ One write path: `/api/dumps/new` → `raw_dumps` → `dump.created`.
- ✓ Interpretation writes only to existing tables: `context_items`, `substrate_relationships`, optional `blocks`.
- ✓ Narrative writes to existing `documents(document_type='narrative')`.
- ✓ Reflections are computed; not stored (except optional caching).
- ✓ Agents are idempotent; UPSERT by stable keys.
- ✓ UI never mutates substrate except when user accepts a Suggest.