# Layer 1 — Infrastructure

This folder contains core infrastructure agents responsible for orchestration, monitoring, and handoff in the layered architecture.

Agents:
- **infra_observer_agent.py**: (TBD) Agent for monitoring system state and logging.
- **infra_analyzer_agent.py**: (TBD) Agent for infra-level analysis and validation.
- **infra_research_agent.py**: (TBD) Agent for infrastructure data enrichment and research.

### infra_analyzer_agent

*Checks deterministic integrity of `context_blocks`.  
v0.1 only detects duplicate labels (case-insensitive).*

Event emitted: **block.audit_report**

```json
{
  "ok": false,
  "duplicate_labels": [
    {"label": "brandvoice", "block_ids": ["…","…"]}
  ],
  "generated_at": "2025-06-02T03:05:01Z"
}
