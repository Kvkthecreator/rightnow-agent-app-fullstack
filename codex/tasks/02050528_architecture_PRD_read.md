## codex/tasks/02050528_architecture_PRD_read.md

📥 Codex Task: Sync Codebase with PRD Structure
Objective: Align the current codebase with the updated Product Requirements Document (PRD) located under /codex/PRD/.

📂 Read & Digest These Files:

/codex/PRD/README.md
/codex/PRD/requirements.md
/codex/PRD/agent_flows.md
/codex/PRD/frontend_contracts/task_contract.ts
/codex/PRD/frontend_contracts/task_brief_contract.ts
/codex/PRD/architecture/system_layers.md
/codex/PRD/architecture/file_structure.md
/codex/PRD/user_flows/onboarding_flow.md
/codex/PRD/user_flows/task_flow.md
/codex/PRD/erd.png (schema reference for DB)
✅ Your Job:

Analyze the PRD content.
Understand new structures: task_briefs, profile_core_data
Understand the flow: taskBrief-first, optional profileCore reuse, message logging
Understand the contract interfaces and expected frontend/backend sync
Scan the codebase (full repo):
Identify any files, folders, components, or APIs that reference or rely on:
profiles
profile_create, profile.tsx, etc.
task_types
Detect any inconsistencies with:
ERD
TypeScript contracts
Agent routing logic or session management
Produce these outputs:
✅ Discrepancy Checklist
List all mismatches between the PRD and codebase
🛠️ Codex Task Plan
Sequential tasks to fix/align architecture (grouped by frontend/backend/Supabase/utils)
Include what to rename, delete, refactor, or move
⚠️ Ambiguity Flags
Any logic gaps, contract contradictions, or unclear flow mechanics
🧩 Notes

Do not execute any changes yet — just return a diagnostic + task proposal
Once reviewed by the user, follow-ups will be approved one by one