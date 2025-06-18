# AGENTS.md

# yarnnn Agent System — Canonical Overview

**Version 1.0 — aligned with Basket–Block–Lock–Constant Contract v1**

This document explains the philosophy, roles, and durable folder layout of Yarnnn’s agent layer. It references—but does not duplicate—the “rule‑of‑law” data contract.

---

## 💡 1 Philosophy

1. **Narrative‑first preservation** The immutable **Raw Dump** is sacrosanct.
2. **User‑controlled structure** Blocks (□/■/🔒/★) are promoted only by user acceptance.
3. **Assist, don’t overwrite** Agents propose, highlight, and validate—never silently modify content.

Outcome: indie builders & marketers see their thoughts evolve from chaos → clarity without hidden mutations.

---

## 🧱 2 Stable architecture layers

| Layer | Role | Tech |  |
| --- | --- | --- | --- |
| **Frontend** | Capture dumps, render narrative, surface change queue | Next.js + Vercel |  |
| **Middleware** | Codex task registry & DX automation | Custom | *codex* tasks |
| **Backend** | Orchestrate agents, enforce contract, write **Revisions**/**Events** | FastAPI + Supabase |  |

None of these roles move even as features expand.

---

## 🧠 3 Agent categories & naming

| Prefix | Category | Purpose |
| --- | --- | --- |
| `orch_` | **Orchestration agents** | Drive Domain 4 flows: parse Raw Dump → propose □ **PROPOSED** blocks; run validators; post violations |
| `tasks_` | **Goal agents** | Produce independent deliverables (e.g. marketing brief) using the current `/snapshot` truth |
| `infra_` | **Maintenance agents** | Enforce invariants (depth guard, Lock ↔ Constant conflicts, orphan checks) |

*All agent files end with **`_agent.py`**.*

---

## 🗂️ 4 Folder skeleton (durable)

```
/api/src/app/
  └── agent_tasks/
        ├── orch/
        ├── tasks/
        ├── infra/
        └── shared/
  └── middleware/codex/
  └── util/
/web/
  └── app/baskets/
  └── app/blocks/
  └── app/tasks/
  └── components/
  └── lib/supabaseClient.ts
  └── lib/agents/   # calls orchestrators, shows badges

```

Folder names are contract‑level constants; changing them requires updating this doc.

---

## 🔖 5 Unchanging conventions

1. Supabase is **single source of truth**; agents write via stored procedures or typed repos.
2. Every mutation creates: • **Revision** (commit‑like) • One or more **Event** rows.
3. Authority ladder is enforced by **infra_cil_validator_agent** (CIL badges).
4. Env vars conform to `docs/env_supabase_reference.md`.

---

## 📝 6 Agent life‑cycle cheat‑sheet

```
User dumps → orch_block_manager_agent
               ├─ parse & propose Blocks  (state=PROPOSED)
               └─ run CIL → attach VIOLATION badges
User approves   → state=ACCEPTED (■)
User locks      → state=LOCKED   (🔒)
Admin promotes  → state=CONSTANT (★, scope set)
infra_consistency_agent nightly scan → SUPERSEDE stale Locks / depth guard

```

*No agent edits Raw Dump; all authority checks route through the ladder.*

---

## 🚀 7 Future evolution (Block economy)

Phase 1: manual promotion + CIL Phase 2: agents cluster Blocks, suggest namespace mergers, but still only propose. Phase 3: merge queue & real‑time collaboration; contract remains stable.

---

*Last updated 2025‑06‑18 — first aligned release.*