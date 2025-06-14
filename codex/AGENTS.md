# AGENTS.md

This document outlines the agent system architecture behind yarnnn, our contextual memory platform.

It focuses on durable design principles — the roles, structure, and philosophy that guide our system — so contributors, agent designers, and maintainers work from a shared, long-term map.

# 💡 Philosophy

yarnnn is built on a wedge: from ongoing dumps to evolving memory — preserved as familiar narrative, defended through user-curated Blocks.

Our users — indie builders, creative solopreneurs, and freelance marketers — are already generating ideas and drafts using LLMs like ChatGPT. What they lack is a system that helps them see, defend, and evolve their thoughts without fragmentation or cognitive overload.

yarnnn’s promise is simple:

Preserve the user’s original narrative as the canonical memory stream (the basket).
Empower users to curate and defend key parts of that memory by promoting narrative sections into Blocks.
Assist users gently — agents highlight contradictions, redundancies, or opportunities for modularity without ever modifying or fragmenting memory silently.
Blocks are not the primary outcome of ingestion. They are downstream artifacts — created on demand, by user choice or accepted suggestion, to protect and reuse what matters.

# 🧱 Core Architecture Layers (Stable)

The yarnnn system is divided into three persistent structural layers:

Layer	Role
Frontend (Vercel + Next.js)	User interaction, task input, live rendering of the evolving memory narrative, inline promote actions
Middleware (Codex)	Developer automation, task scaffolding, Codex integration for codebase evolution
Backend (FastAPI + Supabase)	Agent orchestration, database logic, and persistent memory (baskets, promoted blocks, briefs as needed)
These layers are fixed — their responsibilities remain stable even as system features evolve.

# 🧠 Agent System Overview

Agents are organized by function, not task type. They are composable modules that support yarnnn’s core promise:

Category	Description
orch_* agents	Orchestration agents that manage narrative assist flows (e.g., highlight contradictions, suggest promotions)
tasks_* agents	Reasoning agents that operate on downstream goals (e.g., brief composition, strategy)
infra_* agents	Maintenance agents that audit, clean, or refresh underlying data (e.g., basket integrity, block map consistency)
Naming conventions (orch_, tasks_, infra_) remain stable across the codebase.

# 🗂️ Folder Structure (Directional & Durable)

/api/src/app/
├── agent_tasks/
│   ├── orch/         → Narrative orchestration agents (assist, highlight, nudge)
│   ├── tasks/        → Domain-specific reasoning agents
│   ├── infra/        → Maintenance / hygiene agents
│   └── shared/       → Prompt templates, agent utilities
├── middleware/
│   └── codex/        → Codex task registry and automation layer
├── util/             → Supabase helpers, task utilities
└── constants.py      → Shared schema constants and enums

/web/
├── app/
│   ├── baskets/      → Memory narrative workspace
│   ├── blocks/       → User-promoted context modules (browser, reuse)
│   ├── tasks/        → Structured briefs and task outputs
│   └── components/   → Shared inputs (dump area, promote buttons, etc.)
└── lib/
    ├── supabaseClient.ts
    └── agents/       → Agent trigger logic, API helpers

# 🔖 Conventions That Don’t Change

All agents use the *_agent.py suffix
Naming is always prefixed by purpose: orch_, tasks_, infra_
Orchestration always starts at /api/agent, no matter the flow
Supabase remains the single source of truth for memory data
Codex supports dev workflows via declarative task files
This document reflects Phase 1’s focus on narrative-first preservation, downstream modularity on demand, and assistive—not intrusive—agents. It should remain durable as we evolve.

# 📝 Summary

yarnnn’s agents exist to:

Preserve narrative-first memory
Empower manual promotion to Block
Assist users with gentle, transparent guidance
Enable future modular reuse without fragmenting the core memory stream

# 🚀 Future Evolution: The Block Economy
Phase 1 focuses on manual promotion + assistive guidance — creating Blocks only when the user chooses or accepts a suggestion.
However, yarnnn’s architecture is designed for future growth:
To support a richer block economy that helps users manage evolving memory at scale.
To enable agents to suggest, cluster, or recommend consolidation of blocks or memory segments, while keeping the user in control.
To provide nuanced logic distinguishing between manually promoted blocks and system-suggested candidates — always transparently surfaced, never silently modified.
This direction ensures that as memory complexity grows, yarnnn continues to help users preserve clarity without adding cognitive burden.
