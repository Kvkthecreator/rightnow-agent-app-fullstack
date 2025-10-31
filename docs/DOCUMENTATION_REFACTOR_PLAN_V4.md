# Documentation Refactoring Plan: Context OS → AI Work Platform

**Status**: 📋 Planning Phase
**Version**: 4.0 (Major Paradigm Shift)
**Date**: 2025-10-31
**Author**: Strategic Architecture Review

---

## 🎯 Strategic Shift

### Old Paradigm (v3.1): "Context OS"
**Philosophy**: Memory-first cognitive system for context management
**Core Value**: Substrate governance, immutable memory, narrative composition
**Primary User**: Human managing their knowledge substrate
**Agent Role**: Assistant that interprets and composes from substrate

### New Paradigm (v4.0): "AI Work Platform"
**Philosophy**: Work-first platform where context enables superior agent supervision
**Core Value**: Work quality governance, agent work management, context-powered reasoning
**Primary User**: Human supervising agent work and reviewing outputs
**Agent Role**: Autonomous worker that produces artifacts requiring human approval

### The Integration Thesis

> "YARNNN's substrate + governance architecture enables **superior agent work management** because:
> 1. Deep context understanding improves agent reasoning quality
> 2. Substrate lineage enables work provenance and debugging
> 3. Unified governance spans both work quality AND context updates
> 4. Timeline tracking provides complete agent accountability"

---

## 📊 Current Documentation State Analysis

### Canon Documents (18 files)

#### ✅ **Still Relevant** (Foundation)
- `YARNNN_SUBSTRATE_CANON_V3.md` - Block/substrate architecture (unchanged)
- `YARNNN_AUTH_CANON.md` - Authentication/authorization (unchanged)
- `YARNNN_TIMELINE_CANON.md` - Event tracking (extends to work events)
- `YARNNN_DELETION_RETENTION_CANON_v1.0.md` - Data lifecycle (unchanged)

#### 🔄 **Needs Major Update** (Paradigm Shift)
- `YARNNN_CANON.md` - **CRITICAL**: Core philosophy document
  - Currently: "Memory-first cognitive system"
  - Needs: "AI Work Platform powered by context"

- `YARNNN_GOVERNANCE_CANON_V5.md` - **CRITICAL**: Governance model
  - Currently: "Substrate-only governance"
  - Needs: "Unified work + substrate governance"

- `YARNNN_ARCHITECTURE_CANON.md` - **CRITICAL**: System architecture
  - Currently: "Data flow for substrate mutations"
  - Needs: "Work orchestration layer + substrate layer"

- `YARNNN_FRONTEND_CANON.md` - **MAJOR**: UI philosophy
  - Currently: "Substrate management interface"
  - Needs: "Work review + substrate management interface"

#### ⚠️ **Needs Minor Update** (Extend)
- `YARNNN_INGESTION_CANON.md` - Add "agent work output ingestion"
- `YARNNN_NOTIFICATION_CANON_V2.md` - Add "work checkpoint notifications"
- `YARNNN_BASKETS_WORK_CANON.md` - Rename to "Work Sessions + Baskets"

#### ❌ **Obsolete Concepts** (Archive or Deprecate)
- `YARNNN_GRAPH_CANON.md` - Deprecated in v3.1 (replaced by Neural Map)
- `YARNNN_CANON_PURE_IMPLEMENTATION.md` - Pre-v3.0 implementation notes
- `YARNNN_NOTIFICATION_CANON_v1.0.0.md` - Superseded by V2

### Implementation Documents (20+ files)

#### 📦 **Archive** (Completed Projects)
- `V3.1_*` - Version 3.1 implementation docs (6 files) → `archive/v3.1/`
- `V3_*` - Version 3.0 migration docs (3 files) → `archive/v3.0/`
- `P3_P4_PHASE_4_COMPLETE.md` - Completed feature → `archive/features/`
- `SCHEMA_CLEANUP_SUMMARY.md` → `archive/migrations/`
- `MCP_OAUTH_REFACTOR_SUMMARY.md` → `archive/mcp/`

#### ✅ **Keep Active** (Current Features)
- `MCP_INTEGRATION_ARCHITECTURE.md` - Active integration
- `SEMANTIC_LAYER_INTEGRATION_DESIGN.md` - Active feature
- `NEURAL_MAP_ARCHITECTURE.md` - Active feature
- `WORK_ORCHESTRATION_LAYER.md` - **NEW**, foundational

#### 🗑️ **Delete** (Outdated/Irrelevant)
- `STRATEGIC_DECISION_REQUEST.md` - One-time decision doc
- `OPTION_B_IMPLEMENTATION_PLAN.md` - Obsolete planning doc
- Task artifacts in `task_artifacts/` - Implementation-specific, not canonical

---

## 🏗️ Proposed New Documentation Structure

### Tier 1: Core Philosophy (The "Why")

```
docs/canon/
├── YARNNN_PLATFORM_CANON_V4.md              [NEW] Master philosophy document
├── YARNNN_WORK_PLATFORM_THESIS.md           [NEW] Why context + work integration matters
├── YARNNN_GOVERNANCE_PHILOSOPHY_V4.md       [NEW] Unified governance model
└── YARNNN_USER_MENTAL_MODEL_V4.md           [NEW] How users think about YARNNN
```

#### `YARNNN_PLATFORM_CANON_V4.md` (Replaces `YARNNN_CANON.md`)

**New Sacred Principles**:
1. **Work Quality is Sacred** - Agent work requires human review before context updates
2. **Context Enables Intelligence** - Deep substrate understanding improves agent reasoning
3. **Governance Spans Both** - Single approval for work quality AND context mutation
4. **Provenance is Mandatory** - Every artifact traces back to work session and reasoning
5. **Supervision is Iterative** - Multi-checkpoint feedback loops improve work quality

**Core Metaphor Shift**:
- Old: "YARNNN is your external memory"
- New: "YARNNN is your AI work supervisor, powered by deep context"

**User Journey**:
```
Create Task → Agent Researches (using context) → Agent Proposes (artifacts)
→ User Reviews Work → Approve/Iterate → Context Updated → Timeline Tracked
```

---

### Tier 2: System Architecture (The "What")

```
docs/architecture/
├── YARNNN_LAYERED_ARCHITECTURE_V4.md        [NEW] 4-layer model
├── YARNNN_WORK_ORCHESTRATION_LAYER.md       [EXISTS] Layer 2 spec
├── YARNNN_SUBSTRATE_LAYER.md                [RENAME from SUBSTRATE_CANON_V3]
├── YARNNN_UNIFIED_GOVERNANCE.md             [NEW] Layer 3 spec
├── YARNNN_API_SURFACE.md                    [NEW] Complete API reference
└── YARNNN_DATA_FLOW_V4.md                   [NEW] Request → Work → Substrate flow
```

#### 4-Layer Architecture Model

```
┌────────────────────────────────────────────────────────────┐
│ Layer 4: Presentation (Frontend)                           │
│ - Work review UI                                            │
│ - Substrate management UI                                   │
│ - Timeline and notifications                                │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Layer 3: Unified Governance                                 │
│ - Work quality review                                       │
│ - Substrate mutation approval                               │
│ - Risk assessment                                           │
│ - Audit trails                                              │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Layer 2: Work Orchestration                                 │
│ - Work sessions (task → execution → completion)            │
│ - Work artifacts (blocks, documents, insights, external)   │
│ - Checkpoints (multi-stage approval)                        │
│ - Iterations (feedback loops)                               │
│ - Context mutations (substrate change tracking)            │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Layer 1: Substrate Core (Context Management)               │
│ - Blocks (knowledge substrate)                              │
│ - Documents (P4 compositions)                               │
│ - Insights (P3 reflections)                                 │
│ - Timeline events                                           │
│ - Semantic layer (embeddings, relationships)               │
└────────────────────────────────────────────────────────────┘
```

---

### Tier 3: Feature Specifications (The "How")

```
docs/features/
├── work-management/
│   ├── WORK_SESSION_LIFECYCLE.md            [NEW]
│   ├── ARTIFACT_TYPES_AND_HANDLING.md       [NEW]
│   ├── CHECKPOINT_STRATEGIES.md             [NEW]
│   └── AGENT_SDK_INTEGRATION.md             [NEW]
│
├── substrate-management/
│   ├── BLOCKS_SUBSTRATE.md                  [CONSOLIDATE from multiple]
│   ├── DOCUMENT_COMPOSITION.md              [CONSOLIDATE]
│   ├── INSIGHT_GENERATION.md                [CONSOLIDATE]
│   └── SEMANTIC_INTELLIGENCE.md             [RENAME]
│
├── governance/
│   ├── WORKSPACE_POLICIES.md                [NEW]
│   ├── APPROVAL_WORKFLOWS.md                [NEW]
│   ├── RISK_ASSESSMENT.md                   [NEW]
│   └── AUDIT_TRAILS.md                      [EXTEND from TIMELINE]
│
└── integrations/
    ├── MCP_INTEGRATION.md                   [CONSOLIDATE]
    ├── AGENT_SDK_PROVIDERS.md               [NEW]
    └── EXTERNAL_SHARING.md                  [KEEP]
```

---

### Tier 4: Implementation Guides (The "Details")

```
docs/implementation/
├── api/
│   ├── WORK_API_SPEC.md                     [NEW]
│   ├── SUBSTRATE_API_SPEC.md                [NEW]
│   └── GOVERNANCE_API_SPEC.md               [NEW]
│
├── frontend/
│   ├── WORK_REVIEW_COMPONENTS.md            [NEW]
│   ├── SUBSTRATE_UI_PATTERNS.md             [CONSOLIDATE]
│   └── NOTIFICATION_INTEGRATION.md          [KEEP]
│
└── database/
    ├── SCHEMA_REFERENCE.md                  [NEW - auto-generated]
    ├── RLS_POLICIES.md                      [NEW]
    └── MIGRATION_HISTORY.md                 [NEW]
```

---

### Tier 5: Archive (Historical Reference)

```
docs/archive/
├── v3.1/                                    [MOVE existing V3.1 docs]
├── v3.0/                                    [MOVE existing V3.0 docs]
├── features/                                [Completed feature specs]
├── migrations/                              [Completed migration plans]
└── deprecated/                              [Obsolete concepts]
```

---

## 📝 Critical Document Updates

### Priority 1: Core Philosophy (Week 1)

#### 1. **YARNNN_PLATFORM_CANON_V4.md** [NEW]

**Outline**:
```markdown
# YARNNN Platform Canon v4.0

## Core Identity
YARNNN is an AI Work Platform where deep context understanding enables
superior agent supervision and work quality.

## The Five Sacred Principles
1. Work Quality is Sacred
2. Context Enables Intelligence
3. Governance Spans Both
4. Provenance is Mandatory
5. Supervision is Iterative

## User Mental Model
[Task Creation] → [Agent Work] → [User Review] → [Context Update]

## Architecture Overview
Four-layer model: Presentation → Governance → Work → Substrate

## Key Differentiators
- Single approval for work + context (no double governance)
- Multi-checkpoint iterative supervision
- Complete work provenance and audit trails
- Context-powered agent reasoning

## Migration from v3.1
- v3.1: Pure context OS
- v4.0: Work platform powered by context
- What stays: Substrate architecture, timeline, auth
- What's new: Work orchestration, unified governance
```

#### 2. **YARNNN_GOVERNANCE_PHILOSOPHY_V4.md** [NEW]

**Key Changes**:
- Old: "Substrate-only governance"
- New: "Unified work + substrate governance"

**New Sections**:
- Work Quality Assessment (reasoning, completeness, accuracy)
- Substrate Mutation Control (context integrity)
- Single Approval → Dual Effect pattern
- Risk Assessment Framework
- Checkpoint Strategies

#### 3. **YARNNN_WORK_PLATFORM_THESIS.md** [NEW]

**Purpose**: Articulate why context + work integration matters

**Outline**:
```markdown
# Why YARNNN's Integration Matters

## The Problem
- Agents produce low-quality work without deep context
- Traditional work management lacks context awareness
- Double-approval (work + context) is redundant overhead

## The Solution
YARNNN integrates:
1. Deep substrate (context understanding)
2. Work orchestration (agent supervision)
3. Unified governance (single approval)

## The Competitive Advantage
- Superior agent reasoning (context-powered)
- Efficient supervision (single review)
- Complete provenance (work → context lineage)
- Iterative improvement (multi-checkpoint feedback)

## Market Positioning
- Not just "memory for AI" (Mem0, Zep)
- Not just "agent orchestration" (LangGraph, n8n)
- **Integrated platform** where context + work create emergent value
```

---

### Priority 2: Architecture Documentation (Week 2)

#### 4. **YARNNN_LAYERED_ARCHITECTURE_V4.md** [NEW]

**Consolidates**: Current `ARCHITECTURE_CANON` + new Layer 2/3

**Structure**:
```markdown
# YARNNN Layered Architecture v4.0

## Overview
Four-layer model with clear separation of concerns

## Layer 1: Substrate Core
[Existing content from SUBSTRATE_CANON_V3]
- Blocks, documents, insights, timeline
- Semantic layer integration
- Unchanged from v3.1

## Layer 2: Work Orchestration [NEW]
[Content from WORK_ORCHESTRATION_LAYER.md]
- Work sessions, artifacts, checkpoints, iterations
- Context mutation tracking
- Agent SDK integration

## Layer 3: Unified Governance [NEW]
- Single approval orchestrator
- Work quality + substrate mutation
- Risk assessment
- Audit trails

## Layer 4: Presentation
- Work review UI
- Substrate management UI
- Timeline and notifications

## Data Flow
[Complete request → work → governance → substrate flow diagram]

## API Surface
[High-level API organization]

## Security & RLS
[Workspace isolation, auth boundaries]
```

---

### Priority 3: Feature Specifications (Week 3-4)

#### 5. **WORK_SESSION_LIFECYCLE.md** [NEW]

**Content**:
- Session states (initialized → in_progress → approved/rejected)
- Checkpoint types and triggers
- Iteration mechanics
- Agent SDK integration points
- Error handling and rollback

#### 6. **UNIFIED_GOVERNANCE.md** [NEW]

**Content**:
- Single approval → dual effect pattern
- Per-artifact decision types
- Risk assessment algorithm
- Substrate application logic
- Timeline event emission

#### 7. **AGENT_SDK_INTEGRATION.md** [NEW]

**Content**:
- Session linking (Agent SDK ↔ YARNNN)
- Provider implementations (YarnnnMemory, YarnnnGovernance, YarnnnTasks)
- Work artifact creation patterns
- Context querying strategies

---

## 🗂️ File Operations Checklist

### Create New (15 files)

```bash
# Canon
docs/canon/YARNNN_PLATFORM_CANON_V4.md
docs/canon/YARNNN_WORK_PLATFORM_THESIS.md
docs/canon/YARNNN_GOVERNANCE_PHILOSOPHY_V4.md
docs/canon/YARNNN_USER_MENTAL_MODEL_V4.md

# Architecture
docs/architecture/YARNNN_LAYERED_ARCHITECTURE_V4.md
docs/architecture/YARNNN_UNIFIED_GOVERNANCE.md
docs/architecture/YARNNN_API_SURFACE.md
docs/architecture/YARNNN_DATA_FLOW_V4.md

# Features
docs/features/work-management/WORK_SESSION_LIFECYCLE.md
docs/features/work-management/ARTIFACT_TYPES_AND_HANDLING.md
docs/features/work-management/CHECKPOINT_STRATEGIES.md
docs/features/work-management/AGENT_SDK_INTEGRATION.md
docs/features/governance/WORKSPACE_POLICIES.md
docs/features/governance/APPROVAL_WORKFLOWS.md
docs/features/governance/RISK_ASSESSMENT.md
```

### Update Existing (6 files)

```bash
docs/YARNNN_CANON.md → docs/canon/YARNNN_PLATFORM_CANON_V4.md (MAJOR REWRITE)
docs/YARNNN_ARCHITECTURE_CANON.md → docs/architecture/YARNNN_LAYERED_ARCHITECTURE_V4.md (MAJOR UPDATE)
docs/YARNNN_GOVERNANCE_CANON_V5.md → docs/features/governance/UNIFIED_GOVERNANCE_SPEC.md (MAJOR UPDATE)
docs/YARNNN_FRONTEND_CANON.md → docs/architecture/YARNNN_PRESENTATION_LAYER.md (MAJOR UPDATE)
docs/YARNNN_INGESTION_CANON.md (MINOR - add agent work output ingestion)
docs/YARNNN_NOTIFICATION_CANON_V2.md (MINOR - add work checkpoint notifications)
```

### Archive (30+ files)

```bash
# Version migrations
mv docs/V3.1_*.md docs/archive/v3.1/
mv docs/V3_*.md docs/archive/v3.0/

# Completed features
mv docs/P3_P4_PHASE_4_COMPLETE.md docs/archive/features/
mv docs/SCHEMA_CLEANUP_SUMMARY.md docs/archive/migrations/
mv docs/SUBSTRATE_QUALITY_REFACTOR_SUMMARY.md docs/archive/features/

# MCP archives
mv docs/MCP_OAUTH_REFACTOR_SUMMARY.md docs/archive/mcp/
mv docs/MCP_LAUNCH_CHECKLIST.md docs/archive/mcp/

# Deprecated
mv docs/YARNNN_GRAPH_CANON.md docs/archive/deprecated/
mv docs/YARNNN_CANON_PURE_IMPLEMENTATION.md docs/archive/deprecated/
mv docs/YARNNN_NOTIFICATION_CANON_v1.0.0.md docs/archive/deprecated/
```

### Delete (10+ files)

```bash
rm docs/STRATEGIC_DECISION_REQUEST.md
rm docs/OPTION_B_IMPLEMENTATION_PLAN.md
rm docs/DOCUMENT_COMPOSITION_REFACTOR_PLAN.md  # Completed
rm docs/UI_REFACTOR_PLAN_BUILDING_BLOCKS_GOVERNANCE.md  # Completed
rm -rf docs/task_artifacts/  # Implementation-specific, not canonical
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1) - **CRITICAL**

**Goal**: Establish new philosophical foundation

1. Write `YARNNN_PLATFORM_CANON_V4.md`
2. Write `YARNNN_WORK_PLATFORM_THESIS.md`
3. Write `YARNNN_GOVERNANCE_PHILOSOPHY_V4.md`
4. Update root `README.md` to reflect new positioning

**Deliverable**: Clear articulation of "AI Work Platform" paradigm

---

### Phase 2: Architecture (Week 2)

**Goal**: Document layered architecture

1. Write `YARNNN_LAYERED_ARCHITECTURE_V4.md`
2. Write `YARNNN_UNIFIED_GOVERNANCE.md`
3. Update `YARNNN_ARCHITECTURE_CANON.md` → rename and extend
4. Consolidate data flow diagrams

**Deliverable**: Complete architectural reference

---

### Phase 3: Feature Specs (Week 3-4)

**Goal**: Detailed feature documentation

1. Work management specs (4 docs)
2. Governance specs (4 docs)
3. Integration specs (3 docs)
4. Update existing feature docs

**Deliverable**: Complete feature reference library

---

### Phase 4: Cleanup (Week 4)

**Goal**: Archive and delete obsolete docs

1. Move v3.x docs to archive
2. Move completed feature docs to archive
3. Delete obsolete planning docs
4. Create archive index with "what to look for where"

**Deliverable**: Clean, navigable documentation structure

---

## 📊 Success Metrics

### Clarity Metrics
- [ ] New team member can understand "what YARNNN is" in 15 minutes
- [ ] Architecture model is referenced in all technical discussions
- [ ] No conflicting information between documents

### Completeness Metrics
- [ ] Every implemented feature has specification document
- [ ] Every API endpoint documented
- [ ] Every governance policy explained

### Maintainability Metrics
- [ ] Clear version markers on all canon documents
- [ ] Deprecation notices on superseded documents
- [ ] Archive organized chronologically with index

---

## 🚨 Critical Dependencies

### Before Starting Phase 1

1. **Align on Positioning**: Confirm "AI Work Platform" is the right framing
2. **Review Integration Thesis**: Validate "context + work = superior supervision" argument
3. **Architecture Sign-off**: Ensure 4-layer model is stable

### Before Starting Phase 2

1. **API Design Complete**: Work orchestration endpoints finalized
2. **Governance Flow Validated**: Unified approval pattern proven
3. **Agent SDK Integration Tested**: Session linking works

---

## 📖 Documentation Standards (New)

### Canon Documents
- **Immutable Philosophy**: Core principles don't change without major version bump
- **Version Markers**: All canon docs have `v4.0`, `v4.1` etc in title
- **Deprecation Process**: Old versions archived with "superseded by" notice

### Architecture Documents
- **Living References**: Updated as architecture evolves
- **Implementation Status**: Each section marked as `✅ Implemented` or `📋 Planned`
- **Diagrams Required**: Visual representation of all major flows

### Feature Specifications
- **Complete**: Cover happy path, edge cases, error handling
- **Testable**: Clear acceptance criteria
- **API-Linked**: Direct links to implementation code

---

## 🎭 Narrative Tone Shift

### Old Tone (v3.1)
> "YARNNN is your external memory. Capture thoughts, let agents interpret them into structured knowledge, compose narratives from your substrate."

**Focus**: Human as curator of personal knowledge graph

### New Tone (v4.0)
> "YARNNN supervises your AI workforce. Agents do deep research using your context, you review their work quality, approved work automatically updates your knowledge base."

**Focus**: Human as supervisor of agent work, context as enabler

---

## ✅ Next Immediate Steps

1. **Get Buy-In**: Review this plan with stakeholders
2. **Phase 1 Kickoff**: Start writing platform canon v4.0
3. **Archive Setup**: Create `/docs/archive/` structure
4. **README Update**: Update root README with new positioning

---

## 📎 Appendix: Document Matrix

| Document | Status | New Location | Action |
|----------|--------|--------------|--------|
| YARNNN_CANON.md | 🔄 MAJOR UPDATE | canon/YARNNN_PLATFORM_CANON_V4.md | Rewrite |
| YARNNN_ARCHITECTURE_CANON.md | 🔄 MAJOR UPDATE | architecture/YARNNN_LAYERED_ARCHITECTURE_V4.md | Extend |
| YARNNN_GOVERNANCE_CANON_V5.md | 🔄 MAJOR UPDATE | features/governance/UNIFIED_GOVERNANCE_SPEC.md | Rewrite |
| YARNNN_SUBSTRATE_CANON_V3.md | ✅ KEEP | architecture/YARNNN_SUBSTRATE_LAYER.md | Rename |
| YARNNN_AUTH_CANON.md | ✅ KEEP | features/auth/AUTH_SPEC.md | Move |
| YARNNN_TIMELINE_CANON.md | ⚠️ EXTEND | features/audit/TIMELINE_AND_AUDIT.md | Extend |
| WORK_ORCHESTRATION_LAYER.md | ✅ KEEP | architecture/YARNNN_WORK_LAYER.md | Move |
| V3.1_*.md (6 files) | 📦 ARCHIVE | archive/v3.1/ | Move |
| V3_*.md (3 files) | 📦 ARCHIVE | archive/v3.0/ | Move |
| YARNNN_GRAPH_CANON.md | ❌ DEPRECATED | archive/deprecated/ | Move |

---

**This refactoring plan reflects a fundamental paradigm shift from "Context OS" to "AI Work Platform" while maintaining the substrate foundation that makes YARNNN unique.**
