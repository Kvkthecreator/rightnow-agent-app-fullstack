# docs/BASKET_MANAGEMENT_FLOW.md
# Yarnnn Basket Management Flow — Canonical Baseline

This document defines the canonical flow for managing, enriching, and evolving a basket after it has been created. It provides a stable reference for architecture, implementation, and Codex task alignment.

---

## 1️⃣ Baskets/[id]/work — Display Domain

👑 **Purpose:**  
Present the current state of the basket to the user.

✅ **What happens in this domain:**  
- Fetch and display:
  - The original input (narrative view)
  - Blocks (promoted blocks)
  - Commit timeline (upload and agent processing history)
  - Pending change queue  
- Provide a read-only view of the basket’s current structure and content.

❌ **What this domain does *not* handle:**  
- Directly mutating basket data  
- Creating blocks  
- Triggering agents (except on explicit user actions)

👉 **Key principle:**  
The display domain shows the current basket state — it does not create or enrich content.

---

## 2️⃣ Baskets/[id]/work — Agent Enrichment + Dynamic Work Domain

👑 **Purpose:**  
Evolve the basket by enriching it with agent-driven recommendations and structural updates.

✅ **What happens in this domain:**  
- Agents may:
  - Summarize recent progress
  - Recommend next steps
  - Propose new or modified blocks
  - Populate the change queue  
- These processes run on explicit user action (e.g. “Summarize Progress”) or background triggers (e.g. auto-refresh).

❌ **What this domain does *not* handle:**  
- Collecting or storing the initial input  
- Creating the basket or initial input record  

👉 **Key principle:**  
Agent enrichment evolves the basket over time — changes flow through the change queue and commit log to preserve history.

---

## 3️⃣ User-Initiated Actions

✅ Supported actions in the work page:
- Request summary of recent commits  
- Request recommendations  
- Approve or reject proposed block changes (via the change queue)  

👉 **All such actions are logged and flow through the agent and change queue system.**

---

## 4️⃣ Design Philosophy

- Basket management is **read + enrich** — not creation.
- All structural changes flow through agents and the change queue.
- The work page provides visibility + control, not direct mutation of basket data.

---

## 5️⃣ Future Extensions

- New agent capabilities (e.g. external research, tone alignment suggestions) plug into this flow without changing its core design.
- Future UI features (e.g. visual diff views, advanced approval workflows) can layer on this foundation.

---

## 📌 Usage

This document serves as the canonical reference for basket management flows.  
All PRs, Codex tasks, and architecture decisions must align to this structure.  
Edit only for major architectural changes.

