## codex/tasks/20250528_newarchitecture.md

## New Architecture Overview (2025-05-28)

codex/
└── PRD/
    ├── README.md
    │   # Project Requirements & Design (PRD)
    │   A living spec that aligns engineering, product, and AI logic.
    │   Use this folder to track architecture, flows, assumptions, and contracts.
    │   
    │   ## Contents
    │   - `requirements.md` – User goals & functional expectations
    │   - `agent_flows.md` – Manager-to-agent orchestration breakdown
    │   - `task_types/` – One markdown file per supported `task_type`
    │   - `frontend_contracts/` – TypeScript shape definitions shared by FE ↔️ BE
    │   - `architecture/` – ERD, file system, system design
    │   - `user_flows/` – Onboarding flow, task execution UX logic

    ├── requirements.md
    │   ## User Goals
    │   - Help time-starved creators or small businesses execute high-leverage marketing tasks.
    │   - No need for marketing team — just describe your goal, and agents figure it out.
    │
    │   ## System Expectations
    │   - Seamless input flow (form or chat)
    │   - Agent understands & clarifies task intent
    │   - Final output must be structured and reusable (JSON or similar)
    │   - Everything stored persistently in Supabase
    │
    │   ## MVP Tasks
    │   - Profile creation & analysis
    │   - Analyze competitors
    │   - Launch 7-day strategy

    ├── erd.png
    │   (Export from dbdiagram or draw.io: Profile, Task, AgentSession, AgentMessage, etc.)

    ├── agent_flows.md
    │   ## Manager-to-Agent Flow
    │   ```mermaid
    │   flowchart TD
    │     UserInput --> Manager
    │     Manager -->|Needs clarification| ManagerClarification
    │     Manager -->|Has inputs| SpecialistAgent
    │     SpecialistAgent --> WebOutput
    │   ```
    │
    │   ## Notes
    │   - Every flow starts with `/api/agent` hitting manager
    │   - Manager either replies with clarification or dispatches to a downstream agent

    ├── task_types/
    │   └── analyze_competitors.md
    │       ## Task Type: Analyze Competitors
    │       - `id`: analyze_competitors
    │       - `agent_type`: competitor
    │       - `input_fields`:
    │         - `urls` (type: list of strings)
    │         - `niche` (optional, type: string)
    │       - `output_type`: structured
    │       - `tools`: WebSearchTool
    │       - `prompt_template`: Dynamic, based on URLs + niche
    │
    │       ## Example Output
    │       ```json
    │       {
    │         "type": "structured",
    │         "output_type": "competitor_report",
    │         "data": [ ... ]
    │       }
    │       ```

    ├── frontend_contracts/
    │   └── task_contract.ts
    │       export interface AgentMessage {
    │         id: string;
    │         task_id: string;
    │         user_id: string;
    │         agent_type: string;
    │         message_type: 'text' | 'clarification' | 'structured';
    │         message_content: {
    │           type: string;
    │           content: string;
    │         };
    │         created_at: string;
    │       }

    ├── architecture/
    │   ├── system_layers.md
    │   │   ## Stack Overview
    │   │   - Frontend: Next.js (Vercel)
    │   │   - Backend: FastAPI + OpenAI SDK (Render)
    │   │   - DB: Supabase (Postgres)
    │   │   - Codex: Developer co-agent + task automation
    │
    │   ├── legacy_decisions.md
    │   │   - ❌ Dropped webhook-based architecture (2025-05)
    │   │   - ✅ Real-time removed in favor of direct fetch + local state
    │   │   - 🧠 Switched to agent_message manual writes to control UX flow
    │
    │   └── file_structure.md
    │       ```
    │       /api/src/app
    │       ├── agent_entrypoints.py
    │       ├── agent_tasks/
    │       │   ├── strategy_agent.py
    │       │   ├── competitor_agent.py
    │       │   └── middleware/
    │       ├── util/
    │       │   ├── task_utils.py
    │       │   ├── supabase_helpers.py
    │       └── constants.py
    │
    │       /web/app
    │       ├── tasks/[taskId]/page.tsx
    │       ├── components/TaskForm.tsx
    │       └── lib/supabaseClient.ts
    │       ```

    └── user_flows/
        ├── onboarding_flow.md
        │   ## Flow: Create Profile → Analyze
        │   1. User fills profile form
        │   2. Agent deep dive questions
        │   3. Analyzer runs
        │   4. Report saved to Supabase & shown in `/profile/[id]`
        │
        └── task_flow.md
            ## Flow: Create & Run Task
            1. User lands on `/tasks`
            2. Selects task card (e.g. Analyze Competitors)
            3. Sees form based on input_fields
            4. Submits → starts agent_session
            5. Agent replies (clarification or output)
            6. Messages shown inline, live
            7. Result saved to Supabase + UI rendered
