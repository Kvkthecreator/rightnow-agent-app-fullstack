# 🧠 Yarnnn Memory Model — Canonical Substrate Contract (v2.1)

---

## 🧠 Core Principle

Yarnnn is a **Context OS substrate**, not an app.

Its memory model exists to **capture**, **structure**, and **evolve** cognitive inputs — as decoupled, composable types governed by meaning, not interface.

---

## 🔲 Canonical Data Types

| Type | Description | Created When |
| --- | --- | --- |
| `basket` | Workspace-level container | Manually via UI/API |
| `raw_dump` | Immutable unstructured input | User submits dump |
| `block` | Atomic meaning unit | Proposed via agent/user |
| `document` | Expressive composition (blocks + narrative) | Composed by agent/user |
| `context_item` | Semantic thread or connective label | Inferred or created |
| `event` | Audit trail entry | Emitted by system/agent |

---

## 🔄 Substrate Lifecycle (Decoupled)

Memory objects are **decoupled**, not sequential. No type assumes the existence of another.

- Each is **explicitly created**
- Each references a shared `basket_id`

```mermaid
mermaid
CopyEdit
flowchart TD
    A([basket]) --> B1([raw_dump])
    A --> B2([block])
    A --> B3([document])
    A --> B4([context_item])

    B1 -->|agent interprets| B2
    B2 -->|composed in| B3
    B3 -->|tagged by| B4
    B2 -->|tagged by| B4

```

> A basket is the memory scope. Meaning emerges within, not from it.
> 

---

## 🔐 Memory Guarantees

| Type | Mutability | Evolves | Memory Source? |
| --- | --- | --- | --- |
| `raw_dump` | ❌ Immutable | ❌ No | ✅ Yes |
| `block` | ✅ Revisions | ✅ Yes | ✅ Yes |
| `document` | ✅ Versioned | ✅ Yes | ❌ No |
| `context_item` | ✅ Evolves | ✅ Yes | ❌ No |
| `basket` | ❌ Static ID container | ❌ No | ❌ No |

---

## 📘 Canonical Role Definitions

---

### 🧺 `basket`

- **Memory scope** — contains all substrates.
- Organizes all objects (raw_dumps, blocks, documents, context_items).
- Think: the **workspace** or "kitchen" for cognitive creation.

---

### 💭 `raw_dump`

- **Cognitive origin** — unstructured but foundational.
- Immutable — no parsing or mutation occurs post-creation.
- May be referenced by blocks or rendered alongside documents.

---

### ⬛ `block`

- **Memory atom** — reusable unit of structured meaning.
- Proposed by agents or users.
- May reference a region in a `raw_dump`, but **not a substring clone**.
- Has state lifecycle: `PROPOSED` → `ACCEPTED` → `LOCKED` → `CONSTANT`.

---

### 📄 `document`

- **Expressive composition** — combines:
    - Referenced `blocks` (memory atoms)
    - Local narrative scaffolding (freeform glue)
    - Optional `context_items` for semantic framing
- Persisted as structured content with meaning and layout.
- Documents are **not sources of memory**, but expressions of it.

> Documents are living, evolving artifacts composed by agents or users.
> 
> 
> Their value lies in **composition**, not containment.
> 

---

### 🏷️ `context_item`

- **Semantic connector** — tags, themes, or logical relationships.
- Links any memory type (block, document, basket).
- May be user-declared or agent-inferred.
- Functions as connective tissue in the broader memory graph.

---

### 📜 `event`

- **Temporal witness** — logs immutable system actions.
- Tracks creation, updates, proposals, rejections, and composition.
- Enables auditability and agent transparency.

---

## 🧠 Mental Model Matrix

| UX Zone | Agent Role | Memory Role | Notes |
| --- | --- | --- | --- |
| Freeform input | Trigger | `raw_dump` (origin) | Never mutated |
| Suggested idea | Proposer | `block` (memory atom) | Evolves |
| Tagged meaning | Connector | `context_item` | Optional |
| Document view | Composer | `document` (expression) | Includes blocks + narrative |
| Activity feed | Observer | `event` | Auto-emitted |

---

## 🥪 Document Anatomy: The Living Sandwich

A document is not just a list of blocks. It has **three distinct layers**:

| Component | Role | Globally Reusable? |
| --- | --- | --- |
| `blocks` | Memory atoms ("fillings") | ✅ Yes |
| Narrative scaffolding | Freeform glue ("bread") | ❌ No (local only) |
| `context_items` | Semantic tags ("labels") | ✅ Yes |
- Narrative text is **persisted**, but **not reused** outside the document.
- Agents generate both block structure and scaffolding during composition.

---

## 🧪 Example: One Basket, Evolving Memory

> A founder creates a new workspace to explore GTM strategy.
> 
1. Pastes 1,000-word idea → `raw_dump`
2. Agent proposes 7 `blocks` → 4 accepted, 1 `LOCKED`
3. User creates a `document` → selects 4 blocks + edits intro/outro text
4. Agent tags with 2 `context_items`: `"product positioning"`, `"onboarding friction"`
5. All actions create `events`

Final basket contains:

- 1 `raw_dump`
- 7 `blocks` (4 accepted, 1 locked)
- 1 `document` (blocks + narrative)
- 2 `context_items`
- 10+ `events`

---

## 🧠 Final Recap

| Principle | Description |
| --- | --- |
| **Substrate, not hierarchy** | No parent/child assumptions. Each type evolves independently. |
| **Memory atoms are blocks** | Blocks are the reusable, structured units of thought. |
| **Documents are compositions** | They combine blocks and narrative glue, composed by humans or agents. |
| **Narrative is stored** | Freeform text is persisted in documents, even if not globally referenced. |
| **Agents are chefs** | Their role is to assemble documents — not just extract blocks. |

---

*Last updated 2025‑07‑25 — aligned with hardened narrative scaffolding and agent composition model.*