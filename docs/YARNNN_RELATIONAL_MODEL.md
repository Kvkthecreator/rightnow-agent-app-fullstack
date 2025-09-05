# Canon v2.0 — Substrate/Artifact Model
Pure substrate memory with separate artifact expressions. Clear substrate/artifact boundaries.

# Yarnnn Relational Model

**Version 4.0 — Substrate/Artifact Separation Model**
Aligned with Context OS substrate v1.2
Blocks (**context_blocks**) are structured knowledge ingredients extracted from raw_dumps by the P1 Substrate Agent. Each block contains goals, constraints, metrics, entities, relationships, and provenance for traceability.

---

## 1. Substrate Roles

| Role              | Layer    | Type(s)           | Description |
| ----------------- | -------- | ----------------- | ----------- |
| Capture           | Substrate| `dump`            | Immutable input stream (raw_dumps) |
| Interpretation    | Substrate| `block`           | Structured units (context_blocks) |
| Threading         | Substrate| `context_item`    | Semantic connectors |
| Activity Log      | Substrate| `timeline_event`  | System audit trail |
| Compositions      | Artifact | `document`        | Versioned narrative expressions |
| Insights          | Artifact | `reflection`      | Computed patterns/tensions |
| Scope Container   | Meta     | `basket`          | Workspace boundary |

### Memory Plane (Substrate Only)
| Component | Purpose | Storage |
|-----------|---------|---------|
| substrate_references | Links substrate to documents | substrate_type, substrate_id |
| timeline_events | Append-only memory stream | kind, ts, ref_id, preview, payload |

### Artifact Plane (Separate)
| Component | Purpose | Storage |
|-----------|---------|---------|
| document_versions | Git-like versioning | version_hash, content, metadata |
| reflections_artifact | Computed insights | target_type, target_id, reflection_text |
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