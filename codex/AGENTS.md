# 🧠 Yarnnn Agent System — Canonical Overview

**Version 2.1 — aligned with Yarnnn Context OS Substrate (v2.1)**

---

## 💡 1. Philosophy: Agent ≠ Editor

Yarnnn is a **Context OS**, not an app.

Agents are not editors — they are **interpreters** and **composers** operating on a substrate of cognitive memory.

---

### Core Tenets

1️⃣ **Memory-first, structure-second**

- `raw_dump` = immutable user cognition
- `block` = interpreted memory atom
- `document` = composed expression, not a new source of truth

2️⃣ **User-controlled constitution**

- `blocks` evolve via lifecycle: `PROPOSED` → `ACCEPTED` → `LOCKED` → `CONSTANT`
- Agents may propose or flag, but **never silently mutate**

3️⃣ **Context-first orchestration**

- Agents operate only on blocks, context_items, and events
- No agent mutates raw text or rewrites meaning

👉 **Outcome**: All memory remains auditable, intentional, and rooted in original cognition

---

## 🧱 2. Architecture Layers

| Layer | Role | Tech |
| --- | --- | --- |
| Frontend | Capture inputs, surface memory state, trigger agent interactions | Next.js + Vercel |
| Middleware | Codex task runner + dev automation scaffold | Custom CLI + scripts |
| Backend | Hosts agent logic, tracks revisions, emits events | FastAPI + Supabase |

---

## 🧠 3. Agent Categories & Naming Conventions

| Prefix | Category | Purpose |
| --- | --- | --- |
| `orch_` | Orchestration agents | Interpret raw_dumps, propose blocks, tag context_items |
| `tasks_` | Goal agents | Compose outputs (e.g. documents, briefs) using memory substrate |
| `infra_` | Infrastructure agents | Detect contradictions, maintain integrity, validate tag consistency |

> ✅ All agent files must end with _agent.py
> 

> ✅ All agent I/O must be block- and event-based (never text overwrite)
> 

---

## 📂 4. Canonical Folder Structure

```
arduino
CopyEdit
api/
└── src/
    ├── app/
    │   ├── agent_entrypoints.py
    │   ├── agent_output.py
    │   └── agent_server.py
    ├── agents/
    │   ├── output/               # post-processing & publishing
    │   ├── runtime/              # persistent/infra agents (e.g. infra_observer_agent.py)
    │   ├── tasks/                # per-task composition agents
    │   ├── tools/                # agent tools (web_search.py, base.py)
    │   └── utils/                # shared helpers
    ├── baskets/
    ├── db/
    ├── integrations/
    ├── memory/
    │   ├── blocks/
    │   ├── context_items/
    │   ├── documents/
    │   ├── revisions/
    │   └── system_events/
    ├── models/
    ├── orchestration/
    │   └── triggers/
    ├── routes/
    ├── services/
    ├── templates/
    ├── utils/
    └── workspaces/

```

---

## 🧩 5. Memory Contract Enforcement

| Action | Result |
| --- | --- |
| Agent proposes a block | `PROPOSED` + `event` |
| User accepts a block | `ACCEPTED` + `event` |
| User locks a block | `LOCKED` + `event` |
| Agent creates document | Output linked to blocks + narrative |
| Agent tags content | Creates/updates `context_item` |
| All changes | Tracked via `revision` + `event` |

> 🧠 raw_dumps are never modified
> 
> 
> 🧠 Only `blocks` evolve. `documents` compose. `context_items` link.
> 

---

## 🧠 6. Cognitive Roles of Agents

| Agent Category | Cognitive Function | Output Type |
| --- | --- | --- |
| `orch_` | Extraction + interpretation | `block`, `context_item` |
| `tasks_` | Composition + contextual reasoning | `document`, `brief`, etc |
| `infra_` | Meta-reasoning + memory validation | `event`, `audit_report` |

---

## 🔁 7. Substrate Memory Flow (Simplified)

```mermaid
mermaid
CopyEdit
flowchart TD
    R([raw_dump])
    R -->|orch_agent| B([block])
    B -->|tasks_agent| D([document])
    B -->|tagged| C([context_item])
    D -->|semantically framed| C
    B & D --> E([event])

    style R fill:#f9f,stroke:#333,stroke-width:1px

```

---

## 🧠 8. Agent Behavior Constraints (Contracts)

- **Stateless per task**: Agents reason from current substrate snapshot, not hidden history
- **Always emit events**: Every change must emit `event` and/or `revision`
- **Immutable sources**: No overwrite of `raw_dump` or document inputs
- **Respect block lifecycle**: Only users promote memory (not agents)

---

## 🔭 9. Agent Roadmap

| Phase | Capability | Status |
| --- | --- | --- |
| 1 | Agent proposals + user validation | ✅ Live |
| 2 | Agent composition (docs, briefs, scaffolds) | ✅ Live |
| 3 | Auto-summarize baskets & scoped insights | 🧪 In Dev |
| 4 | Memory health scanning + contradiction flags | 🧪 In Dev |
| 5 | Real-time collab + inline agent suggestions | ⏳ Planned |

---

*Last updated 2025‑07‑25 — aligned with `memory_model.md` v2.1 and live substrate contract.*