  # Frontend Contracts
    │       These TypeScript interfaces ensure consistency between the frontend and backend.
    │       - `task_contract.ts` — Message schema for Agent ↔️ UI
    │       - `task_brief_contract.ts` — Shape of the TaskBrief intelligent context object

## Guidelines

- Treat these contracts as **source of truth** for any TypeScript parsing in the UI.
- Whenever a backend shape changes (e.g., new message type), update these files.
- Avoid over-typing backend logic; only include what the frontend actually uses.

