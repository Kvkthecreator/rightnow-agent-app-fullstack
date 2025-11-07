# YARNNN Platform Canon v4.0 — The AI Work Platform

**The Single Source of Truth for YARNNN Service Philosophy and Implementation**

**Version**: 4.0.1 (Current Implementation) / 4.0 (Vision)
**Date**: 2025-10-31 (Updated: 2025-11-06)
**Status**: ⚠️ Canonical Vision (Implementation in Phase 1)
**Supersedes**: YARNNN_CANON.md (v3.1)

---

## ⚠️ CURRENT IMPLEMENTATION STATUS (As of 2025-11-06)

**This document describes the v4.0 VISION. Implementation is in progress (Phase 1).**

**What IS Working** ✅:
- **Substrate Core** (substrate-api): Blocks, documents, insights, timeline, semantic layer
- **Substrate Governance**: P1 pipeline with proposals, semantic deduplication, quality validation
- **Projects**: User-facing work containers (1:1 with baskets currently)
- **Work Sessions**: Basic task tracking schema (projects, work_sessions, work_artifacts, work_checkpoints)

**What is NOT Yet Implemented** ⏸️:
- **Work-Platform Governance**: Unified approval orchestrator disabled (Nov 5, 2025)
- **Work→Substrate Integration**: Bridge architecture deferred to Phase 2
- **Agent SDK Integration**: Session linking and orchestration
- **Multi-checkpoint workflows**: Iterations and feedback loops

**Current Architecture**: **Separated governance** (not unified)
- Substrate governance via proposals (working)
- Work-platform governance not yet defined

**See**:
- [`GOVERNANCE_CLEANUP_SUMMARY_2025_11_05.md`](../architecture/GOVERNANCE_CLEANUP_SUMMARY_2025_11_05.md) - Governance separation
- [`PHASE1_DEPLOYMENT_SUMMARY.md`](../../work-platform/PHASE1_DEPLOYMENT_SUMMARY.md) - Current work-platform state
- [`PHASE6_PROJECTS_ARCHITECTURE.md`](../../PHASE6_PROJECTS_ARCHITECTURE.md) - Projects vs Baskets

---

## 🎯 Core Identity (Vision)

**YARNNN is an AI Work Platform where deep context understanding enables superior agent supervision and work quality.**

We are **not** just a context OS. We are **not** just agent orchestration. We are the **integration** of both—where context and work create emergent value that neither achieves alone.

### The Strategic Positioning

```
┌─────────────────────────────────────────────────────────────┐
│ Traditional Memory Systems (Mem0, Zep, Pinecone)            │
│ - Focus: Store and retrieve context                          │
│ - Missing: Work supervision, governance, agent quality       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Agent Orchestration Platforms (LangGraph, n8n, Temporal)   │
│ - Focus: Run agents and workflows                            │
│ - Missing: Deep context, lineage, unified governance        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ YARNNN: Integrated AI Work Platform                         │
│ ✅ Deep context substrate (blocks, semantic layer, timeline) │
│ ✅ Work orchestration (sessions, artifacts, checkpoints)     │
│ ✅ Unified governance (work quality + context integrity)     │
│ ✅ Complete provenance (work → reasoning → substrate)        │
└─────────────────────────────────────────────────────────────┘
```

**The Thesis**: Context understanding + Work supervision = Superior AI outcomes

---

## 🌟 The Five Sacred Principles (v4.0)

### 1. **Work Quality is Sacred**

Agent work requires human review before updating context. We supervise AI workers, not just store their outputs.

**Why**: Agents make mistakes. Context pollution is permanent. Human judgment remains essential for quality assurance.

**Manifestation**:
- All agent work flows through `work_sessions`
- Artifacts await approval before substrate application
- Multi-checkpoint supervision for iterative feedback
- Risk assessment guides review attention

### 2. **Context Enables Intelligence**

Deep substrate understanding improves agent reasoning quality. Context is not just storage—it's the foundation for better work.

**Why**: Agents with access to rich, structured context produce higher-quality outputs than those with raw retrieval.

**Manifestation**:
- Task documents (P4) provide narrative context envelopes
- Blocks provide granular facts
- Semantic layer enables intelligent relationship discovery
- Timeline provides temporal context

### 3. **Governance Independence (Current Implementation)**

**Current State (Phase 1)**: Work governance and substrate governance are **separated**

**Why**: Work quality review and substrate integrity validation have different concerns
- Work governance: "Did the agent complete the task well?"
- Substrate governance: "Should this become memory?" (deduplication, quality, merge detection)

**Manifestation**:
- Substrate governance via P1 proposals (working)
- Work-platform governance not yet defined (deferred to Phase 2)
- Bridge architecture pending: approved work artifacts → substrate proposals

**Future Vision (v4.0)**: Unified approval orchestrator
- Single review for work quality → automatic substrate application
- Per-artifact decisions (apply/draft/reject)
- Eliminated in Nov 2025 cleanup because it bypassed substrate proposals

### 4. **Provenance is Mandatory**

Every artifact traces back to work session, agent reasoning, and source context. Complete accountability.

**Why**: Without provenance, debugging is impossible, trust erodes, and quality improvement stalls.

**Manifestation**:
- `work_artifacts` link to `work_sessions`
- `work_context_mutations` track substrate changes
- Timeline events capture agent decisions
- Agent SDK session IDs enable cross-system tracing

### 5. **Supervision is Iterative**

Multi-checkpoint feedback loops improve work quality through conversation, not binary approve/reject.

**Why**: Complex work requires course correction. Iteration beats single-shot judgment.

**Manifestation**:
- Checkpoint types: plan approval, mid-work review, final approval
- `work_iterations` capture feedback loops
- Agent revises based on user feedback
- Configurable approval strategies per user/agent

---

## 🚀 User Mental Model

### The Core Journey

```
[1. Create Task]
      ↓
   User defines intent: "Research AI memory competitors"
      ↓
[2. Agent Works]
      ↓
   Agent queries context (using YARNNN substrate)
   Agent reasons with Claude
   Agent creates artifacts (blocks, documents, insights)
   Agent shows reasoning trail
      ↓
[3. User Reviews]
      ↓
   User sees: artifacts + agent reasoning + confidence
   User decides: approve all / approve some / request changes
   Optionally: Mid-work checkpoints for course correction
      ↓
[4. Context Updates]
      ↓
   Approved artifacts → substrate (blocks created/updated)
   Timeline event emitted
   Substrate hash updated
   Documents marked stale (if needed)
      ↓
[5. Continuous Improvement]
      ↓
   Agent track record improves
   Trust calibration enables auto-approve for low-risk work
   User focuses on high-value supervision
```

### Key User Questions Answered

**"How do I use YARNNN?"**
Create tasks for agents. Review their work. Approved work becomes your knowledge base.

**"What makes YARNNN different?"**
Your agents have access to all your context, not just what fits in a prompt. You supervise work quality once, not context changes separately.

**"Why not just use ChatGPT with RAG?"**
ChatGPT doesn't track work sessions, doesn't require approval, doesn't maintain lineage, and doesn't update your knowledge base. YARNNN is a platform, not a chat interface.

**"What about agent autonomy?"**
Agents work autonomously but outputs require approval. Think "employee with autonomy" not "automation without oversight."

---

## 🏗️ Architecture Overview (4-Layer Model)

```
┌────────────────────────────────────────────────────────────┐
│ LAYER 4: PRESENTATION                                       │
│ - Work review UI (approve/iterate/reject)                   │
│ - Substrate management UI (view blocks, documents)          │
│ - Timeline and notifications                                 │
│ - Agent track record and trust dashboard                    │
└────────────────────────────────────────────────────────────┘
                          ↓ user actions
┌────────────────────────────────────────────────────────────┐
│ LAYER 3: UNIFIED GOVERNANCE                                 │
│ - Work quality assessment (reasoning, completeness)         │
│ - Substrate mutation approval (context integrity)           │
│ - Risk assessment (confidence, impact, track record)        │
│ - Single approval → dual effect (work + substrate)          │
│ - Audit trails (timeline events)                            │
└────────────────────────────────────────────────────────────┘
                          ↓ approved artifacts
┌────────────────────────────────────────────────────────────┐
│ LAYER 2: WORK ORCHESTRATION                                 │
│ - Work sessions (task → execution → completion)             │
│ - Work artifacts (blocks, documents, insights, external)    │
│ - Checkpoints (multi-stage approval)                         │
│ - Iterations (feedback loops)                                │
│ - Context mutations (substrate change tracking)             │
└────────────────────────────────────────────────────────────┘
                          ↓ queries/updates
┌────────────────────────────────────────────────────────────┐
│ LAYER 1: SUBSTRATE CORE (Context Management)               │
│ - Blocks (knowledge substrate)                               │
│ - Documents (P4 compositions)                                │
│ - Insights (P3 reflections)                                  │
│ - Timeline events (activity stream)                          │
│ - Semantic layer (embeddings, relationships)                │
└────────────────────────────────────────────────────────────┘
```

**Key Insight**: Layers 1-2 are **new in v4.0**. Layer 1 (Substrate) existed in v3.1 but was the entire system. Now it's the foundation for work management.

**See**: [YARNNN_LAYERED_ARCHITECTURE_V4.md](../architecture/YARNNN_LAYERED_ARCHITECTURE_V4.md) for complete details.

---

## 🎯 Key Differentiators (Competitive Moat)

### 1. Single Approval for Work + Context

**The Problem**: Traditional systems require double-approval
- Step 1: Approve agent's work output
- Step 2: Approve updating your knowledge base
- Result: Friction, confusion, abandonment

**YARNNN Solution**: Unified governance
- Single review: "Is this good work?"
- If yes → Work approved AND context updated
- Result: Efficient, intuitive, high-adoption

### 2. Multi-Checkpoint Iterative Supervision

**The Problem**: Binary approve/reject loses nuance
- Agent does 2 hours of work
- User rejects because step 1 was wrong
- Agent must redo everything

**YARNNN Solution**: Checkpoints
- Plan approval: "Is this approach right?"
- Mid-work review: "Course correct before continuing"
- Final approval: "Apply to context"
- Result: Efficient iteration, less wasted work

### 3. Complete Work Provenance

**The Problem**: Agent outputs are black boxes
- "Why did the agent say this?"
- "What context did it use?"
- "Can I trust this?"

**YARNNN Solution**: Full lineage
- Every artifact links to work session
- Every session captures reasoning trail
- Every substrate mutation tracked
- Agent SDK session IDs enable deep debugging
- Result: Trust through transparency

### 4. Context-Powered Agent Reasoning

**The Problem**: RAG is not enough
- Simple retrieval misses relationships
- No semantic understanding
- No temporal context
- No narrative composition

**YARNNN Solution**: Substrate + Semantic Layer
- Blocks provide structured knowledge
- Semantic layer discovers relationships
- Timeline provides temporal context
- P4 documents compose narratives
- Result: Agents reason better, produce better work

---

## 📊 What Stays from v3.1

### Substrate Architecture (Layer 1) — Unchanged

**We're not throwing away our foundation.** The substrate model from v3.1 is solid:

- ✅ **Blocks** - Universal substrate (all semantic types)
- ✅ **Raw Dumps** - Immutable capture
- ✅ **Timeline Events** - Activity stream
- ✅ **Semantic Layer** - Embeddings + relationships
- ✅ **Documents (P4)** - Immutable compositions
- ✅ **Insights (P3)** - Reflections and synthesis

**See**: [YARNNN_SUBSTRATE_CANON_V3.md](../../YARNNN_SUBSTRATE_CANON_V3.md) for complete substrate reference.

### Core Principles That Evolved

| v3.1 Principle | v4.0 Evolution |
|----------------|----------------|
| "Capture is Sacred" | → "Work Quality is Sacred" (broader scope) |
| "All Substrates are Peers" | ✅ Unchanged (still true) |
| "Narrative is Deliberate" | ✅ Unchanged (P4 documents still composed) |
| "Agent Intelligence is Mandatory" | → "Context Enables Intelligence" (reframed) |
| "Substrate Management Replaces Document Editing" | → "Supervision Replaces Manual Work" (evolved) |

---

## 🔄 What's New in v4.0 (Phase 1 - In Progress)

### Projects (User-Facing Containers)

**Concept**: User-facing work containers separate from substrate storage.

**Status**: ✅ Implemented (Phase 6, Nov 2025)

**Components**:
- `projects` table - Work containers with 1:1 basket relationship
- Project creation flow - Orchestrates basket + dump + work request creation
- BFF pattern - work-platform orchestrates, substrate-api stores

**Why**: Clear domain separation. Users see "projects", infrastructure uses "baskets".

### Layer 2: Work Orchestration (Schema Only)

**Concept**: Agent work is a first-class entity requiring lifecycle management.

**Status**: ⏸️ Schema created (Phase 1, Nov 2025), governance deferred to Phase 2

**Components Created**:
- `work_sessions` - Track task execution with JSONB parameters
- `work_artifacts` - Agent outputs with review status
- `work_checkpoints` - User review pause points
- RLS policies for workspace isolation

**Components Deferred**:
- `work_iterations` - Feedback loops (not yet implemented)
- `work_context_mutations` - Audit trail (not yet implemented)
- Substrate application logic (disabled Nov 2025)

**Why**: Rapid iteration with clear separation. Substrate integration comes in Phase 2.

### Layer 3: Separated Governance (Current State)

**Concept**: Work governance and substrate governance operate independently.

**Status**: ⚠️ Substrate governance working, work governance not yet defined

**Pattern**: Separated Review (Current)
- **Substrate governance**: P1 proposals → semantic dedup → quality validation → blocks
- **Work governance**: Not yet implemented (deferred to Phase 2)
- **Bridge**: Architecture pending (approved work artifacts → substrate proposals)

**Pattern**: Unified Review (Future Vision - Disabled Nov 2025)
- ~~Single approval handles both work quality and substrate mutation~~
- ~~Blocks created in `ACCEPTED` state (no separate proposal)~~
- Eliminated because it bypassed substrate proposals and semantic deduplication

**Why Separated**: Maintains substrate integrity guarantees while work-platform design matures.

### Agent SDK Integration

**Concept**: Clean integration with external agent execution frameworks.

**Pattern**: Session Linking
- Agent SDK manages execution (Claude conversations, tool use)
- YARNNN manages work lifecycle (artifacts, approval, substrate)
- Linked via `work_sessions.agent_session_id`
- Enables cross-system tracing and debugging

**Why**: In v3.1, agents were internal-only. Now we support external agent frameworks.

---

## 🚧 Migration from v3.1

### For Existing Users

**What Changes**:
- Mental model: "Context management" → "Work supervision"
- UI: New work review interface (alongside substrate view)
- Workflow: Create tasks → review work (instead of just managing substrate)

**What Stays**:
- All your substrate data (blocks, documents, timeline)
- Basket structure and workspace memberships
- Authentication and authorization model
- P3/P4 composition system

**Migration Path**:
- v3.1 users can continue substrate management workflows
- v4.0 features are additive, not breaking
- Work management is optional (can use YARNNN as pure context OS)

### For Developers

**What Changes**:
- API: New `/api/work/*` endpoints for work orchestration
- Database: New tables (`work_sessions`, `work_artifacts`, etc.)
- Governance: Unified approval replaces substrate-only governance

**What Stays**:
- Substrate API (`/api/baskets`, `/api/blocks`, etc.)
- RLS policies and workspace isolation
- Timeline event system

**Migration Path**:
- Old APIs remain functional (backward compatible)
- New work orchestration features opt-in
- Agent SDK integration is separate package

---

## 📖 Conceptual Glossary

### Core Concepts

**Work Session**: Agent execution lifecycle (task → artifacts → review → completion)

**Work Artifact**: Agent output awaiting approval (block proposal, document, insight, external file)

**Checkpoint**: Approval point during work session (plan approval, mid-work review, final approval)

**Iteration**: Feedback loop where user requests changes and agent revises

**Context Mutation**: Substrate change resulting from approved work (tracked in audit trail)

**Unified Governance**: Single approval process handling both work quality and substrate integrity

**Substrate**: Layer 1 entities (blocks, documents, insights, timeline) — the knowledge base

**Provenance**: Complete lineage from task → work session → reasoning → artifacts → substrate

### Relationships

```
Work Session (1) → Work Artifacts (N)
Work Session (1) → Checkpoints (N)
Work Session (1) → Iterations (N)
Work Session (1) → Context Mutations (N)

Work Artifact → Block (substrate application)
Work Artifact → Document (substrate application)
Work Artifact → External File (no substrate impact)

Work Session → Agent SDK Session (cross-system tracing)
```

---

## 🎭 Narrative Guidelines (Brand Voice)

### Core Messaging

**Primary**: "Supervise your AI workforce with confidence"

**Secondary**: "Deep context understanding enables better agent work"

**Tertiary**: "One review, dual effect—work quality and knowledge base updates"

### What We Say

✅ "YARNNN supervises AI workers"
✅ "Review work quality, not just outputs"
✅ "Context-powered agent reasoning"
✅ "Single approval for work and knowledge"
✅ "Complete provenance and accountability"

### What We Don't Say

❌ "YARNNN is a vector database" (too narrow)
❌ "YARNNN is agent orchestration" (misses context value)
❌ "YARNNN stores memories" (passive, not platform)
❌ "YARNNN manages context" (v3.1 framing, too limited)

### Audience Framing

**For Developers**: "YARNNN is the missing governance layer between agent frameworks and production."

**For Product Teams**: "YARNNN lets you deploy AI agents with confidence, not fear."

**For Enterprises**: "YARNNN provides the audit trails, quality controls, and accountability required for agent adoption at scale."

---

## 🔮 Future Evolution (Beyond v4.0)

### Near-Term (v4.1-4.3)

- **Agent Track Record**: Trust calibration based on approval history
- **Risk Assessment**: Automated risk scoring for artifacts
- **Context Mutation Limits**: Safety thresholds per agent/session
- **Advanced Checkpoints**: Custom checkpoint strategies per user
- **Workspace Policies**: Per-workspace governance configuration

### Medium-Term (v4.5-5.0)

- **Multi-Agent Collaboration**: Work sessions spanning multiple agents
- **External Approvers**: Delegate work review to team members
- **Integration Marketplace**: Third-party work artifact handlers
- **Agent Marketplace**: Pre-configured agents for common tasks
- **Work Templates**: Reusable task patterns

### Long-Term (v5.0+)

- **Autonomous Work Chains**: Agent-to-agent work delegation
- **Cross-Workspace Context**: Org-level substrate federation
- **External Work Sources**: Ingest work from GitHub, Jira, etc.
- **Predictive Risk Assessment**: ML-based artifact risk scoring
- **Context Intelligence**: Proactive substrate optimization

---

## ✅ Canonical Status

This document is **the single source of truth** for YARNNN's philosophy, identity, and core principles as of v4.0.

**When in doubt**:
- This document defines "what YARNNN is"
- Architecture documents define "how YARNNN works"
- Feature documents define "what YARNNN does"

**Conflicts**:
- If other documents conflict with this canon, **this document wins**
- Report conflicts as documentation bugs to be fixed

**Updates**:
- This document evolves via major version bumps (v4.0 → v5.0)
- Minor clarifications don't require version change
- Breaking philosophy changes require team-wide review

---

## 📎 See Also

### Foundation Documents
- [YARNNN_WORK_PLATFORM_THESIS.md](./YARNNN_WORK_PLATFORM_THESIS.md) - Why context + work integration matters
- [YARNNN_GOVERNANCE_PHILOSOPHY_V4.md](./YARNNN_GOVERNANCE_PHILOSOPHY_V4.md) - Unified governance model
- [YARNNN_USER_MENTAL_MODEL_V4.md](./YARNNN_USER_MENTAL_MODEL_V4.md) - Detailed user journey

### Architecture Documents
- [YARNNN_LAYERED_ARCHITECTURE_V4.md](../architecture/YARNNN_LAYERED_ARCHITECTURE_V4.md) - Complete 4-layer system design
- [YARNNN_WORK_LAYER.md](../architecture/YARNNN_WORK_LAYER.md) - Layer 2 specification
- [YARNNN_SUBSTRATE_LAYER.md](../architecture/YARNNN_SUBSTRATE_LAYER.md) - Layer 1 specification
- [YARNNN_UNIFIED_GOVERNANCE.md](../architecture/YARNNN_UNIFIED_GOVERNANCE.md) - Layer 3 specification

### Legacy Documents
- [YARNNN_CANON.md](../../YARNNN_CANON.md) - v3.1 canon (superseded)
- [YARNNN_SUBSTRATE_CANON_V3.md](../../YARNNN_SUBSTRATE_CANON_V3.md) - Substrate reference (still valid)

---

**This is YARNNN v4.0. We are the AI Work Platform.**
