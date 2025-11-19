# Agent Work Orchestration - Implementation Scope

**Date**: 2025-11-16
**Version**: 1.0
**Status**: Phase 0-5 Complete

---

## Executive Summary

This document captures the implementation scope for YARNNN's agent work orchestration layer, focusing on the hardened separation between **Work Supervision** (human oversight of agent outputs) and **Substrate Governance** (block lifecycle management).

**Key achievements:**
- Terminology hardened: work_outputs (not work_artifacts)
- Config consolidated: DB-first with YAML fallback
- SDK contract defined via mock implementation
- Supervision endpoints created for human review

---

## What Was Implemented

### Phase 0: Terminology Hardening ✅

**Problem:** "Artifact" was overloaded across domains causing confusion.

**Solution:**
- Database: Renamed `work_artifacts` → `work_outputs`
- Column: Renamed `artifact_type` → `output_type`
- Code: Updated 6 source files to use new names
- Documentation: Created TERMINOLOGY_GLOSSARY.md with enforcement rules

**Files Modified:**
- [supabase/migrations/20251116_rename_artifacts_to_outputs.sql](supabase/migrations/20251116_rename_artifacts_to_outputs.sql)
- [work-platform/api/src/app/routes/project_work_sessions.py](work-platform/api/src/app/routes/project_work_sessions.py)
- [work-platform/api/src/services/work_session_executor.py](work-platform/api/src/services/work_session_executor.py)
- [work-platform/api/src/services/agent_sdk_client.py](work-platform/api/src/services/agent_sdk_client.py)

**Impact:**
- work_outputs = agent deliverables (work-platform)
- reflections_artifact = P3 pipeline outputs (substrate-API)
- No more confusion between domains

---

### Phase 1: Config Consolidation ✅

**Problem:** Dual config paths (YAML + DB) created redundancy.

**Solution:** DB-first with YAML fallback strategy.

**Implementation:**
```python
# work-platform/api/src/agents/factory.py

def load_agent_config(agent_type, project_id=None):
    # 1. Load YAML defaults first (always available)
    yaml_config = load_agent_config_from_yaml(agent_type)

    # 2. Try DB config (project-specific overrides)
    if project_id:
        db_config = load_agent_config_from_db(project_id, agent_type)
        if db_config:
            # Merge: DB takes precedence
            merged_config = yaml_config.copy()
            merged_config[agent_type].update(db_config[agent_type])
            return merged_config

    # 3. Fallback to YAML
    return yaml_config
```

**Benefits:**
- Single source of truth: project_agents.config
- Deployment defaults in YAML (version controlled)
- User-specific overrides in DB
- Partial overrides supported (only specify what changes)

---

### Phase 2: SDK Contract Definition ✅

**Problem:** Unknown SDK output structure blocks architectural decisions.

**Solution:** Mock SDK that defines the expected contract.

**Created Package:**
- [work-platform/api/src/claude_agent_sdk/__init__.py](work-platform/api/src/claude_agent_sdk/__init__.py)
- [work-platform/api/src/claude_agent_sdk/interfaces.py](work-platform/api/src/claude_agent_sdk/interfaces.py)
- [work-platform/api/src/claude_agent_sdk/archetypes.py](work-platform/api/src/claude_agent_sdk/archetypes.py)

**Output Structure:**

```python
# ResearchAgent returns:
ResearchResult(
    findings=[
        ResearchFinding(
            content="...",
            confidence=0.85,
            sources=["..."],
            domain="ai_agents"
        )
    ],
    needs_review=False,
    review_reason=None
)

# Maps to work_outputs:
{
    "output_type": "research_finding",
    "content": "...",
    "metadata": {
        "confidence": 0.85,
        "sources": [...],
        "domain": "..."
    }
}
```

**Checkpoint Detection:**
- Low confidence findings (< 0.7) trigger review
- Agent can explicitly request review (needs_review=True)
- Configurable via approval_strategy

---

### Phase 3-4: Work Supervision Endpoints ✅

**Problem:** No human oversight mechanism for agent outputs.

**Solution:** Supervision API separate from Substrate Governance.

**Created:**
- [work-platform/api/src/app/routes/work_supervision.py](work-platform/api/src/app/routes/work_supervision.py)

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/supervision/sessions/{id}/outputs | List outputs for review |
| POST | /api/supervision/outputs/{id}/approve | Approve with feedback |
| POST | /api/supervision/outputs/{id}/reject | Reject with reason |
| GET | /api/supervision/sessions/{id}/summary | Review outcome summary |
| POST | /api/supervision/sessions/{id}/finalize | Finalize after review |

**Key Distinction:**
```
Work Supervision ≠ Substrate Governance

Supervision = Human reviews agent deliverables
Governance = Block lifecycle (PROPOSED → ACCEPTED → LOCKED)

These are SEPARATE domains that MAY connect later via a bridge.
```

---

### Phase 5: Integration Test ✅

**Documentation:** [AGENT_EXECUTION_INTEGRATION_TEST.md](AGENT_EXECUTION_INTEGRATION_TEST.md)

**Flow Validated:**
1. Create work session → session_id returned
2. Execute agent → outputs stored in work_outputs
3. Review outputs → approve/reject individual items
4. Finalize session → final status determined

---

## What Was NOT Implemented (Intentionally Deferred)

### 1. Direct agent_orchestration Wiring 🔄

**Current State:**
- agent_orchestration.py creates agent and returns raw SDK result
- WorkSessionExecutor exists but not called from orchestration routes

**Gap:**
```python
# Current (agent_orchestration.py)
agent = create_research_agent(...)
result = await agent.monitor()
return result  # Raw SDK result, NOT stored as work_outputs

# Needed
session = create_work_session(...)
executor.execute_work_session(session.id)  # Stores outputs automatically
return {"session_id": session.id}
```

**Why Deferred:** Requires refactoring existing orchestration layer. Current pattern works for testing but doesn't integrate with supervision.

**Future Work:** Connect orchestration routes to WorkSessionExecutor.

---

### 2. Checkpoint Resumption 🔄

**Current State:**
```python
async def resume_from_checkpoint(self, session_id, checkpoint_id):
    raise NotImplementedError("Checkpoint resumption coming in Phase 2.2")
```

**Why Deferred:** Requires:
- Agent state serialization
- Context restoration
- Partial execution handling

**Future Work:** Implement when iterative refinement is needed.

---

### 3. Substrate Governance Bridge 🔄

**Current State:** Approved work_outputs stay in work_outputs table.

**Needed:**
```python
# When output approved
if output.status == "approved":
    # Bridge to substrate
    substrate_client.create_proposal(
        basket_id=session.basket_id,
        block_data=output_to_block(output)
    )
```

**Why Deferred:** Intentionally separate domains. Bridge is a future concern.

**Future Work:** Optional bridge that creates block proposals from approved outputs.

---

### 4. Scheduled Execution (Execution Modes) 🔄

**Current State:** Agents run on-demand only.

**Config Structure Exists:**
```yaml
# research.yaml
schedule:
  cron: "0 6 * * *"  # Daily at 6am
  timezone: "UTC"
```

**Why Deferred:** Not mission critical for MVP. On-demand execution sufficient.

**Future Work:** Cron job integration when autonomous agents needed.

---

### 5. Real Claude Agent SDK 🔄

**Current State:** Mock SDK defines contract.

**Why Deferred:** Real SDK not available yet.

**Future Work:** Replace mock package with actual SDK when released.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    User/Frontend                             │
│              (React SPA on work-platform web)                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────────┐
│                  Work Platform API                           │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐          │
│  │  Projects   │ │   Work      │ │  Supervision │          │
│  │  Endpoints  │ │  Sessions   │ │  Endpoints   │          │
│  └─────────────┘ └─────────────┘ └──────────────┘          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Work Session Executor                           │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐          │
│  │   Agent     │ │   Output    │ │  Checkpoint  │          │
│  │   Factory   │ │   Parser    │ │  Handler     │          │
│  └─────────────┘ └─────────────┘ └──────────────┘          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Substrate Memory Adapter                       │
│  ┌─────────────────────────────────────────┐                │
│  │  BFF Pattern: HTTP to substrate-api     │                │
│  │  Injects: reference_assets, agent_config│                │
│  └─────────────────────────────────────────┘                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP (service-to-service)
┌─────────────────────▼───────────────────────────────────────┐
│                   Substrate API                              │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐          │
│  │   Blocks    │ │  Reference  │ │   Proposals  │          │
│  │   (text)    │ │   Assets    │ │ (governance) │          │
│  └─────────────┘ └─────────────┘ └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## File Summary

### Created This Session

| File | Purpose |
|------|---------|
| `supabase/migrations/20251116_rename_artifacts_to_outputs.sql` | DB table rename |
| `docs/canon/TERMINOLOGY_GLOSSARY.md` | Terminology enforcement |
| `work-platform/api/src/claude_agent_sdk/*` | Mock SDK contract |
| `work-platform/api/src/app/routes/work_supervision.py` | Human oversight API |
| `work-platform/api/tests/test_sdk_black_box.py` | SDK output documentation |
| `docs/AGENT_EXECUTION_INTEGRATION_TEST.md` | End-to-end flow test |

### Modified This Session

| File | Changes |
|------|---------|
| `work-platform/api/src/agents/factory.py` | DB-first config loading |
| `work-platform/api/src/services/agent_sdk_client.py` | output_type mapping |
| `work-platform/api/src/services/work_session_executor.py` | work_outputs table |
| `work-platform/api/src/app/routes/*.py` | work_outputs references |

---

## Key Decisions Made

1. **Terminology**: work_outputs (not artifacts) ✅
2. **Config Strategy**: DB-first with YAML fallback ✅
3. **Return Type**: session_id only (Option A) ✅
4. **Work Request/Session**: 1:1 relationship ✅
5. **Supervision vs Governance**: Separate domains ✅
6. **SDK Testing**: Two-phase (mock first, integration later) ✅

---

## Recommended Next Steps

### Immediate (Before Next Session)

1. **Register supervision router** in main FastAPI app
2. **Test supervision endpoints** with real work_outputs data
3. **Wire agent_orchestration** to use WorkSessionExecutor

### Short-term (Next 1-2 Weeks)

1. **Build substrate governance bridge** (optional, when needed)
2. **Implement checkpoint resumption** for iterative refinement
3. **Add frontend UI** for output review

### Medium-term (Next Month)

1. **Replace mock SDK** with real implementation
2. **Add scheduled execution** for autonomous agents
3. **Performance optimization** for high-volume scenarios

---

## Final Notes

This implementation establishes the foundational contract for agent work orchestration without over-engineering. The key insight is that **Work Supervision** (human oversight) and **Substrate Governance** (block lifecycle) are intentionally separate domains that may connect via an optional bridge.

The mock SDK serves as documentation of our expectations. When the real SDK is available, we'll adjust the output parsing logic accordingly. The deferred items are not blockers for MVP functionality.

**Total commits:** 5
- Phase 0: Terminology hardening
- Phase 1: Config consolidation
- Phase 2: Mock SDK contract
- Phase 3-4: Supervision endpoints
- Phase 5: Integration test

---

**End of Implementation Scope**
