# Strategic Discourse: YARNNN Core Service Philosophy

**Date**: 2025-11-02
**Context**: Pre-refactoring strategic alignment
**Goal**: Establish clear service philosophy, scope, and user mental model before coding

---

## Your Answers to Critical Questions

### Clear Decisions
1. ✓ **Vision**: AI Work Platform is the north star
2. ✓ **Timeline/Resources**: Production-level, future-proof, single approach (no dual systems)
3. ✓ **Risk**: Clean cutover only, pre-launch so no legacy users to support
4. ✓ **Development Standard**: Delete old code, no feature flags, streamlined implementation

### Open Question
5. **Priority Balance**: Vision delivery (work platform) vs. immediate agent integrations

---

## The Multi-Faceted Reality You're Navigating

You've identified something critical that the canon doesn't fully address:

### YARNNN Has Two Potential Service Models

**Model A: Internal Work Platform** (Current v4.0 Canon Focus)
- YARNNN runs its own agents
- Users create "work requests" in YARNNN UI
- YARNNN agents execute work
- Users review work outputs
- Substrate updated from approved work
- **Revenue**: SaaS platform for AI-powered work execution

**Model B: Context Provider Backend** (enterprise.yarnnn.com)
- YARNNN provides context/memory API
- External developers run their own agents (via claude-agentsdk)
- Agents query YARNNN for context
- Agents store work outputs in YARNNN
- YARNNN provides governance layer
- **Revenue**: API service for context management at scale

### The Strategic Question

**Can YARNNN be BOTH?**

My assessment: **Yes, but the architecture must support both use cases.**

The key insight: Both models share the same core:
- ✓ Substrate storage (blocks, documents, timeline)
- ✓ Context retrieval (semantic search, relationship traversal)
- ✓ Governance (approval before substrate mutation)
- ✓ Provenance (track where knowledge came from)

**What differs**:
- Model A: YARNNN UI creates work_sessions, YARNNN agents execute
- Model B: External agents create work_sessions via API, external execution

**Implication**: The v4.0 architecture (work_sessions + unified governance) **actually supports both models**. You just need:
1. API endpoints for work session creation (external agents)
2. UI for work session creation (internal platform)
3. Shared governance layer (UnifiedApprovalOrchestrator)

---

## Clean the Room First: Safe Deletions

Based on my audit, these files are **legacy remnants** that conflict with both v3.1 and v4.0:

### 1. Universal Work Tracker (v2.1 Legacy)

**File**: `api/src/services/universal_work_tracker.py`
**Status**: Self-declares "Canon v2.1 compliant" (we're past v3.1, heading to v4.0)
**Evidence**:
```python
# Line 1-13: "Universal Work Tracker - YARNNN Canon v2.1 Compliant"
# Line 14-17: "V3.0 DEPRECATION NOTICE: This file contains references to
#              context_items table which was merged into blocks table"
```

**Used By**:
- `work_status.py` (route handler)
- Itself declares deprecation

**Safe to Delete?**: ⚠️ **Partially** - `work_status.py` imports it
**Action**:
1. Check if `work_status.py` routes are actually used
2. If yes, migrate to v4.0 work_sessions approach
3. Then delete universal_work_tracker.py

### 2. Enhanced Cascade Manager (v3.1 Legacy)

**File**: `api/src/services/enhanced_cascade_manager.py`
**Status**: "Canon v3.1" but v4.0 doesn't use cascade pattern
**Used By**: `governance_processor.py`

**Safe to Delete?**: ⚠️ **Check governance_processor first**
**Action**: Examine if governance_processor is active code path

### 3. Canonical Queue Processor (v2.1/v3.1 Hybrid)

**File**: `api/src/services/canonical_queue_processor.py`
**Status**: Processes agent_processing_queue (v2.1 concept)
**Used By**:
- `agent_server.py`
- `agent_entrypoints.py`
- `baskets.py`
- `agents.py`

**Safe to Delete?**: ❌ **Not yet** - This is actually the **current operational system**
**Conflict**: This IS the working agent orchestration, but it's the OLD model

**Decision Needed**:
- Keep until v4.0 work_sessions are operational
- OR delete and force migration to v4.0 immediately
- Given your "no dual systems" preference → Delete after v4.0 wired

---

## Core Service Philosophy: What IS YARNNN?

Let me propose a clearer mental model based on your multi-faceted goals:

### YARNNN Core Service (The Foundation)

**What it does**:
1. **Stores structured knowledge** (blocks with semantic types, relationships)
2. **Composes context** (P4 documents, semantic search, relationship traversal)
3. **Governs changes** (approval before substrate mutation, provenance tracking)
4. **Provides context to agents** (API for retrieval, API for storage)

**What it doesn't do**:
- Run specific agent implementations (that's agent repository's job)
- Dictate UI/UX for end-users (that's presentation layer's job)
- Force a specific agent framework (claude-agentsdk is one option, not only option)

### YARNNN as Two-Sided Platform

**Side 1: For End Users** (yarnnn.com web app)
- Create baskets (projects/research topics)
- Define work requests ("research AI memory competitors")
- Review agent work outputs
- Browse substrate (knowledge base)
- **Revenue**: SaaS subscription

**Side 2: For Developers** (enterprise.yarnnn.com API)
- Integrate YARNNN as memory backend for their agents
- Query context via semantic search
- Store agent work outputs via work_sessions
- Get approval webhooks when work reviewed
- **Revenue**: API usage pricing

**Shared Core**: Both sides use the same substrate, governance, and work orchestration layers.

---

## The User Journey You Need to Envision

You're right that **front-end thinking** should drive architecture. Let me sketch both user journeys:

### Journey A: End User (Internal Platform)

**Step 1: Create Research Basket**
```
User logs in → Dashboard
Click "New Research Topic"
Name: "AI Memory Landscape"
Scope: Public research
→ Creates basket
```

**Step 2: Define Work Request**
```
Inside basket view:
Click "Request Research"
Task: "Compare Mem0, Zep, Pinecone, Weaviate positioning"
Approach: "Web research + competitive analysis"
→ Creates work_session (status: pending)
```

**Step 3: Agent Executes (Behind the Scenes)**
```
YARNNN agent service polls for pending work_sessions
Picks up "AI Memory Landscape" research task
Queries current substrate for existing knowledge
Performs web research
Creates work_artifacts:
  - Block: "Mem0 - Personal memory focus, freemium model"
  - Block: "Zep - Production chatbot memory, enterprise pricing"
  - Block: "Pinecone - Vector database, infrastructure play"
  - Document: "Competitive Analysis Summary"
→ Updates work_session (status: awaiting_approval)
```

**Step 4: User Reviews Work**
```
Notification: "Research completed on AI Memory Landscape"
User opens work review UI:
  - Sees agent's reasoning trail
  - Sees 3 proposed blocks + 1 document
  - Each artifact has confidence score, risk level
User decisions:
  - Block 1 (Mem0): ✓ Approve → Apply to substrate
  - Block 2 (Zep): ✓ Approve → Apply to substrate
  - Block 3 (Pinecone): ✗ Reject (outdated info)
  - Document: ✓ Approve → Apply to substrate
→ Calls UnifiedApprovalOrchestrator
→ 2 blocks + 1 document added to substrate
→ work_session marked complete
→ Timeline event: "Research work approved"
```

**Step 5: Substrate Updated**
```
User navigates to basket substrate view
Sees new blocks in "Competitors" section
Clicks on Mem0 block → full context
Can create follow-up work request: "Deep dive on Mem0 pricing tiers"
```

### Journey B: External Developer (API Integration)

**Step 1: Developer Sets Up Integration**
```python
# In their agent code
from yarnnn_client import YarnnnClient

client = YarnnnClient(
    api_url="https://api.yarnnn.com",
    api_key=os.getenv("YARNNN_API_KEY")
)

# Create workspace, get basket_id from YARNNN dashboard
basket_id = "basket_abc123"
```

**Step 2: Developer's Agent Creates Work Session**
```python
# Agent starts research task
session = await client.create_work_session(
    workspace_id="ws_xyz",
    basket_id=basket_id,
    task_intent="Research AI memory competitors",
    task_type="research"
)

# Agent queries YARNNN for existing context
existing_blocks = await client.query_basket(
    basket_id=basket_id,
    query="AI memory systems",
    semantic_search=True
)

# Agent reasons with Claude SDK, produces outputs
# ...

# Agent submits findings as artifacts
await client.create_artifact(
    session_id=session['id'],
    artifact_type="block_proposal",
    content={
        "block_type": "note",
        "content": "Mem0 focuses on personal memory..."
    },
    confidence=0.89,
    reasoning="Based on their public docs and pricing page"
)
```

**Step 3: YARNNN User Reviews (Same as Journey A Step 4)**
```
YARNNN web app shows pending work session
User reviews, approves/rejects
UnifiedApprovalOrchestrator applies to substrate
```

**Step 4: Developer's Agent Gets Notified**
```python
# Via webhook or polling
status = await client.get_work_session_status(session['id'])
# Returns: {'status': 'approved', 'artifacts_applied': 2, ...}

# Agent can query updated substrate
updated_blocks = await client.query_basket(basket_id, query="Mem0")
# Now includes newly approved block
```

---

## Key Architectural Insights from These Journeys

### 1. Work Sessions Are Universal

**Both journeys use the same flow**:
- Create work_session
- Agent executes, creates artifacts
- User reviews via unified governance
- Approved artifacts → substrate

**Difference**:
- Journey A: YARNNN UI creates work_session, YARNNN agent executes
- Journey B: External agent creates work_session via API, external execution

**Implication**: The v4.0 work_sessions architecture **supports both**. You don't need two systems.

### 2. Baskets Are the Core Container

**Current unclear hierarchies**:
- Workspace → Baskets → ??? → Blocks?
- Where do work_sessions fit?
- Where do agents fit?

**Proposed clear hierarchy**:
```
Workspace (organization/account)
  ├─ Users (members with roles)
  ├─ Baskets (projects/topics)
  │   ├─ Substrate (blocks, documents, timeline)
  │   ├─ Work Sessions (agent tasks)
  │   │   ├─ Work Artifacts (pending outputs)
  │   │   └─ Context Mutations (applied changes)
  │   └─ Settings (approval strategy, auto-approve rules)
  └─ Agents (can be workspace-level or basket-specific)
```

**Key relationship**:
- Work sessions belong to a basket
- Work sessions produce artifacts
- Approved artifacts become substrate in that basket
- Timeline events track both work and substrate changes

### 3. P4 Documents Are Context Envelopes

You mentioned:
> "The key method of sending detailed context to agents would be P4 created artifact (like a task request) with added substrate sources"

**Proposed pattern**:

When creating a work request, YARNNN automatically generates a **P4 task document**:

```typescript
interface TaskDocument {
  // Task definition
  task_intent: string
  task_type: string
  desired_outcome: string

  // Context envelope
  relevant_blocks: Block[]  // Semantic search results
  relevant_documents: Document[]  // Prior research
  timeline_context: TimelineEvent[]  // Recent activity

  // Constraints
  approval_strategy: 'checkpoint_required' | 'final_only'
  max_iterations: number

  // Metadata
  created_for_work_session_id: UUID
}
```

**Flow**:
1. User creates work request in UI
2. System creates work_session + generates task P4 document
3. Task document includes pre-selected relevant substrate (context envelope)
4. Agent receives task document as starting context
5. Agent uses substrate blocks as evidence
6. Agent produces new artifacts
7. Approved artifacts become new substrate blocks

**This pattern works for both journeys** (internal platform and API integration).

### 4. Raw Dumps → Substrate Workflow Needs Rethinking

**Current P0-P4 pipeline**:
```
P0: Raw Dump (capture)
  → P1: Substrate Extraction (blocks)
  → P2: Graph Processing (relationships) [deprecated]
  → P3: Reflection (insights)
  → P4: Composition (documents)
```

**This pipeline is for**: **Ingesting external content** (web articles, PDFs, user notes)

**Agent work is different**: **Producing new knowledge** from existing substrate

**Proposed clear distinction**:

**Pipeline A: Ingestion** (P0-P4 as is)
- User uploads raw dump (PDF, article URL, notes)
- P0: Capture immutably
- P1: Extract substrate blocks (auto-approved for ingestion, or requires approval)
- P3: Generate insights
- P4: Compose summary document

**Pipeline B: Agent Work** (v4.0 work_sessions)
- User/Agent creates work_session
- Agent queries substrate (existing blocks, documents)
- Agent reasons, produces artifacts
- **Requires approval** before becoming substrate
- Approved artifacts become blocks/documents

**Key difference**:
- Ingestion pipeline: Raw content → Substrate extraction
- Work pipeline: Substrate query → New synthesis → Approval → Substrate addition

**Both are valid, serve different purposes, can coexist.**

---

## Governance Granularity You Need to Define

You're right that "unified approval" is still conceptually unclear. Let me map the granular decisions:

### Governance Decision Points

**Level 1: Work Session Approval**
```
Question: "Is this agent's work good overall?"
Scope: Entire work session (all artifacts together)
Options:
  - Approve all → All artifacts applied to substrate
  - Reject all → No substrate changes
  - Review per-artifact → Granular decisions (Level 2)
```

**Level 2: Per-Artifact Decisions** (if user chooses granular review)
```
Question: "What should happen to this specific artifact?"
Scope: Individual artifact
Options:
  - Apply to substrate → Creates block/document in substrate
  - Save as draft → Artifact stored but not in substrate (can apply later)
  - Reject → Artifact discarded, feedback captured
```

**Level 3: Substrate Mutation Type** (automatic based on artifact type)
```
Artifact Type → Substrate Mutation:
  - block_proposal → New block created (state: ACCEPTED)
  - block_update_proposal → Existing block superseded (new version)
  - document_creation → New document created
  - insight → New insight created
  - external_deliverable → No substrate impact (just stored)
```

**Unified Governance Means**:
- User reviews work (Level 1 or Level 2)
- System automatically applies substrate mutations (Level 3)
- No separate "approve block proposal" step

**What's NOT unified** (and shouldn't be):
- User-initiated direct substrate edits (manual block creation)
- Ingestion pipeline approvals (P1 extraction from raw dumps)

These are different governance contexts, so separate flows are OK.

---

## The Core Service Philosophy Decision

Based on everything above, here's my recommendation:

### YARNNN Core Service Is:

**"A governed context substrate that enables both internal AI work execution and external agent integration through a unified work session model."**

**Breaking that down**:
1. **Governed context substrate** = Layer 1 (blocks, documents, timeline, semantic layer)
2. **Internal AI work execution** = Model A (YARNNN runs agents, web app for users)
3. **External agent integration** = Model B (API for developers, enterprise.yarnnn.com)
4. **Unified work session model** = Layer 2-3 (work_sessions + UnifiedApprovalOrchestrator)

### Key Deliverables by Layer

**Layer 1: Substrate Core** (Already Excellent)
- ✓ Block storage with semantic types
- ✓ Document composition (P4)
- ✓ Timeline events
- ✓ Semantic search
- **No major changes needed**

**Layer 2: Work Orchestration** (Needs Wiring)
- ✓ work_sessions table (schema exists)
- ✓ work_artifacts table (schema exists)
- ✗ API routes for work session CRUD
- ✗ Task document generation (P4 envelope)
- ✗ Ingestion vs. Work pipeline clarity

**Layer 3: Unified Governance** (Needs Wiring + Clarity)
- ✓ UnifiedApprovalOrchestrator (code exists)
- ✗ API route for review endpoint
- ✗ Clear definition of what "unified" means (Level 1-3 above)
- ✗ Separate governance for ingestion vs. work

**Layer 4: Presentation** (Needs Building)
- ✗ Work request creation UI
- ✗ Work review UI (artifact-by-artifact approval)
- ✗ Task document viewer
- ⚠️ Substrate browser (exists, may need work session integration)

---

## Proposed Refactoring Sequence (Clean, Single Approach)

Given your preferences (no dual systems, delete legacy, production-level):

### Phase 1: Clean the Room (Week 1)

**Goal**: Remove legacy code, clarify what stays

**Actions**:
1. **Audit active code paths**:
   - Is `work_status.py` (queue-based) actually used in production?
   - Is `canonical_queue_processor.py` critical?
   - Check if any API routes depend on v2.1 legacy

2. **Delete safely**:
   - `universal_work_tracker.py` (if work_status.py can be rewritten)
   - `enhanced_cascade_manager.py` (if governance_processor can be rewritten)
   - Any routes that explicitly use agent_processing_queue

3. **Document what stays**:
   - P0-P4 ingestion pipeline (keep, it's for raw dumps)
   - Substrate APIs (keep, they're Layer 1)
   - Proposal-based block governance (keep temporarily, migrate to unified)

**Deliverable**: Clean codebase with clear "old vs. new" boundaries

### Phase 2: Define Front-End Flows (Week 1-2)

**Goal**: Design user journeys BEFORE coding

**Actions**:
1. **Sketch internal platform flows** (Figma/wireframes):
   - Create work request screen
   - Work review screen (artifact approval UI)
   - Basket view with work sessions tab
   - Task document viewer

2. **Define API contracts** (OpenAPI spec):
   - Work session CRUD endpoints
   - Artifact submission endpoints
   - Governance review endpoint
   - Webhook/polling for external agents

3. **Clarify governance rules**:
   - Which mutations require approval (work artifacts: yes, manual edits: no, ingestion: configurable)
   - What "unified approval" means (Level 1-3 from above)
   - When to auto-approve (low-risk + trusted agent)

**Deliverable**: API spec + UI wireframes + governance decision tree

### Phase 3: Wire v4.0 Work Sessions (Week 2-3)

**Goal**: Make work_sessions operational

**Actions**:
1. **Create API routes** (based on Phase 2 spec):
   - `POST /api/work/sessions` - Create work session
   - `GET /api/work/sessions/{id}` - Get session + artifacts
   - `POST /api/work/sessions/{id}/artifacts` - Submit artifact
   - `POST /api/governance/sessions/{id}/review` - Review work (calls UnifiedApprovalOrchestrator)

2. **Implement task document generation**:
   - When work_session created, generate P4 task document
   - Include semantic search results (context envelope)
   - Store as `task_document_id` in work_sessions table

3. **Fix UnifiedApprovalOrchestrator bugs**:
   - Remove mutable default arguments
   - Fix rejection metadata
   - Ensure "save as draft" doesn't count as mutation

4. **Create YarnnnClient** (agent repository):
   - HTTP client for YARNNN API
   - Methods: create_work_session, create_artifact, query_basket
   - Use in YarnnnMemory and YarnnnGovernance providers

**Deliverable**: Functional work session flow (API → Governance → Substrate)

### Phase 4: Build Work Review UI (Week 3-4)

**Goal**: Enable users to review agent work

**Actions**:
1. **Work queue view**:
   - List pending work_sessions
   - Show task intent, agent, time submitted

2. **Work review screen**:
   - Display all artifacts with risk scores
   - Show agent reasoning trail
   - Per-artifact approve/reject/defer buttons
   - Submit review → calls governance API

3. **Substrate provenance**:
   - Block detail view shows `created_by_work_session_id`
   - Link back to work session review
   - Timeline events show work approvals

**Deliverable**: Complete work review UX

### Phase 5: Migrate Existing Flows (Week 4-5)

**Goal**: Ensure all substrate mutations flow through work sessions

**Actions**:
1. **Wrap document composition**:
   - `POST /api/documents/compose-contextual` now creates work_session
   - Document becomes work_artifact
   - Requires approval (or auto-approve for low-risk)

2. **Wrap reflections**:
   - P3 reflection generation creates work_artifacts
   - High-impact reflections require approval

3. **Deprecate old governance**:
   - Migrate proposal-based block governance to work artifacts
   - Update existing routes to use UnifiedApprovalOrchestrator

4. **Delete legacy queue**:
   - Remove `agent_processing_queue` table (after migration)
   - Delete `canonical_queue_processor.py`
   - Delete old work_status routes

**Deliverable**: Single governance path, clean codebase

### Phase 6: Polish & Scale (Week 5-6)

**Goal**: Production-ready features

**Actions**:
1. **Checkpoint orchestration**:
   - Implement plan approval, mid-work review
   - Add workspace-level approval strategies

2. **Risk assessment service**:
   - Implement 5-factor risk calculation
   - Auto-assign risk levels to artifacts

3. **Auto-approval engine**:
   - Agent track record tracking
   - Confidence calibration
   - Auto-approve low-risk work from trusted agents

4. **Developer documentation**:
   - API reference for external integrations
   - Example agent implementations
   - Webhook setup guide

**Deliverable**: Production-ready YARNNN v4.0

---

## Strategic Recommendations

### 1. Embrace the Dual-Model Reality

**Don't choose** between "work platform" and "context provider backend." **Do both.**

The v4.0 architecture supports both models with the same core. You just need:
- **For internal platform**: Build UI (Layer 4)
- **For API integration**: Document API contracts, provide SDK (YarnnnClient)

**Go-to-market**:
- Launch as **internal work platform** first (yarnnn.com)
- Expose **API** second for enterprise customers (enterprise.yarnnn.com)
- Both share same backend, governance, substrate

### 2. Let User Journeys Drive Architecture

**Before coding anything**, answer these:
1. What does the "Create Work Request" screen look like?
2. What information does the Work Review screen show?
3. How does a user navigate from basket → work sessions → artifacts → substrate?
4. What notifications do users get when work is ready for review?
5. What does the developer experience look like for external agents?

**Once you can sketch these**, the API design becomes obvious.

### 3. Clarify Governance Scope

**Unified governance applies to**: Agent-produced work artifacts

**Separate governance for**:
- User-initiated manual edits (immediate, no approval needed)
- Ingestion pipeline (P1 extraction from raw dumps) - configurable approval
- System-generated insights (P3 reflections) - auto-approved unless high-impact

**This isn't a contradiction**—different governance contexts require different flows.

### 4. Phase the Work, But Commit to Direction

**Phase 1-2**: Strategic (clean room, design flows)
**Phase 3-4**: Core implementation (wire v4.0)
**Phase 5-6**: Migration and polish

**No dual systems during migration**—once Phase 3 complete, delete old code aggressively.

---

## Questions to Answer Before Coding

I need your decisions on:

1. **Basket-to-Work-Session Relationship**:
   - Should work_sessions be explicitly tied to baskets?
   - Can one work session span multiple baskets?
   - *My recommendation*: One-to-one (work_session belongs to basket)

2. **Task Document Generation**:
   - Should task creation auto-generate P4 context envelope?
   - What semantic search threshold to include blocks?
   - *My recommendation*: Yes, and configurable threshold per workspace

3. **Ingestion Pipeline Governance**:
   - Should P1 extracted blocks require approval?
   - Or auto-approved because user uploaded the raw dump?
   - *My recommendation*: Configurable per basket (default: auto-approve ingestion)

4. **Agent Association**:
   - Are agents workspace-level or basket-level resources?
   - Can one agent work across multiple baskets?
   - *My recommendation*: Workspace-level agents, basket-level permissions

5. **Legacy Code Deletion Timeline**:
   - Can I delete `canonical_queue_processor.py` immediately?
   - Or do we need to verify nothing depends on it first?
   - *My recommendation*: Audit first (Week 1), delete in Phase 5

---

## My Recommendation: Front-End First Approach

**You're absolutely right** that envisioning the front-end should come first.

**Next Steps**:
1. **I help you sketch user flows** (what screens, what actions, what data shown)
2. **We define API contracts** based on those flows (OpenAPI spec)
3. **We wire the backend** to match the API spec
4. **We build the UI** to consume the API

**This is opposite of "bottom-up"** (which created the current situation—schema first, routes never).

---

## Ready to Proceed?

I can help you with:

**Option 1: Sketch User Flows**
- Define screens for work request creation, work review, substrate browsing
- Map user journeys for both internal platform and API integration
- Clarify governance decision points

**Option 2: Clean the Room**
- Audit legacy code dependencies
- Create safe deletion list
- Update any routes that depend on old systems

**Option 3: Define API Contracts**
- Write OpenAPI spec for work session endpoints
- Define request/response models
- Clarify webhook/polling patterns for external agents

**Which would you like to start with?**

My suggestion: **Option 1 (Sketch User Flows)** → forces clarity on core service philosophy before any coding.
