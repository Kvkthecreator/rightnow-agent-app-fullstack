# Yarnnn Relational Model

**Version 3.0 — Canonical Substrate Model**  
Aligned with Context OS substrate v1.2

---

## 1. Substrate Roles

| Role              | Type(s)           | Description |
| ----------------- | ----------------- | ----------- |
| Capture           | `raw_dump`        | Immutable input stream (text, files) |
| Interpretation    | `block`           | Structured units derived from dumps |
| Expression        | `document`        | Compositions of blocks, narrative, context_items |
| Narrative Layer   | `narrative`       | Authored prose inside a document |
| Threading         | `context_item`    | Semantic connectors across substrates |
| Scope Container   | `basket`          | Contextual boundary for all activity |

### Memory Plane
| Component | Purpose | Storage |
|-----------|---------|---------|
| basket_reflections | Durable computed insights | pattern, tension, question, computed_at |
| timeline_events | Append-only memory stream | kind, ts, ref_id, preview, payload |

**Note**: `basket_events` is deprecated; use `events` table for canonical event bus.
| Change Tracker    | `event`, `revision` | Logs of evolution across types |
| Composer          | `agent`, `user`   | Actor that creates/edits content |

---

## 2. Semantic Flows

- `raw_dump` → may be interpreted into `blocks`, annotated with `context_items`, or referenced directly.  
- `block` → reusable unit, may be included in `documents`.  
- `document` → composed from selected `blocks`, `narrative`, and `context_items`.  
- `context_item` → can label or connect dumps, blocks, or documents.  
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
        B[block]
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
block[]	Structured interpretations	Core content
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
Narrative is first-class alongside structured blocks.
Agents and users act as explicit composers.
Events/revisions ensure immutability of originals.