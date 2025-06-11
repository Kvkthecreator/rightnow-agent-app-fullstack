# AGENTS.md

This document outlines the agent system architecture behind **yarnnn**, our context-first execution platform.

It is intentionally focused on what **does not change** — the roles, structure, and system philosophy — rather than volatile implementation details. Treat this as a durable map for contributors, agent designers, and system maintainers.

---


## 💡 Philosophy

yarnnn is built on a wedge: **from ongoing dumps to evolving memory**.

Our users — indie builders, creative solopreneurs, and freelance marketers — are already using tools like ChatGPT. What they lack is a system that keeps up with them: something that **remembers, organizes, and grows** with everything they share.

At the core of yarnnn is a **persistent contextual memory**. As users continuously drop ideas, links, and fragments, yarnnn parses and structures them into reusable blocks — creating a long-term memory layer that supports future tasks like content creation, strategy, or analysis.

Unlike one-off chats or static notes, yarnnn is **live**, **structured**, and **designed to stay with you** — providing durable context that evolves alongside your work.


---

## 🧱 Core Architecture Layers (Stable)

The yarnnn system is divided into **three persistent structural layers**:

| Layer      | Role                                                                 |
|------------|----------------------------------------------------------------------|
| **Frontend (Vercel + Next.js)**   | User interaction, task input, chat UI, and live rendering of agent messages |
| **Middleware (Codex)**            | Developer-facing automation, task scaffolding, Codex agent integration       |
| **Backend (FastAPI + Supabase)**  | Agent orchestration, database logic, and persistent memory (context blocks, briefs, sessions) |

> These layers are fixed — even as individual components evolve, their responsibilities stay the same.

---

## 🧠 Agent System Overview

Agents in yarnnn are organized by **function**, not task. They are composable modules aligned to backend responsibilities:

| Category         | Description                                                                            |
|------------------|----------------------------------------------------------------------------------------|
| `orch_*` agents  | Orchestration agents that manage flows (e.g., block classification, brief composition) |
| `tasks_*` agents | Executable agents that perform reasoning on a goal (e.g., strategy, competitor, content) |
| `infra_*` agents | Maintenance agents that audit, clean, or refresh stored context blocks                |

> This naming convention is stable and used throughout the backend codebase.

---

## 🗂️ Folder Structure (Directional & Durable)

This structure reflects our long-term architectural commitments:

```text
/api/src/app/
├── agent_tasks/
│   ├── orch/         → Orchestration agents (e.g., block manager, brief composer)
│   ├── tasks/        → Domain-specific task agents
│   ├── infra/        → System hygiene agents
│   └── shared/       → Prompt templates, common agent utilities
├── middleware/
│   └── codex/        → Codex task registry and execution layer
├── util/             → Supabase helpers, task utils
└── constants.py      → Shared schema constants and enums

/web/
├── app/
│   ├── baskets/      → Initial dump flow
│   ├── blocks/       → Context memory browser
│   ├── tasks/        → Structured briefs and agent sessions
│   └── components/   → Shared input UI (dump area, upload, etc.)
└── lib/
    ├── supabaseClient.ts
    └── agents/       → Triggers and helper logic for agent execution


---

## 🔖 Conventions That Don’t Change

- All agents use the `*_agent.py` suffix
- Naming is always prefixed by purpose: `orch_`, `tasks_`, `infra_`
- Orchestration always starts at `/api/agent`, no matter the task
- Supabase remains our single source of truth
- Codex will continue to support dev workflows via declarative task files

---

> For evolving task logic, see `codex/PRD/agent_flows.md` and `task_types/`
> This document is meant to remain consistent even as tools and flows evolve.