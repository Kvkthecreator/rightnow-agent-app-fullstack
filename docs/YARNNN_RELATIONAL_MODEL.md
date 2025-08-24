# Canon v1.3.1 — docs clarification (no code change)
Aligns reflections (derived + optional cache), sacred write path endpoints, DTO wording (file_url), schema term context_blocks, basket lifecycle, and event tokens.

# Yarnnn Relational Model

**Version 3.0 — Canonical Substrate Model**
Aligned with Context OS substrate v1.2
Blocks (**context_blocks**) are structured units derived from dumps.

---

## 1. Substrate Roles

| Role              | Type(s)           | Description |
| ----------------- | ----------------- | ----------- |
| Capture           | `raw_dump`        | Immutable input stream (text, files) |
| Interpretation    | `context_block`           | Structured units derived from dumps |
| Expression        | `document`        | Compositions of context_blocks, narrative, context_items |
| Narrative Layer   | `narrative`       | Authored prose inside a document |
| Threading         | `context_item`    | Semantic connectors across substrates |
| Scope Container   | `basket`          | Contextual boundary for all activity |

### Memory Plane
| Component | Purpose | Storage |
|-----------|---------|---------|
| reflection_cache (optional, non-authoritative) | Computed insights | pattern, tension, question, computed_at |
| timeline_events | Append-only memory stream | kind, ts, ref_id, preview, payload |

**Note**: `basket_events` is deprecated; use `events` table for canonical event bus.
| Change Tracker    | `event`, `revision` | Logs of evolution across types |
| Composer          | `agent`, `user`   | Actor that creates/edits content |

Basket lifecycle: **INIT → ACTIVE → ARCHIVED**. Empty INIT baskets older than **48h** are **eligible for cleanup** (policy-guarded; disabled by default).

---

## 2. Semantic Flows

- `raw_dump` → may be interpreted into `context_blocks`, annotated with `context_items`, or referenced directly.
- `context_block` → reusable unit, may be included in `documents`.
- `document` → composed from selected `context_blocks`, `narrative`, and `context_items`.
- `context_item` → can label or connect dumps, context_blocks, or documents.
- `events`/`revisions` → record changes without mutating originals.  
- `basket` → contains all activity, but imposes no linear flow.  

---

## 3. Relational Diagram

flowchart TD
    subgraph "Actors"
        A[agent/user]
    end

    subgraph "Substrates"
        RD[raw_dump]
        B[context_block]
        N[narrative]
        CI[context_item]
    end

    subgraph "Compositions"
        D[document]
    end

    subgraph "Containers"
        BK[basket]
    end

    RD --> B
    B --> D
    N --> D
    CI --> D
    CI --> B
    CI --> BK
    BK --> RD
    BK --> B
    BK --> D
    BK --> CI
    A -->|composes| D

    classDef actor fill:#f9f,stroke:#333,stroke-width:1px;
    class A actor;

##  4. Composition Model
Component	Origin	Purpose
context_block[] Structured interpretations      Core content
narrative	Authored by agent/user	Contextual glue
context_item[]	Tagged or inferred	Semantic threading

## 5. Reflection as Derived State
Reflections (pattern/tension/question) are not primary tables; they are computed at read-time from:
- `raw_dumps` (text signals)
- `context_items` and `substrate_relationships` (graph signals)

Narratives are persisted as `documents(document_type='narrative')`.

## 6. Canonical Summary
All substrates are peers — no single type is the "end."
Documents are compositions, not exports.
Narrative is first-class alongside structured blocks (`context_blocks`).
Agents and users act as explicit composers.
Events/revisions ensure immutability of originals.