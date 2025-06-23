# AGENTS.md

# yarnnn Agent System — Canonical Overview

**Version 1.1 — aligned with Yarnnn Context Contract Model (First Principles)**

This document explains the philosophy, roles, and durable folder layout of Yarnnn’s agent layer. It references—but does not duplicate—the **Context Contract** data model.

---

## 💡 1 Philosophy

1️⃣ **Meaning-first preservation**

- A **Raw Dump** represents intent material — durable, additive, not sacrosanct.
- The basket defends meaning via enforced blocks, not raw_dump immutability.

2️⃣ **User-controlled constitution**

- Blocks (□ / ■ / 🔒 / ★) represent **contextual contracts**, not just structure.
- Promotion to enforced state (LOCK/CONSTANT) is always user or admin controlled.

3️⃣ **Assist, propose, defend**

- Agents propose, highlight, validate — they **never silently modify or overwrite meaning**.
- Agents ensure **no contradiction enters the contract of context**.

👉 **Outcome:** Yarnnn lets builders evolve raw ideas into defended, auditable context contracts without hidden drift.

---

## 🧱 2 Stable architecture layers

| Layer | Role | Tech |  |
| --- | --- | --- | --- |
| **Frontend** | Capture raw_dumps, render contract state, surface change queues | Next.js + Vercel |  |
| **Middleware** | Codex task registry & DX automation | Custom | *codex* tasks |
| **Backend** | Orchestrate agents, enforce context contract, write **Revisions**/**Events** | FastAPI + Supabase |  |

---

## 🧠 3 Agent categories & naming

| Prefix | Category | Purpose |
| --- | --- | --- |
| `orch_` | **Orchestration agents** | Drive flows: parse raw_dumps → propose □ **PROPOSED** blocks → validate against enforced context |
| `tasks_` | **Goal agents** | Produce independent deliverables (e.g., marketing brief) using current `/snapshot` truth |
| `infra_` | **Maintenance agents** | Enforce context contract integrity (detect contradictions, guard depth, resolve lock/constant conflicts) |

👉 *All agent files end with **`_agent.py`***

---

## 🗂️ 4 Folder skeleton (durable)

```
bash
CopyEdit
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

---

## 🔖 5 Unchanging conventions

1️⃣ Supabase is the **single source of truth**; agents write via stored procedures or typed repos.

2️⃣ Every agent mutation creates:

- **Revision** (an amendment to the context contract — not just a commit)
- One or more **Event** rows (recorded in the contract audit log)

3️⃣ The authority ladder is enforced by **infra_cil_validator_agent** (Context Integrity Layer = CIL).

4️⃣ Env vars conform to `docs/env_supabase_reference.md`.

---

## 📝 6 Agent life-cycle cheat-sheet

```
pgsql
CopyEdit
User provides raw_dump → orch_block_manager_agent
                           ├─ parse & propose Blocks (state=PROPOSED)
                           └─ validate against enforced Blocks → attach VIOLATION badges
User accepts block        → state=ACCEPTED (■)
User locks block          → state=LOCKED   (🔒)
Admin promotes block      → state=CONSTANT (★, scope applied)
infra_consistency_agent nightly scan → flag stale Locks / enforce depth guard / resolve contradictions

```

👉 *No agent edits or mutates raw_dumps directly — all evolution happens through block lineage and enforced contract checks.*

---

## 🚀 7 Future evolution

- **Phase 1**: Manual promotion + CIL checks.
- **Phase 2**: Agents propose clusters, suggest contract mergers, validate namespace integrity — no silent merges.
- **Phase 3**: Real-time collaboration + merge queue — contract principles remain stable.

---

*Last updated 2025‑06‑23 — aligned with Context Contract First Principles.*