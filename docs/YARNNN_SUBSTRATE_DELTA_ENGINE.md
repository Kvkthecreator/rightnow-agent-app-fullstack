# YARNNN_SUBSTRATE_DELTA_ENGINE.md
Version: 1.0
Status: Canon — P1 Substrate Resolver (Delta-first)

## Purpose
Define how P1 converts a new `raw_dump` into **substrate deltas** by comparing **what is** (basket snapshot) with **what is added** (extracted candidates).

---

## Inputs
- `new_dump` — text + file refs
- `basket_snapshot`:
  - `CTX_INDEX`: (kind, normalized_label) → context_item_id, stats
  - `BLOCK_INDEX`: signature_hash → block_id, variants

## Normalization & Similarity
- Normalize labels; compute `normalized_label`
- Fuzzy matching per kind with thresholds `SIM_THRESH_{kind}`
- `signature_hash` for blocks: sha256 over normalized core fields

---

## Decision Table

| Candidate | Exact Match | Fuzzy ≥ τ | Else |
|---|---|---|---|
| context_item | ATTACH (no new row) | ATTACH nearest (or CREATE with equivalence hint if tie) | CREATE |
| block | REVISION (if content changed) | REVISION (if same signature class) | CREATE |

All decisions are **idempotent** under the same `delta_id`.

---

## Idempotency & Determinism
- `delta_id = sha256(dump_id + sorted(candidate_signatures))`
- Pass `delta_id` to bulk RPCs for safe retries.

---

## Pseudo-code (resolver)
```pseudo
snapshot = load_snapshot(basket_id)
candidates = extract_candidates(dump)
delta_id = compute_delta_id(dump_id, candidates)

for c in candidates.context_items:
  k = (c.kind, c.normalized_label)
  if k in snapshot.CTX_INDEX: attach(c, snapshot.CTX_INDEX[k])
  else:
    m = fuzzy_match(k, snapshot.CTX_INDEX, τ_by_kind)
    if m: attach(c, m.id) else: create(c)

for b in candidates.blocks:
  sig = signature(b)
  if sig in snapshot.BLOCK_INDEX: revise(b, BLOCK_INDEX[sig])
  else: create(b)

emit_summary(delta_id, counts)
```

---

## Acceptance
`rg -n "delta_id|CTX_INDEX|BLOCK_INDEX|Decision Table" docs/YARNNN_SUBSTRATE_DELTA_ENGINE.md`

---

## Commit
docs: add YARNNN_SUBSTRATE_DELTA_ENGINE with snapshot, thresholds, and resolver spec