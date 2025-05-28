

## Contents
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
