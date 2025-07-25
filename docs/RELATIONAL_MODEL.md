# 🧠 Yarnnn Relational Model of Meaning

**Version 3.0 — Fully Integrated Process-Aware Model**

*Aligned with Context OS substrate v1.2*

---

## 1. First Principles: Meaning is Processed, Not Stored

Yarnnn is a **Context OS substrate** — a system that captures cognition and evolves it into structured memory, without overwriting source meaning.

The model is not app-centric. It's memory-centric.

It separates the **substance** (inputs, blocks) from the **expression** (documents, tags) — and from the **composer** (agent or user) that builds those expressions.

---

## 2. Updated Semantic Roles (with Composer)

| Role | Type(s) | Description |
| --- | --- | --- |
| **Capture** | `raw_dump` | Immutable stream of user cognition |
| **Interpretation** | `block` | Interpreted memory units (from `raw_dump`) |
| **Expression** | `document` | Composed output of selected `blocks`, `narrative`, and `context_items` |
| **Narrative Layer** | freeform text | Agent/user-authored prose inside `document` |
| **Threading** | `context_item` | Semantic label or connector across types |
| **Scope Container** | `basket` | Contextual boundary for all activity |
| **Change Tracker** | `event`, `revision` | Logs evolution across all types |
| **Composer** | `agent`, `user` | The actor that performs document creation and editing |

---

## 3. How Meaning Emerges (Semantic Flows)

In Yarnnn, no single data type owns the flow of memory. Instead, meaning emerges as agents and users engage with the substrate:

- A `raw_dump` may be interpreted by agents into `blocks`, embedded with `narrative`, or annotated with `context_items` — but none are guaranteed or automatic.
- A `block` may become part of a `document`, or evolve independently — it is a reusable unit of structured meaning.
- A `document` is composed via agent or user selection, blending referenced `blocks`, original `narrative`, and relevant `context_items`.
- A `context_item` may be inferred from any substrate — raw thoughts, structured blocks, full documents — and used to semantically connect and cluster related memory.
- `events` and `revisions` record how memory changes, without mutating original inputs.
- `baskets` contain these evolving parts, without enforcing any linear creation flow.

> In other words: Documents are not destinations, and blocks are not endpoints. All types are peers. Meaning forms when agents interpret, users curate, and semantic structure emerges.
> 

---

## 4. Actor-Aware Relational Diagram

```mermaid
mermaid
CopyEdit
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

```

---

## 5. Hardened Document Composition

| Component | Origin | Purpose |
| --- | --- | --- |
| `block[]` | Selected memory atoms | Provide core structured content |
| `narrative` | Authored by agent or user | Contextual glue, opinion, guidance |
| `context_item[]` | Agent-inferred or user-tagged | Semantic threading and label for reuse |

> 🎯 Think of a document as a living workspace — more like a Notion page or Google Doc than a PDF.
> 

---

## 6. Revised Summary Table (Composition + Source Logic)

| Type | Evolves | Source of Truth | Tagged? | Tags Others | Appears In |
| --- | --- | --- | --- | --- | --- |
| `raw_dump` | ❌ No | ✅ Yes (verbatim) | ✅ Yes | ❌ No | ⛔ No |
| `block` | ✅ Yes | ❌ Derived | ✅ Yes | ❌ No | ✅ Document |
| `narrative` | ✅ Yes | ✅ Yes (authored) | ✅ Yes | ❌ No | ✅ Document |
| `context_item` | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Document, Block |
| `document` | ✅ Yes | ❌ (Composed) | ✅ Yes | ❌ No | ✅ Itself |

---

## 7. Upgraded Mental Model & Analogies

| Concept | Analogy (Revised) |
| --- | --- |
| `raw_dump` | Voice note, brain-dump, transcript |
| `block` | Selected quote or meaningful excerpt |
| `narrative` | Your commentary / AI-written connector |
| `document` | Living project plan / Notion page draft |
| `context_item` | Hashtag, semantic tag, thread |
| `composer agent` | Research assistant or ghostwriter |
| `event/revision` | Git commit / activity log |
| `basket` | Folder for contextually-linked thoughts |

---

## ✅ Final Integration Check

| Principle | Status |
| --- | --- |
| Document is composed (not static) | ✅ |
| Narrative is first-class | ✅ |
| Agent/User explicitly shown | ✅ |
| Composer role present in diagram | ✅ |
| Document described as “living” | ✅ |
| Tables reflect dynamic memory process | ✅ |
| Analogies match substrate behavior | ✅ |

---

## 📌 Summary

- A `document` is a **living memory surface**, composed via agent/user intent — not a passive export.
- The `composer` is now modeled as an explicit **actor**, with control over selection, narration, and expression.
- This version reflects a full **transition from data schema** → **cognitive modeling contract**.