# docs/BASKET_AND_BLOCK_MODEL.md

# Yarnnn Canonical Model — Basket, Block, and Their Interactions

**Version 1.0 — aligned with Basket–Block–Lock–Constant Contract v1**

This file defines *business semantics* (names, statuses, relationships). DB DDL lives in the contract.

---

## 🟣 Basket

| Field         | Type                                      | Purpose               |
| ------------- | ----------------------------------------- | --------------------- |
| `id`          | uuid                                      | Primary key           |
| `user_id`     | uuid                                      | Owner                 |
| `name`        | text (optional)                           | Human label           |
| `raw_dump_id` | uuid                                      | Immutable first input |
| `state`       | `INIT` → `ACTIVE` → `ARCHIVED/DEPRECATED` | Lifecycle             |
| `tags`        | text\[]                                   | High‑level metadata   |
| `commentary`  | text                                      | Basket‑level notes    |

> **State definitions**
> • **INIT** – created, not yet enriched
> • **ACTIVE** – blocks being added/edited
> • **ARCHIVED** – final reference
> • **DEPRECATED** – superseded by another basket

---

## 🟣 Block

| Field             | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `id` (uuid)       | PK                                                                     |
| `basket_id`       | FK                                                                     |
| `parent_block_id` | Enables hierarchy                                                      |
| `semantic_type`   | e.g. `task`, `brand_name`, `tone`, `identity`                          |
| `content`         | Markdown / JSON                                                        |
| `version`         | Int auto‑increment                                                     |
| `state`           | `PROPOSED`, `ACCEPTED`, `LOCKED`, `CONSTANT`, `SUPERSEDED`, `REJECTED` |
| `scope`           | null / `WORKSPACE` / `ORG` / `GLOBAL` (only for Constants)             |
| `canonical_value` | Authoritative string/JSON (Locks & Constants)                          |
| `origin_ref`      | raw\_dump, file, or block UUID                                         |
| `meta_tags`       | text\[]                                                                |

### State meanings

* **PROPOSED** – awaiting approval
* **ACCEPTED (■)** – part of basket meaning
* **LOCKED (🔒)** – frozen in this basket
* **CONSTANT (★)** – workspace/org/global authority
* **SUPERSEDED** – replaced by newer Constant/Lock
* **REJECTED (✕)** – discarded proposal

---

## 🟣 Relationships & flow

```
Basket (ACTIVE)
  ├─ Block PROPOSED   → user approves → ■ ACCEPTED
  ├─ Block ACCEPTED   → owner locks   → 🔒 LOCKED
  └─ Block LOCKED     → promote       → ★ CONSTANT (scope=WORKSPACE)
```

* Basket **state** advances automatically when all narrative blocks reach ACCEPTED/LOCKED.
* Revisions capture every transition; Events feed validators & UIs.

---

## 🟣 Design rules

1. Basket is the *whole*, Blocks are *parts*; history + RawDump make the whole > Σparts.
2. Locks protect meaning *locally*; Constants protect meaning *across baskets* within `scope`.
3. Narrative view assembles **ACCEPTED** + **LOCKED** content blocks in `order` (if set).
4. Agents never mutate RawDump; they propose Blocks.

---

## 📌 Usage

This model is authoritative for naming, statuses, and relationships. Schema migrations or API designs that diverge require an update here **and** in the contract.
