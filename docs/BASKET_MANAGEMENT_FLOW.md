# Yarnnn Basket Management Flow — Canonical Baseline

This document defines the canonical flow for managing, enriching, and evolving a basket after it has been created. It is the stable reference for architecture, implementation, and Codex task alignment.

---

## ⚙️ **Data-Integrity Rules**

- **raw_dumps.basket_id** — **required** → FK `baskets.id` (`ON DELETE CASCADE`)
    
    > Deleting a basket automatically removes all associated raw_dumps (intent material).
    > 
- **baskets.raw_dump_id** — optional pointer to the *initial* raw_dump
    
    > FK rule: ON DELETE SET NULL — removing the dump does not break the basket (the basket persists as the container of the evolving contract).
    > 

---

## 1️⃣ **Baskets/[id]/work — Display Domain**

👑 **Purpose:**

Render the current **context contract state** of the basket for the user.

✅ **What happens:**

- Fetch and display:
    - The intent material (raw_dumps narrative view)
    - Enforced and approved blocks (LOCKED, CONSTANT, ACCEPTED)
    - Audit trail (revision + event timeline)
    - Pending change queue
- Provide a read-only window into the basket’s current contract of meaning.

❌ **What this domain does *not* handle:**

- Mutating basket or block data
- Creating new blocks
- Running agents (except via explicit user trigger)

👉 **Key principle:**

Display domain = *transparency + trust*. No silent changes, no hidden mutations.

---

## 2️⃣ **Baskets/[id]/work — Agent Enrichment + Dynamic Work Domain**

👑 **Purpose:**

Evolve the basket’s contract of meaning through agent proposals and validations.

✅ **What happens:**

- Agents (triggered by user action or background flows) may:
    - Summarize contract state or progress
    - Propose new or updated blocks (PROPOSED state)
    - Recommend structural improvements
    - Populate the change queue
    - Validate against enforced blocks (prevent contradictions)

❌ **What this domain does *not* handle:**

- Collecting initial intent material
- Creating basket or raw_dump records

👉 **Key principle:**

All changes to the basket’s contract flow through agent proposals → user validation → revision + event log — **no hidden mutations**.

---

## 3️⃣ **User-Initiated Actions**

✅ Supported actions on the work page:

- Request contract summary or progress report
- Request agent recommendations
- Approve / reject proposed block changes (via change queue)

👉 **All actions are logged — lineage is durable and auditable.**

---

## 4️⃣ **Design Philosophy**

- Basket management is **read + enrich + defend** — not create.
- All structural evolution flows through the agent + change queue + validation system.
- The work page provides clarity and control over the basket’s contract — **no direct raw data mutation outside this flow**.

---

## 5️⃣ **Future Extensions**

- New agent capabilities (e.g. external research, semantic diffing, tone alignment) plug into this flow without altering core principles.
- Future UI features (e.g. visual contract diffs, advanced approval workflows) extend visibility + control — not structure-breaking changes.

---

## 📌 **Usage**

👉 This document is the **canonical reference for basket management flows**.

👉 All PRs, Codex tasks, and architectural decisions must conform to this model.

👉 Edits are only permitted for major architectural shifts.

---

*Last updated 2025‑06‑23 — aligned with Context Contract First Principles.*