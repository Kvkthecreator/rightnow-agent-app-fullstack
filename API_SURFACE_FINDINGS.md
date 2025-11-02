# API Surface Analysis: Current vs. V4 Architecture

## Executive Summary

The RightNow Agent App runs on **Canon v2.1** with a functional but incomplete V4 schema layer. The critical finding: **V4 unified approval infrastructure (work_sessions, work_artifacts, work_checkpoints) exists in database and code but has ZERO API integration—it's orphaned.**

---

## Part 1: Current API Contracts (What Works Today)

### Universal Work Orchestration (7 endpoints)
```
GET  /api/work/health                              # Queue health metrics
GET  /api/work/{work_id}/status                    # Single work status  
GET  /api/work/?work_type=&status=&basket_id=      # List with filters
POST /api/work/initiate                            # Create async work
POST /api/work/{work_id}/retry                     # Retry failed work
GET  /api/work/{work_id}/cascade                   # Cascade flow status
GET  /api/work/workspace/{workspace_id}/summary    # Workspace summary
```

**Source**: `routes/work_status.py`
**Database**: `agent_processing_queue` (canonical_queue)
**Status States**: `pending` → `claimed` → `processing` → `cascading` → `completed`/`failed`

### Basket Management
```
POST /baskets/new                                  # Idempotent creation
GET  /baskets/{basket_id}/snapshot                 # Contents snapshot
```

**Note**: Idempotency via `idempotency_key` field prevents duplicates

### Substrate Governance (Proposal Flow)
```
GET  /baskets/{basket_id}/blocks                   # List blocks (read-only)
POST /blocks/baskets/{basket_id}/propose           # Create proposal
POST /blocks/{block_id}/approve                    # Execute approval
POST /blocks/{block_id}/reject                     # Reject proposal
GET  /blocks/baskets/{basket_id}/proposed          # List pending
```

**Flow**: propose → (user reviews) → approve → execute → timeline recorded

### Document & Reflection APIs (UNGOVERNED - Direct Operations)
```
POST /api/documents/compose-contextual             # Create document directly
PUT  /api/documents/{document_id}/recompose-contextual
POST /api/reflections/compute_window               # Compute reflections directly
POST /api/reflections/compute_event
POST /api/reflections/documents/{document_id}/compute
```

**Critical Issue**: No governance wrapper. Mutations bypass all approval.

### MCP Integration
```
POST /mcp/auth/sessions                            # OAuth token storage
POST /mcp/auth/sessions/validate
POST /mcp/activity/                                # Activity logging
GET  /mcp/activity/summary
POST /mcp/baskets/infer                            # Fingerprint inference
```

### Monitoring
```
GET  /health/basket/{basket_id}
GET  /health/workspace/{workspace_id}
GET  /alerts/current
```

---

## Part 2: How Clients Actually Submit Work

### Option A: Direct Queue (Recommended)
```python
POST /api/work/initiate {
  "work_type": "P1_SUBSTRATE|P4_COMPOSE|P3_REFLECTION|...",
  "basket_id": "uuid",
  "payload": {...},
  "priority": 1-10
}
→ Returns: work_id for polling
```

### Option B: Basket + Dump (Legacy)
```python
POST /baskets/new → basket_id
POST /dumps/new → dump_id
# Awaits canonical queue to process
```

### Option C: Governed Block Proposal
```python
POST /blocks/baskets/{id}/propose → proposal created
POST /blocks/{id}/approve → proposal executed
```

### Option D: Direct Document (UNGOVERNED)
```python
POST /api/documents/compose-contextual {
  "basket_id": "uuid",
  "intent": "string"
}
→ Document created immediately, no approval
```

---

## Part 3: The V4 Orphaned Layer

### Schema Created (October 31, 2025)
Migration `20251031_work_orchestration_layer.sql` created:
- `work_sessions` - Task containers with approval strategy
- `work_artifacts` - Typed outputs (block_proposal, document_creation, etc.)
- `work_checkpoints` - Multi-stage approval gates
- `work_iterations` - Feedback loops
- `work_context_mutations` - Audit trail of mutations

### Code Implemented
File: `governance/unified_approval.py` contains:
```python
class UnifiedApprovalOrchestrator:
    async def review_work_session(
        work_session_id: UUID,
        user_id: UUID,
        decision: WorkReviewDecision  # work_quality + per-artifact decisions
    ) → WorkReviewResult
```

Supports:
- Multi-stage checkpoints (plan_approval, mid_work_review, artifact_review, final_approval)
- Per-artifact decisions (apply_to_substrate, save_as_draft, reject)
- Risk assessment and iteration feedback

### Missing: API Integration
```bash
$ grep -r "work_sessions\|work_artifacts\|work_checkpoints" /api/src/app/routes
# Output: (ZERO matches)
# Only reference: governance/unified_approval.py (called from nowhere)
```

**What Should Exist**:
```
POST /api/work/sessions/create                     # ✗ MISSING
POST /api/work/{id}/checkpoints/{id}/review        # ✗ MISSING
POST /api/work/{id}/review                         # ✗ MISSING (main approval)
GET  /api/work/{id}/artifacts                      # ✗ MISSING
POST /api/work/{id}/iterate                        # ✗ MISSING
```

---

## Part 4: Gap Analysis

| Feature | v2.1 | V4 Design | Gap |
|---------|------|-----------|-----|
| Work creation | ✓ queue | ✓ sessions | Missing session API |
| Status tracking | ✓ | ✓ (reuses) | None |
| Single approve/reject | ✓ | ✗ | Removed for multi-stage |
| Per-artifact decisions | ✗ | ✓ | **Missing API** |
| Multi-stage approval | ✗ | ✓ | **Missing API** |
| Iteration/feedback | ~ (retry only) | ✓ | **Missing API** |
| Document governance | ✗ | ✓ (planned) | Not wired |
| Reflection governance | ✗ | ✓ (planned) | Not wired |

---

## Part 5: Database Reality Check

| Table | Current Use | Write Source | Read Source | Status |
|-------|------------|--------------|-------------|---------|
| agent_processing_queue | 100s-1000s/day | work_status.py, queue processor | queue processor | **LIVE** |
| baskets | 10s-100s/day | basket_new.py | all /baskets/* | **LIVE** |
| blocks | 100s-1000s/day | P1Agent, block_lifecycle.py | analysis APIs | **LIVE** |
| proposals | 100s/day | block_lifecycle.py | approval flow | **LIVE** |
| documents | 100s/day | document_composition.py | doc APIs | **LIVE** |
| timeline_events | 1000s+/day | Events service | auditing, health | **LIVE** |
| work_sessions | 0/day | *(none)* | *(none)* | **ORPHANED** |
| work_artifacts | 0/day | *(none)* | *(none)* | **ORPHANED** |
| work_checkpoints | 0/day | *(none)* | *(none)* | **ORPHANED** |
| work_iterations | 0/day | *(none)* | *(none)* | **ORPHANED** |
| work_context_mutations | 0/day | *(none)* | *(none)* | **ORPHANED** |

---

## Part 6: Data Flows

### Current P1_SUBSTRATE Flow
```
POST /baskets/new + POST /dumps/new
  ↓
Canonical queue processor claims work
  ↓
P0CaptureAgent: dump → blocks (semantic extraction)
  ↓
GovernanceDumpProcessor: creates proposals
  ↓
[User reviews]
  ↓
POST /blocks/{id}/approve
  ↓
proposal_executions.execute()
  ↓
blocks updated, timeline_events recorded
```

### Current P4_COMPOSE Flow
```
POST /api/documents/compose-contextual
  ↓
Document service reads basket blocks
  ↓
Composition agent synthesizes document
  ↓
documents table created DIRECTLY
  ↓
[NO APPROVAL WORKFLOW]
  ↓
No timeline event, no governance
```

### Intended V4 Flow (Not Implemented)
```
POST /api/work/sessions/create {approval_strategy: "checkpoint_required"}
  ↓
Agent executes, produces work_artifacts
  ↓
Checkpoint 1: Plan approval
  ↓
Checkpoint 2: Mid-work review
  ↓
Checkpoint 3: Final artifact review + approval
  ↓
User provides per-artifact decisions:
   - APPLY_TO_SUBSTRATE → mutations applied
   - SAVE_AS_DRAFT → archived without mutation
   - REJECT → discarded
  ↓
work_sessions marked approved
  ↓
All mutations recorded in work_context_mutations + timeline_events
```

---

## Part 7: Integration Points (What Agents/UI Actually Call)

### External Clients Use:
```
✓ GET  /api/work/{id}/status           (polling for completion)
✓ POST /api/work/initiate              (queue submission)
✓ POST /baskets/new                    (container creation)
✓ POST /blocks/baskets/{id}/propose    (substrate governance)
✓ POST /blocks/{id}/approve            (approval execution)
✓ POST /api/documents/compose          (direct document creation)
✓ POST /api/reflections/compute        (direct reflection creation)
✓ POST /mcp/activity/                  (MCP activity logging)

✗ POST /api/work/sessions/create       (would use V4 flow)
✗ POST /api/work/{id}/review           (unified approval)
✗ POST /api/work/{id}/iterate          (rework feedback)
```

### Baskets/Substrate/Yarns:
- **Basket**: UUID container (baskets table) for blocks, documents, work
- **Substrate**: Blocks + relationships + proposals + timeline (mutation layer)
- **Yarn**: Legacy concept—not in current schema. "YARNNN" is naming convention.

---

## Part 8: Governance Flows

### Substrate Governance (Currently Only Governed)
```
1. propose: creates proposals.status='pending'
2. user reviews in UI
3. approve: executes mutations, records in timeline
```

### Document Governance (Currently UNGOVERNED)
```
1. POST /api/documents/compose-contextual
2. Creates documents directly
3. NO proposal, NO approval, NO timeline event
```

### V4 Unified Approval (Schema Ready, API Missing)
```
1. Would support multi-stage checkpoints
2. Would support per-artifact decisions
3. Would wrap all mutation types
4. Status: Code + database ready, ZERO API routes
```

---

## Part 9: Recommendations

### Immediate (Wire V4)
1. Create work session endpoints:
   ```
   POST /api/work/sessions/initiate
   GET  /api/work/sessions/{session_id}
   POST /api/work/{id}/checkpoints/{id}/review
   POST /api/work/{id}/review
   ```

2. Add iteration support:
   ```
   POST /api/work/{id}/iterate (with feedback)
   ```

3. Test with P4_COMPOSE flow first

### Medium Term (Unify Governance)
1. Wrap document composition in work sessions
2. Wrap reflections in work sessions
3. Ensure all mutations → timeline_events

### Long Term (Decide V4 Fate)
- Deadline: Q1 2026
- If not adopted: archive orphaned tables, consolidate under proposals
- If adopted: make it the standard governance model

---

## Appendix: Complete Route Map

**45+ Total Routes Across 25 Files:**

| Category | Routes | File |
|----------|--------|------|
| Work Orchestration | 7 | work_status.py |
| Basket Management | 2 | basket_new.py, basket_snapshot.py |
| Blocks/Governance | 6 | blocks.py, block_lifecycle.py |
| Documents | 15+ | document_composition.py |
| Reflections | 5 | reflections.py |
| MCP | 10 | mcp_*.py (auth, activity, oauth, inference) |
| Health/Monitoring | 5+ | p3_p4_health.py, alerts.py |
| Narrative | 4 | narrative_intelligence.py, narrative_jobs.py |
| Context Intelligence | 13 | context_intelligence.py |
| Other | ~10 | agents.py, inputs.py, task_*, integrations.py, etc. |

---

## Key Takeaway

**Status**: RightNow operates on Canon v2.1 with functional work queue. V4 unified approval layer is fully designed (schema + code) but completely unwired from API. The disconnect: V4 targets a future where all mutations (blocks, documents, reflections) flow through unified governance; today, only block proposals use governance while documents and reflections bypass it entirely.

**Decision Point**: Adopt V4 API routes by Q1 2026 or archive the orphaned schema layer and stick with proposal-based governance.

