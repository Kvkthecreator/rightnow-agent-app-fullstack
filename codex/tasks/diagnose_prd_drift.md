
## codex/tasks/diagnose_prd_drift.md

---

## Codex Task: PRD Diagnostic & Patch Plan (v20250528)

### ✨ Task Name:
PRD Sync Diagnostic & Patch Plan

### 🌟 Objective:
Scan the codebase for divergence from the latest `/codex/PRD/` architecture. Output a detailed audit + patch plan with proposed refactors.

---

### 🧩 Phase 1: Audit (read-only)

#### Files to read:
- `codex/PRD/architecture/file_structure.md`
- `codex/PRD/architecture/system_layers.md`
- `codex/PRD/frontend_contracts/task_contract.ts`
- `codex/PRD/frontend_contracts/task_brief_contract.ts`
- `codex/PRD/user_flows/onboarding_flow.md`
- `codex/PRD/user_flows/task_flow.md`
- `codex/PRD/erd.png`
- All actual code in:
  - `/api/`
  - `/web/app/`
  - `/web/components/`
  - `/web/lib/`
  - `/supabase/migrations/`

#### Audit Goals:
- [ ] Identify files that do not match PRD system layers or structure
- [ ] Flag legacy references to `profile_create`, `task_types`, `profile_report_sections`
- [ ] Detect usage of outdated contracts vs. new ones in `task_contract.ts`, `task_brief_contract.ts`
- [ ] Validate presence of new schema (`task_briefs`, `profile_core_data`) in backend/db
- [ ] Highlight logic drift in `/api/agent` endpoints

---

### 🛠 Phase 2: Output Format

Please return this object:

```ts
{
  backend: CodexTask[];
  frontend: CodexTask[];
  db: CodexTask[];
  utils: CodexTask[];
  deprecated: string[]; // File or folder paths
}

interface CodexTask {
  title: string;
  file_path: string;
  description: string;
  estimated_effort: 'low' | 'medium' | 'high';
}
```

---

### 🚫 Exclusions:
- Ignore task_outputs, reports, or agent_sessions for now
- Do not execute tasks, only return roadmap

---

Ready for review and sync by human team after diagnostic output.
