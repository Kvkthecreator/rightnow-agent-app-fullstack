# Canon v1.3.1 — docs clarification (no code change)
Aligns reflections (derived + optional cache), sacred write path endpoints, DTO wording (file_url), schema term context_blocks, basket lifecycle, and event tokens.

# Yarnnn Memory Model — Canonical Substrate Contract (v2.1)

Aligned with Context OS substrate v1.2
Blocks (**context_blocks**) are structured units of meaning.
Last updated: 2025-07-25

---

## 1. Core Principle

The memory model captures, structures, and evolves cognitive inputs as **decoupled, composable substrates**.  
No substrate assumes the existence of another. All reference a shared `basket_id`.

---

## 2. Canonical Data Types

| Type          | Description                          | Created When             |
| ------------- | ------------------------------------ | ------------------------ |
| `basket`      | Workspace-level container            | Manually via UI/API      |
| `raw_dump`    | Immutable unstructured input         | User submits dump        |
| `context_block`       | Structured unit of meaning           | Proposed by agent/user   |
| `document`    | Composition of blocks + narrative    | Composed by agent/user   |
| `context_item`| Semantic connector/tag               | Inferred or created      |
| `event`       | Audit log of changes                 | Emitted by system/agent  |

### Memory Plane (First-Class)
- **reflection_cache** (optional, non-authoritative): Computed insights (pattern, tension, question, computed_at)
- **timeline_events**: Append-only memory stream of all basket activity
- **Integration**: Reflections computed from substrate → optionally cached → streamed via history

Reflections are derived from substrate. If persisted, they live in reflection_cache as a non-authoritative cache; readers may recompute on demand.

---

## 3. Substrate Lifecycle (Decoupled)

- Each substrate is explicitly created.  
- All reference the same `basket_id`.  
- No linear creation flow is enforced.

```mermaid
flowchart TD
    A([basket]) --> B1([raw_dump])
    A --> B2([block])
    A --> B3([document])
    A --> B4([context_item])

    B1 -->|agent interprets| B2
    B2 -->|composed in| B3
    B3 -->|tagged by| B4
    B2 -->|tagged by| B4
4. Memory Guarantees
Type	Mutability	Evolves	Source of Truth
raw_dump	Immutable	No	Yes (verbatim)
block	Revisable	Yes	Derived
document	Versioned	Yes	Composed
context_item	Evolves	Yes	Yes
basket	Static ID	No	No
event	Immutable	No	Log only
5. Canonical Role Definitions
🧺 basket
Memory scope for all substrates.
Organizes raw_dumps, context_blocks, documents, context_items.
💭 raw_dump
Unstructured input, immutable.
May be referenced by context_blocks or documents.
⬛ block
Reusable unit of structured meaning.
Proposed by agents or users.
May reference a region of a raw_dump.
Lifecycle: PROPOSED → ACCEPTED → LOCKED → CONSTANT.
📄 document
Composition of selected blocks, narrative, and optional context_items.
Persisted as structured content.
Not a source of memory, but an expression of it.
🏷️ context_item
Semantic connector (tags/themes).
May link to blocks, documents, baskets.
User-declared or agent-inferred.
📜 event
Immutable audit entry.
Records creations, updates, proposals, rejections, and compositions.
6. Canonical Summary
All substrates are peers — no hierarchy.
Blocks (**context_blocks**) are the reusable, structured memory atoms.
Documents are compositions, not containers of truth.
Narrative text is persisted inside documents.
Events ensure full auditability and immutability.