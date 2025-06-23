# Yarnnn Basket Creation Flow — Canonical Baseline

---

## 1️⃣ **Create Basket — Inputs**

👑 **Purpose:**

Capture the user’s **atomic intent material** — base text + optional modalities (e.g. files) — that will provide input for the evolving context contract.

✅ **What happens:**

- **Basket + input records are created immediately** → resilient core intent capture.
- Modalities (e.g., files) are handled in sidecar subflows that do **not block basket creation**.
- Each raw_dump is durable and additive — part of the material record for contract formation.

---

## 2️⃣ **Create Basket — Persist + Trigger Agent**

👑 **Purpose:**

Persist the basket and its input material, and trigger orchestration agents to begin proposing atomic clauses (blocks).

✅ **What happens:**

- **Step 1 → raw_dump insert** (durable intent material captured, additive — not immutable sacred snapshot)
- **Step 2 → basket insert** (linked to raw_dump; forms the context container)
- **Step 3 → orchestration agent fires** (e.g., `orch_block_manager_agent`)
- Modality sidecar handling continues in parallel.

---

## 🌱 **Design Comments**

📌 Modalities are additive — their failure or delay does **not block base basket creation**.

📌 Future modalities (e.g., audio, rich media) follow this same decoupled pattern — **no further doc changes expected**.

📌 The basket becomes **ACTIVE** once initial orchestration completes and proposals (blocks) are ready for user review.

📌 All enrichment begins via agents; no direct raw_dump mutation or silent modifications occur.

---

*Last updated 2025‑06‑23 — aligned with Context Contract First Principles.*