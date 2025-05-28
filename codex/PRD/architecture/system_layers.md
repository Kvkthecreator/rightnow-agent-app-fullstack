## Stack Overview

### Frontend
- Framework: **Next.js (App Router)**
- Hosting: **Vercel**
- Theme: **Tailwind + shadcn/ui**
- State: React local state; Supabase reads (no realtime)
- Messaging: Manual fetch and state update via `/api/agent`

### Backend
- Framework: **FastAPI**
- Hosting: **Render**
- Agent runtime: **OpenAI Agents SDK**
- Tools: `WebSearchTool`, deterministic output types (structured/clarification)

### Database
- Provider: **Supabase (Postgres)**
- Used for:
  - Persistent storage (tasks, messages, reports)
  - Fetch agent messages (local state pull)
  - Profile/task-brief data

### Codex
- Role: Developer assistant for architecture scaffolding + debugging
- Codex Tasks:
  - `agent:add`: scaffold new agents
  - `tasktype:add`: create new task_type files
  - `fix:frontend`: patches FE/BE mismatch bugs
  - `docs:update`: refreshes PRD/ERD/flows automatically
