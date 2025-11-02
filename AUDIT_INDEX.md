# RightNow Agent App: API Surface Audit - Complete Report

**Date**: November 2, 2025 | **Status**: Complete | **Version**: Canon v2.1

---

## Quick Navigation

### For Decision Makers
Start with **API_AUDIT.txt** for:
- Executive summary of current API layer
- V4 orphaned infrastructure status
- Gap analysis and recommendations
- Plain-text format for email/sharing

### For Developers
Start with **API_SURFACE_FINDINGS.md** for:
- Detailed route catalog
- Integration patterns and client workflows
- Data flow diagrams
- Specific implementation guidance

### For Architects
Review both documents, especially:
- Gap Analysis (API_AUDIT.txt)
- Data Flow Comparison (API_SURFACE_FINDINGS.md)
- Governance Coverage (API_AUDIT.txt)

---

## What This Audit Answers

### 1. What API endpoints exist?
**Answer**: 45+ endpoints across 25 route files
- Work orchestration: 7 endpoints
- Baskets & substrate: 6 endpoints  
- Documents: 15+ endpoints
- Reflections: 5 endpoints
- MCP integration: 6 endpoints
- Monitoring: 3+ endpoints

See: API_AUDIT.txt, "Current API Contracts"

### 2. How do external agents submit work?
**Answer**: Four patterns
- Direct queue submission (recommended): `POST /api/work/initiate`
- Basket + dump (legacy): `POST /baskets/new` + `POST /dumps/new`
- Block proposals (governed): `POST /blocks/baskets/{id}/propose` + approve
- Direct mutations (ungoverned): `POST /api/documents/compose-contextual`

See: API_AUDIT.txt, "How Clients Actually Work Today"

### 3. What approval/governance flows exist?
**Answer**: Partial implementation
- **Blocks**: Fully governed (propose → user reviews → approve → execute)
- **Documents**: Ungoverned (direct creation)
- **Reflections**: Ungoverned (direct computation)
- **V4 Plan**: Unify all three under work_sessions (not implemented)

See: API_AUDIT.txt, "Governance Coverage"

### 4. Which database tables are actively used?
**Answer**: 6 tables live, 5 orphaned
- LIVE: agent_processing_queue, baskets, blocks, proposals, documents, timeline_events
- ORPHANED: work_sessions, work_artifacts, work_checkpoints, work_iterations, work_context_mutations

See: API_AUDIT.txt, "Database Reality Check"

### 5. What's the gap between v2.1 and V4?
**Answer**: Complete infrastructure exists but unwired
- Schema: ✓ Created (Oct 31, 2025)
- Code: ✓ Implemented (UnifiedApprovalOrchestrator class)
- API: ✗ Zero routes wired to V4 components
- Evidence: grep finds zero usage in routes/ directory

See: API_AUDIT.txt, "V4 Orphaned Infrastructure"

### 6. Where do baskets/substrate/yarns fit?
**Answer**: Clear definitions
- **Basket**: UUID container (baskets table) for blocks, documents, work
- **Substrate**: Blocks + relationships + proposals + timeline (mutation layer)
- **Yarn**: Legacy term—not in current schema; "YARNNN" is naming convention only

See: API_SURFACE_FINDINGS.md, "Part 7"

---

## Current Architecture

```
Canon v2.1 (Live)
├── Work Queue Layer (agent_processing_queue)
│   ├── POST /api/work/initiate (create)
│   ├── GET  /api/work/{id}/status (poll)
│   └── Status flow: pending → claimed → processing → completed/failed
├── Substrate Governance (proposals table)
│   ├── POST /blocks/baskets/{id}/propose (create proposal)
│   ├── POST /blocks/{id}/approve (execute)
│   └── Flow: propose → user reviews → approve → execute → timeline
├── Direct Document API (documents table)
│   ├── POST /api/documents/compose-contextual
│   └─ NO approval workflow
├── Direct Reflection API (reflection_cache table)
│   ├── POST /api/reflections/compute_window
│   └─ NO approval workflow
├── MCP Integration (/mcp/*)
│   ├── OAuth/token management
│   ├── Activity logging
│   └── Basket inference
└── Monitoring & Health (/health/*, /alerts/*)
    └── Pipeline staleness, workspace health

V4 Schema Layer (Orphaned)
├── work_sessions (0 rows, never written)
├── work_artifacts (0 rows, never written)
├── work_checkpoints (0 rows, never written)
├── work_iterations (0 rows, never written)
└── work_context_mutations (0 rows, never written)

V4 Code Layer (Exists, Not Called)
└── UnifiedApprovalOrchestrator
    └── Never invoked from any API route
```

---

## Critical Findings

### Finding 1: API is Functional but Incomplete
- Current v2.1 layer works well for basic queue + proposal workflows
- 45+ endpoints cover baskets, blocks, documents, reflections
- Status quo: Blocks use governance; Documents/Reflections don't

### Finding 2: V4 Infrastructure is Ready But Orphaned
- Database schema fully defined (5 tables, 47 new fields)
- Business logic fully implemented (UnifiedApprovalOrchestrator)
- API integration: MISSING (zero routes wired)
- V4 Benefit: Would unify all mutations under single approval flow

### Finding 3: Governance Asymmetry
- Substrate mutations: Governed (propose/approve/execute)
- Document composition: Ungoverned (direct creation)
- Reflection computation: Ungoverned (direct computation)
- V4 Would Fix: All three types in unified flow

### Finding 4: Clear Adoption Decision Point
- Current: Canon v2.1 works fine for basic operations
- Options:
  1. Adopt V4 by Q1 2026 (implement 5 missing endpoints, wrap document/reflection APIs)
  2. Archive V4 schema, stick with proposal-based governance (simpler, proven)
- Deadline: Q1 2026 to decide

---

## Implementation Path (If Adopting V4)

### Phase 1: Wire V4 API (Immediate, 1-2 sprints)
```
Create 5 endpoints:
1. POST /api/work/sessions/initiate
2. POST /api/work/{id}/checkpoints/{id}/review
3. POST /api/work/{id}/review
4. GET  /api/work/{id}/artifacts
5. POST /api/work/{id}/iterate
```

### Phase 2: Unify Governance (Medium, Q4-Q1)
```
Wrap existing direct APIs:
1. Document composition in work sessions
2. Reflection computation in work sessions
3. Add timeline events for all mutations
```

### Phase 3: Finalize (Q1 2026)
```
1. Complete migration of existing flows
2. Deprecate direct document/reflection APIs (or keep for backward compat)
3. Decide: Keep V4 or revert to v2.1
```

---

## Data Flows

### Current P1_SUBSTRATE (Governed)
```
POST /baskets/new → basket_id
POST /dumps/new → dump_id
[Canonical queue claims]
P0CaptureAgent extracts blocks
GovernanceDumpProcessor creates proposals
[User approves]
POST /blocks/{id}/approve
Mutations applied + timeline recorded
```

### Current P4_COMPOSE (Ungoverned)
```
POST /api/documents/compose-contextual
Document created DIRECTLY
[No approval, no governance, no timeline]
```

### V4 Intended Flow (Not Implemented)
```
POST /api/work/sessions/create {approval_strategy}
Agent produces work_artifacts
Multi-stage checkpoints (plan → mid-work → final)
User provides per-artifact decisions
Mutations applied to substrate
Timeline + work_context_mutations recorded
```

---

## Tables Status

| Table | Rows/Day | Status | Write Source | Read Source |
|-------|----------|--------|--------------|-------------|
| agent_processing_queue | 100s-1000s | LIVE | work_status.py | queue processor |
| baskets | 10s-100s | LIVE | basket_new.py | /baskets/* |
| blocks | 100s-1000s | LIVE | P1Agent | block APIs |
| proposals | 100s | LIVE | block_lifecycle | approval flow |
| documents | 100s | LIVE | doc_composition | doc APIs |
| timeline_events | 1000s+ | LIVE | Events service | auditing |
| work_sessions | 0 | ORPHANED | (none) | (none) |
| work_artifacts | 0 | ORPHANED | (none) | (none) |
| work_checkpoints | 0 | ORPHANED | (none) | (none) |
| work_iterations | 0 | ORPHANED | (none) | (none) |
| work_context_mutations | 0 | ORPHANED | (none) | (none) |

---

## Recommendations Summary

| Priority | Action | Timeline | Impact |
|----------|--------|----------|--------|
| IMMEDIATE | Wire V4 API endpoints | 1-2 sprints | Enables multi-stage approval |
| MEDIUM | Wrap document/reflection APIs | Q4-Q1 | Unifies governance |
| LONG | Decide V4 fate | Q1 2026 | Either standard or archived |

---

## Questions & Answers

**Q: Is the current API production-ready?**
A: Yes. v2.1 is fully functional for queue submission, basket management, block governance, and direct document/reflection creation.

**Q: Why does V4 exist if it's not used?**
A: Architectural foresight. Designed to solve the governance asymmetry (blocks governed, documents/reflections not). Implementation incomplete due to scope.

**Q: Should we use V4 or stick with v2.1?**
A: Decision by Q1 2026. V4 is better for unified governance but requires 5+ sprints. v2.1 works fine if governance asymmetry is acceptable.

**Q: What happens if we don't adopt V4?**
A: Archive the orphaned tables, consolidate under proposal-based governance (simpler, proven model).

**Q: Can we use V4 incrementally?**
A: Yes. Start with work session endpoints, test with P4_COMPOSE, then gradually wrap other APIs.

---

## Document Guide

### API_AUDIT.txt (14KB)
**Use this for:** Executive overview, quick reference, presentation prep
**Contains:**
- Key findings (3 main discoveries)
- Current API contracts (by category)
- Client work submission patterns
- V4 orphaned infrastructure detail
- Database liveliness table
- Gap analysis
- Governance coverage assessment
- Recommendations by tier

### API_SURFACE_FINDINGS.md (11KB)
**Use this for:** Deep implementation planning, architecture review, developer reference
**Contains:**
- Executive summary with critical finding
- Detailed endpoint contracts
- Request/response schemas
- Complete route map (45+ endpoints)
- Data flows with diagrams
- Integration patterns
- Baskets/substrate/yarn definitions
- Governance flows explained
- Implementation recommendations
- Complete appendix with examples

---

## Audit Scope

**What was examined:**
- All route files in /api/src/app/routes/ (25 files)
- Service layer in /api/src/services/ (canonical_queue_processor, universal_work_tracker)
- Database migrations (especially 20251031_work_orchestration_layer.sql)
- Governance layer (/api/src/app/governance/unified_approval.py)
- Schema definitions and usage patterns

**What was NOT examined:**
- Frontend UI implementation
- MCP client code
- Internal agent implementations
- Test coverage

---

## Key Takeaway

**RightNow operates a functional v2.1 API with a designed-but-unwired V4 approval layer. The system works today, but has a governance gap: blocks are governed while documents and reflections bypass approval. V4 would fix this asymmetry but requires API wiring. Decision point: Q1 2026.**

---

**For detailed findings, see:**
- `/API_AUDIT.txt` - Executive summary
- `/API_SURFACE_FINDINGS.md` - Implementation guide

