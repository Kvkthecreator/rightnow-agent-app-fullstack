# YARNNN Canon v3.0 — The Authoritative Reference

**The Single Source of Truth for Yarnnn Service Philosophy and Implementation**

**🚨 MAJOR UPDATE (2025-01-15)**: Substrate architecture upgraded to v3.0
- **See**: [YARNNN_SUBSTRATE_CANON_V3.md](./YARNNN_SUBSTRATE_CANON_V3.md) for complete substrate reference
- **Breaking change**: `context_items` merged into unified `blocks` table
- **New paradigm**: Emergent anchors, universal versioning, scope elevation

## 🌊 Core Philosophy: Memory-First, Substrate-Equal

Yarnnn is a **memory-first cognitive system** that captures human thought as immutable substrate, allows it to evolve through agent interpretation, and presents it back through deliberate narrative composition.

### The Five Sacred Principles

1. **Capture is Sacred** - All user input becomes an immutable `raw_dump`
2. **All Substrates are Peers** - No substrate type is privileged over another
3. **Narrative is Deliberate** - Documents are composed views of substrate, not editable artifacts
4. **Agent Intelligence is Mandatory** - Substrate cannot exist without agent interpretation
5. **Substrate Management Replaces Document Editing** - Users curate substrate and direct composition instead of editing prose

### The Three Governance Principles (v2.2)

1. **Substrate-Only Governance** - ALL substrate mutations flow through governance framework
2. **User-Controlled Execution Mode** - Users control execution policy via governance flags  
3. **Confidence-Informed Routing** - Confidence scores inform routing within governance modes

### 🚨 CRITICAL: Governance Scope Boundaries

**GOVERNED (Substrate Layer - Memory):**
- `raw_dumps` creation (P0 - direct only, no proposals)
- `blocks` mutations (P1 - via proposals, all semantic_types)
- `timeline_events` (system controlled)

**INDEPENDENT (Artifact Layer - Expression):**
- **P3 Insights** - Direct regeneration from substrate state (insight_canon, doc_insight, timeboxed_insight)
- **P4 Documents** - Direct composition from P3 + substrate (document_canon, starter_prompt)
- `substrate_references` - Document-substrate metadata linking
- All artifact analytics and composition stats
- **Review insights** - Computed ephemeral (cached in proposals table for audit)

**P3/P4 Governance Boundary**:
- Regeneration is **DIRECT** (not governed proposals) - artifacts derived from substrate, don't mutate it
- Policy controls: Auto-regeneration flags, workspace synthesis permissions, throttling
- Freshness computed from context (substrate_hash, graph_signature), not time thresholds

**Canon v3.0 Revolution**: Documents are no longer editable. They are composed views of substrate state that regenerate when substrate changes or composition instructions are refined. Users manage substrate, not prose.

## 🎯 Conceptual Model

```
User Thought → Raw Capture → Agent Processing → Substrate Evolution → Reflection Derivation → Narrative Composition
     ↓             ↓              ↓                    ↓                      ↓                    ↓
  Memory       Immutable      Intelligence        Structured            Read-Model           Deliberate
  Stream        Dumps          Required           Substrates            Patterns             Documents
```

## 📚 Substrate vs Artifact Distinction

### Three Substrate Types (Memory Layer) — v3.0

1. **raw_dumps** - Immutable user input (text, files, captures) - Sacred capture
2. **blocks** - ALL structured substrate (knowledge, meaning, structural) - Unified memory
   - `semantic_type` differentiates: `fact`, `intent`, `entity`, `metric`, etc.
   - Emergent `anchor_role` for strategic categorization
   - Universal versioning via `parent_block_id` chains
   - Scope elevation for cross-basket memory (`WORKSPACE`, `ORG`, `GLOBAL`)
3. **timeline_events** - Append-only activity stream - System memory

**Critical v3.0 change**: `context_items` merged into `blocks` table for unified substrate architecture.

**See**: [YARNNN_SUBSTRATE_CANON_V3.md](./YARNNN_SUBSTRATE_CANON_V3.md) for complete details on:
- Semantic types (knowledge vs meaning vs structural)
- Emergent anchor system (no predefined roles)
- Universal versioning (all blocks version identically)
- Scope levels (basket → workspace → org → global memory)

### Two Artifact Types (Expression Layer)

**P3: Insights** - Immutable interpretations of substrate (understanding what matters)
- `insight_canon` - Basket-level "what matters now" (one current per basket)
- `doc_insight` - Document-scoped interpretations (one per document)
- `timeboxed_insight` - Temporal window understanding (many per basket)
- `review_insight` - Proposal evaluation intelligence (ephemeral, computed)
- Cross-basket insights - Workspace-level synthesis (one current per workspace)

**P4: Documents** - Immutable governed views of substrate (activation surfaces)
- `document_canon` - Basket Context Canon (mandatory: one per basket)
- `starter_prompt` - Reasoning capsules for external hosts (many per basket)
- `artifact_other` - Future document types (extensible)

**Critical**: Artifacts are derived FROM substrates, never the reverse. No artifact recursion.

**P3/P4 Revolution**:
- **Insights (P3)** = Interpretive intelligence layer - "what matters now"
- **Documents (P4)** = Composition definitions generating versioned snapshots
- **Immutability**: Content never edited in place - evolution via regeneration only
- **Lineage**: Every artifact tracks previous versions via `previous_id`
- **Provenance**: Every artifact records `derived_from` (blocks, reflections, proposals)
- **Context-Driven Freshness**: Staleness computed from substrate_hash + graph_signature changes, not time

## 🔄 The Five Pipelines (Substrate → Artifacts)

| Pipeline | Layer | Purpose | Sacred Rule |
|----------|-------|---------|-------------|
| **P0: Capture** | Substrate | Ingest raw memory | Only writes raw_dumps, never interprets (always direct, no proposals) |
| **P1: Governed Evolution (Propose → Commit)** | Substrate | Propose and (upon approval) evolve basket substrate | **All Create/Revise/Merge occur only via approved governance proposals (no direct writes)** |
| **P2: Connect** | Substrate | Link existing substrates semantically | Creates relationships only, never creates new substrate |
| **P3: Insights** | Artifact | Generate interpretive intelligence | Creates P3 insights (insight_canon, doc_insight, timeboxed_insight), never modifies substrate |
| **P4: Documents** | Artifact | Generate narrative compositions | Creates P4 documents (document_canon, starter_prompt), consumes substrate + P3 insights |

### Pipeline Detail: P0→P1 Substrate Scaffolding

**P0: Capture Phase**
```
User Input → Collection of raw_dumps (unstructured)
- Text, PDFs, images become immutable raw_dumps
- Multiple inputs in one session linked by batch/provenance
- No interpretation, pure capture
```

**P1: Governed Evolution Phase (Propose → Commit)**
```
New raw_dumps + Existing substrate → Agent Analysis → Governance Proposal → Approval → Substrate Evolution

1. Agent reads new raw_dumps collectively
2. Agent reads existing substrate in basket (unified blocks with all semantic_types)
3. Agent determines evolution needed:
   - Novel concepts → CREATE new blocks
   - Refined understanding → UPDATE existing blocks (versioning via parent_block_id)
   - Duplicate concepts → MERGE blocks
   - Contradictions → REVISE blocks
4. Proposal approval → Operations executed atomically → Substrate evolved
```

**V3.0 Note**: All substrate is now unified blocks. Entity blocks identified by `semantic_type='entity'`.

**Critical Insight**: P1 is a **substrate evolution agent**, not just creation. Early baskets see mostly CREATE operations, mature baskets see mostly UPDATE/MERGE operations as conceptual space fills out.

### Pipeline Detail: P3→P4 Artifact Generation

**P3: Insights Phase (Interpretive Intelligence)**
```
Substrate State + Reflections → Agent Analysis → P3 Insight Generation → Lineage Tracking

Insight Types:
1. insight_canon (basket-level): "What matters now in this basket?"
   - Cardinality: ONE current per basket (health invariant)
   - Regeneration: Creates new version, marks previous non-current
   - Freshness: Computed from substrate_hash + graph_signature changes

2. doc_insight (document-level): "What does this document mean?"
   - Cardinality: ONE per document (many documents = many insights)
   - Scope: Attached to specific document_id
   - Freshness: Recomputed when document's substrate_references change

3. timeboxed_insight (temporal): "What mattered in Q3 2025?"
   - Cardinality: MANY per basket (different time windows)
   - Scope: Explicit temporal_scope metadata
   - Freshness: Immutable for historical windows, active for current period

4. review_insight (governance): "Should this proposal be approved?"
   - Cardinality: ONE per proposal (ephemeral, computed on-demand)
   - Storage: Cached in proposals.review_insight (not in reflections_artifact)
   - Purpose: Internal governance intelligence only

5. Cross-basket insights (workspace-level): "What matters across all my contexts?"
   - Cardinality: ONE current per workspace
   - Scope: Synthesizes across all basket insight_canons
   - Policy-gated: Requires workspace_insight_enabled flag
```

**P4: Documents Phase (Composition & Activation)**
```
P3 Insights + Substrate → Agent Composition → P4 Document Generation → Versioning

Document Types:
1. document_canon (Basket Context Canon):
   - Cardinality: ONE per basket (mandatory health invariant)
   - Purpose: Authoritative narrative of basket state
   - Regeneration: Creates new version when substrate/insights change
   - Content: Lives in document_versions (immutable)

2. starter_prompt (Reasoning Capsules):
   - Cardinality: MANY per basket (multiple intents: strategy, marketing, technical)
   - Purpose: Reusable activation surfaces for external hosts (Claude, ChatGPT)
   - Composition: Canon + Insights + reasoning metadata (purpose, constraints, continuity)
   - Portability: Designed for cross-host reuse

3. artifact_other (Extensible):
   - Cardinality: MANY per basket
   - Purpose: Future document types without schema changes
```

**P3/P4 Freshness Model (Context-Driven, Not Time-Driven)**
```
Staleness = f(substrate_hash_changed, graph_topology_changed, temporal_scope_invalid)

# NOT time-based
❌ WRONG: if (now() - last_generated) > 7 days: regenerate()

# Context-based
✅ RIGHT: if (current_substrate_hash != insight.substrate_hash): regenerate()
✅ RIGHT: if (current_graph_signature != insight.graph_signature): regenerate()
```

## 🏛️ Architectural Pillars

### 1. Memory-First Architecture
- User thoughts emerge from captured substrate, not imposed structure
- **Substrate Layer**: Immutable memory (raw_dumps, blocks, timeline_events) — V3.0 unified
- **Artifact Layer**: Derived expressions (documents, reflections) that never become substrate
- Unidirectional flow: Substrate → Artifacts

### 2. Governance-Mediated Evolution 🔥
- **Sacred Principle**: ALL substrate mutations flow through governance framework
- **Workspace Control**: Users configure execution policies (auto/proposal/confidence routing)
- **Agent Intelligence Preservation**: Mandatory validation for all substrate changes
- **Confidence-Informed Routing**: High-confidence operations auto-execute within governance bounds
- **Cross-cutting Impact**: Governance affects every pipeline, workflow, and user interaction

### 3. Workspace-Scoped Security
- Single workspace per user (strong guarantee)
- All access via RLS policies on workspace_memberships
- Governance settings isolated per workspace
- No client-side data synthesis allowed

### 4. Event-Driven Consistency
- Every mutation emits timeline events
- Events flow: `timeline_events` → `events` → client subscriptions
- Governance decisions audited in timeline
- Single source of truth: the substrate tables

### 5. Substrate Work Orchestration (v2.3)
- **Substrate Endpoint**: `POST /api/work` - Substrate mutations flow through governance
- **Substrate Work Types**: P0_CAPTURE, P1_SUBSTRATE, P2_GRAPH, P3_REFLECTION, MANUAL_EDIT, PROPOSAL_REVIEW, TIMELINE_RESTORE
- **Artifact Work Types**: P4_COMPOSE_NEW, P4_RECOMPOSE (document operations)
- **Governance Integration**: Substrate work evaluated against workspace governance policies
- **Direct Artifact Operations** - Documents, reflections operate independently via dedicated endpoints
- **Status Visibility**: Complete traceability for substrate mutations, simple REST for artifacts

### Governance Architecture Detail

**Sacred Principle**: All substrate mutations flow through governed proposals

```
Raw Input → P0 Capture → P1 Proposal → Approval → Substrate Creation
```

**Proposal Structure** (Unapplied Changeset):
```typescript
interface Proposal {
  ops: Operation[]  // The substrate changes to apply
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTED'
  origin: 'agent' | 'human'
  provenance: uuid[]  // Source raw_dump IDs
}
```

**Operation Schema** (P1 Evolution Agent Output) — V3.0:
```typescript
// Creation operations - novel concepts
{
  type: "CreateBlock",
  title: "Project Strategy",
  content: "New insight from dumps...",
  semantic_type: "insight" | "fact" | "entity" | "intent" | "metric",
  anchor_role: "strategy",  // V3.0: Emergent anchor (optional)
  anchor_status: "proposed",
  anchor_confidence: 0.85,
  confidence: 0.8
}

// Evolution operations - refining existing substrate
{
  type: "ReviseBlock",
  block_id: "existing-uuid",
  title: "Updated Project Strategy",
  content: "Updated content with new information...",
  parent_block_id: "existing-uuid",  // V3.0: Versioning chain
  confidence: 0.85
}

{
  type: "MergeBlocks",  // V3.0: Unified merge
  from_ids: ["uuid1", "uuid2"],
  canonical_id: "uuid1",
  merged_content: "Combined understanding..."
}

{
  type: "UpdateBlock",
  block_id: "existing-uuid",
  title: "Refined Title",
  anchor_role: "updated-anchor",  // V3.0: Emergent anchors evolve
  confidence: 0.9
}
```

**V3.0 Changes**:
- No more `CreateContextItem` / `UpdateContextItem` / `MergeContextItems`
- All operations now target unified `blocks` table
- Emergent `anchor_role` replaces fixed categories
- Versioning via `parent_block_id` chains

**Approval Criteria**:
- Agent-generated proposals: Auto-approve if confidence > 0.7
- Human-generated proposals: Manual review required
- Operations executed atomically on approval

### 6. Pure Supabase Async Intelligence Model
- Raw dumps automatically trigger agent queue processing via database triggers
- Pure Supabase architecture: no DATABASE_URL dependency, single connection type
- Service role authentication for backend operations, anon role for user operations
- User experience is immediate, intelligence processing happens asynchronously
- Agent processing is mandatory for substrate creation per Sacred Principle #4
- Queue-based processing ensures YARNNN canon compliance at scale
- Frontend shows processing state but never synthesizes substrate

## 🎬 Operational Flow

### Basket Lifecycle
```
INIT → ACTIVE → ARCHIVED
```
- Empty INIT baskets > 48h are eligible for cleanup
- Baskets are workspace-level containers for cognitive work

### Block State Machine
```
PROPOSED → ACCEPTED → LOCKED → CONSTANT
         ↘         ↗
          REJECTED → SUPERSEDED
```

### Substrate Evolution Flow
- **Multi-Input Capture**: Text, files, images become collection of raw_dumps
- **Context-Aware Processing**: P1 Agent analyzes new dumps + existing substrate
- **Evolution Decisions**: Agent determines Create/Update/Merge operations needed
- **Governance Proposal**: Single proposal with mixed operation types based on basket maturity
- **Auto-Approval**: High confidence evolution proposals execute immediately
- **Substrate Evolution**: Operations evolve the basket's knowledge representation

**Operation Mix Over Basket Lifecycle**:
- **Early Stage (1-10 dumps)**: 90% Create, 10% Update - exploring new conceptual space
- **Growing Stage (10-50 dumps)**: 60% Create, 40% Update - filling out knowledge gaps  
- **Mature Stage (50+ dumps)**: 30% Create, 70% Update - refining existing knowledge

**Deletion & Retention**: User operations are Archive/Redact (governance‑first) with cascade preview and audit tombstones; physical deletion is policy‑driven via scheduled vacuum (developer‑level). See `docs/YARNNN_DELETION_RETENTION_CANON_v1.0.md`.

### Document Composition (Artifact Layer)
- Documents = independent artifacts composed from substrate ingredients + authored prose
- Git-inspired versioning: Documents create snapshots for stable references
- Substrate ingredients remain immutable; documents evolve independently
- P4 agent creates initial composition, users freely edit afterward

## 📝 Sacred Principle #5: Substrate Management Replaces Document Editing (v3.0)

### Philosophy

**Documents are read-only composed views of substrate state. Users do not edit documents—they manage substrate and direct composition.**

This is YARNNN's revolutionary stance: fundamentally different from Notion, Google Docs, and traditional note-taking apps.

### What Users Do Instead of Editing

**1. Curate Substrate** (replaces: "editing content")
- Approve/reject/merge blocks via governance
- Add/remove substrate references from documents
- Update blocks through proposals (V3.0: unified substrate)

**2. Direct Composition** (replaces: "formatting and structure")
- Define composition instructions ("make section 2 more technical")
- Select which substrate to include/exclude
- Request regeneration with updated parameters

**3. Govern Substrate Mutations** (replaces: "revising drafts")
- Review proposals for block updates
- Approve substrate merges and refinements
- Validate agent-extracted substrate

**4. Manage Versions** (replaces: "save and track changes")
- Freeze versions as final snapshots
- Compare versions to see substrate evolution
- Accept/reject regenerated compositions

### The Fundamental Shift

**Traditional (Notion/Docs):**
```
User types prose → saves → document updated
```

**YARNNN (Revolutionary):**
```
User curates substrate → requests composition → document regenerated
```

### Expected Time Allocation

- **80%** substrate curation (governance, building-blocks management)
- **20%** composition refinement (document regeneration, instruction tuning)

**Substrate management IS the primary user activity.** Documents are downstream artifacts of well-managed substrate.

### Three-Layer Mental Model

**Layer 1: RAW_DUMPS** (Immutable Capture)
- Purpose: Preserve original input exactly as received
- User interaction: View original (read-only reference)
- Location: `/baskets/[id]/uploads`

**Layer 2: SUBSTRATE** (Governed Knowledge)
- Purpose: Structured, validated knowledge atoms
- User interaction: Curate, approve, merge (governance)
- Location: `/baskets/[id]/building-blocks`

**Layer 3: DOCUMENTS** (Composed Artifacts)
- Purpose: Narrative compositions from substrate
- User interaction: Manage substrate, refine composition
- Location: `/baskets/[id]/documents/[doc-id]`

### Upload Wizard Transformation

When users upload existing documents (e.g., `product-spec.docx`):

1. **P0:** Create raw_dump with original text (preserved exactly)
2. **P1:** Extract substrate → Create proposals
3. **User:** Review and approve substrate (governance)
4. **P4:** Compose NEW document from extracted substrate
5. **Show:** Side-by-side diff (original vs YARNNN version)
6. **User:** Accept transformation or cancel upload

**Key Insight:** We don't "migrate" documents. We **transform** them into substrate-backed knowledge.

**Trust Model:** Transparency through side-by-side comparison builds confidence in substrate extraction quality.

## 💡 Key Insights from Canon

1. **Substrate Equality** - The three substrate types (dumps, blocks, events) are peers — V3.0 unified
2. **Substrate vs Artifacts** - Clear separation between memory (substrate) and expressions (artifacts)
3. **Read-Only Documents** - Documents are composed views, never directly edited (v3.0)
4. **Pipeline Discipline** - P0-P1 create substrate via governance, P2 links substrate, P3-P4 create artifacts
5. **Memory Permanence** - Substrate is immutable; documents regenerate from substrate changes
6. **Document Versioning** - Git-inspired immutable snapshots for stable artifact references
7. **Workspace Isolation** - Complete data isolation between workspaces
8. **Agent Necessity** - Substrate cannot exist without agent processing
9. **Async Intelligence** - User feedback is instant, intelligence processing happens asynchronously
10. **Governance-Mediated Creation** - All substrate mutations flow through proposals, enabling review and atomic execution
11. **Supervisory Work Model** - Users direct and govern; agents research and compose (v3.0)

## 🚀 Implementation Guidelines

1. **Frontend Must**:
   - Mirror durable server state only
   - Never synthesize data client-side
   - Respect substrate equality in UI

2. **Backend Must**:
   - Enforce pipeline write boundaries
   - Emit timeline events for every mutation
   - Maintain workspace isolation via RLS

3. **Agents Must**:
   - **P1 Evolution Agents**: 
     - Read new raw_dumps AND existing substrate in basket
     - Make intelligent Create/Update/Merge decisions based on conceptual overlap
     - Use proper operation schema (flat structure, not nested objects)
     - Process actual dump content, never hardcoded templates
     - Achieve confidence > 0.7 for auto-approval eligibility
     - Handle basket lifecycle: heavy Create (early) → heavy Update (mature)

---

## Canonical Files

- **SCHEMA_SNAPSHOT.sql**  
  Frozen Postgres/Supabase schema — structural source of truth.  

- **YARNNN_AUTH_WORKFLOW.md**  
  Authentication and workspace membership flow, JWT verification, and access rules.  

- **YARNNN_FRONTEND_AUTH.md**  
  Frontend session handling and integration with Supabase authentication.  

- **YARNNN_INGESTION_FLOW.md**  
  Contracts and flow for atomic basket + dump ingestion.  

- **YARNNN_INTERFACE_SPEC_v0.1.0.md**
  API and DTO contracts for baskets, dumps, and ingestion flows.  

- **YARNNN_MEMORY_MODEL.md**  
  Canonical substrate contracts, mutability guarantees, and composition rules.  

- **YARNNN_MONOREPO_ARCHITECTURE.md**  
  Deployment and substrate-level architecture of the monorepo.  

- **YARNNN_RELATIONAL_MODEL.md**
  Semantic roles and flows across substrates (raw_dump, block, document, event). V3.0: unified blocks.  

- **YARNNN_CREATE_CANON.md**  
  The one sacred write path for capture.

- **YARNNN_REFLECTION_READMODEL.md**  
  How authoritative reflections are computed (text + graph) and reconciled with optimistic UI.

---

## Governance Evolution (v2.0 Preview)

**See**: `YARNNN_GOVERNANCE_CANON.md` for substrate governance model evolution

**Key Evolution**: Governance as first-class workflow
- All substrate mutations flow through governed proposals
- Agent validation mandatory for all proposals (agent + human origin)
- V3.0: All blocks have governance states: `PROPOSED → ACCEPTED → LOCKED → CONSTANT`
- Unified governance preserves sacred capture path while enabling manual substrate curation

**V3.0 Changes**: Unified blocks table with emergent anchors replaces context_items

---

---

## ⚙️ Universal Work Orchestration (v2.2)

**The Governance Revolution**: ALL substrate mutations flow through a single orchestrated pipeline.

### Core Concept: Work-Type Based Governance

```typescript
interface WorkRequest {
  work_type: 'P0_CAPTURE' | 'P1_SUBSTRATE' | 'P2_GRAPH' | 'P3_REFLECTION' | 
            'P4_COMPOSE' | 'MANUAL_EDIT' | 'PROPOSAL_REVIEW' | 'TIMELINE_RESTORE'
  work_payload: {
    operations: Operation[]     // What substrate changes to make
    basket_id: string          // Workspace context
    confidence_score?: number  // AI confidence level
    user_override?: 'require_review' | 'allow_auto'
    provenance?: string[]      // Source raw_dumps or context
  }
}
```

### Governance Policy Framework

Each workspace has governance policies that determine execution mode:

```typescript
interface WorkTypePolicy {
  mode: 'auto' | 'proposal' | 'confidence'
  confidence_threshold: number  // Used in confidence mode
  require_validation: boolean   // Manual validator required
}
```

**Mode Behaviors:**
- `auto`: Execute immediately (like git auto-merge)
- `proposal`: Always create proposal for review (like git pull request)
- `confidence`: Route based on AI confidence score within governance framework

### Universal Routing Algorithm

```
1. Work Request → Universal Work API (/api/work)
2. Fetch workspace governance policy for work_type
3. Apply routing logic:
   - user_override takes precedence
   - otherwise use policy.mode
   - confidence mode uses confidence_threshold
4. Route to execution path:
   - auto_execute → immediate substrate modification
   - create_proposal → create review proposal
5. Emit timeline events for visibility
6. Return work_id and routing decision
```

### Sacred Principles Enforcement

1. **Substrate-Only Governance**: No direct substrate endpoints exist - substrate mutations flow through `/api/work`
2. **Artifact Independence**: Documents and reflections use direct REST endpoints (`/api/documents`, `/api/reflections`)
3. **User Control**: Governance policies are user-configurable per workspace for substrate operations only
4. **Confidence Integration**: AI confidence informs substrate routing but doesn't override governance

### Canon-Pure Patterns (v2.3)

**SUBSTRATE OPERATIONS (Governed):**
- Substrate mutations: `/api/work` → governance → substrate tables
- Work types: P0_CAPTURE, P1_SUBSTRATE, P2_GRAPH, P3_REFLECTION, MANUAL_EDIT

**ARTIFACT OPERATIONS (Independent):**
- Document CRUD: `/api/documents` → direct → documents table
- Document composition: P4 agents → direct → document updates
- Reflection generation: `/api/reflections` → direct → reflections table
- Analytics: Direct queries to composition_stats, substrate_references

**ELIMINATED Canon Violations:**
- Document creation through governance ❌ → Direct REST endpoints ✅
- Reflection proposals ❌ → Direct computation ✅  
- Universal governance for artifacts ❌ → Substrate-only governance ✅

---

## Version Lock

- Canon version: **v3.1**
- Frozen as of: **2025-10-13**
- Update policy: Do not edit in place. Amendments require a new canon version.

### v3.1.0 Changes (P3/P4 Taxonomy & Immutability Hardening)
- **P3 Insights Taxonomy Formalized**: insight_canon, doc_insight, timeboxed_insight, review_insight, cross-basket insights
- **P4 Documents Taxonomy Formalized**: document_canon (mandatory), starter_prompt (many), artifact_other (extensible)
- **Context-Driven Freshness**: Staleness computed from substrate_hash + graph_signature changes, NOT time-based
- **Lineage Tracking**: All P3/P4 artifacts link to previous versions via previous_id
- **Provenance Recording**: All artifacts record derived_from (substrate sources)
- **Cardinality Clarity**: ONE insight_canon per basket/workspace, MANY doc_insights per basket, MANY starter_prompts
- **Review Insights Scoped**: Computed ephemeral, cached in proposals table (not in reflections_artifact)
- **Cross-Basket Synthesis**: Workspace-level insights schema included (policy-gated for future enablement)
- **Governance Boundary Hardened**: P3/P4 regeneration is DIRECT (not governed), policy-controlled only
- **Basket Modes Eliminated**: Removed legacy preset/template patterns in favor of emergent P3/P4 intelligence

### v3.0.0 Changes (Revolutionary - Substrate-First Documents)
- **Sacred Principle #5 Added**: Substrate Management Replaces Document Editing
- **Document Model Revolution**: Documents are read-only composed views, never directly edited
- **Upload Wizard Transformation**: Uploaded documents transformed via substrate extraction, not preserved as-is
- **Three-Layer Mental Model**: raw_dumps (capture) → substrate (knowledge) → documents (compositions)
- **Schema Evolution**: Documents table becomes composition definitions; content lives in immutable versions
- **Supervisory Work Model**: Users curate substrate 80%, refine compositions 20%
- **Fundamental Differentiation**: YARNNN is not Notion—it's substrate-first intelligence platform

### v2.3.0 Changes (Clarification & Canon Purity)
- **Substrate/Artifact Separation**: Clarified governance applies ONLY to substrate layer
- **Artifact Independence**: Documents and reflections operate via direct REST, not governance
- **Canon-Pure Boundaries**: Eliminated universal governance violation of artifact autonomy
- **P4 Reclassification**: Document composition moved from governance to direct artifact operations
- **Documentation Hardening**: Crystal clear boundaries prevent future canon violations

### v2.2.0 Changes (Revolutionary)
- **Universal Work Orchestration**: ALL substrate mutations flow through single governance pipeline
- **Work-Type Based Governance**: Replaced entry-point routing with universal work type policies
- **Eliminated Dual Approaches**: Deleted all legacy direct substrate endpoints
- **Enhanced User Control**: Workspace-level governance configuration with confidence sub-options
- **Canon Purity**: Complete elimination of governance bypass patterns

### v2.1.0 Changes (Extension)
- **Universal Work Orchestration**: Extended canonical_queue to handle all async operations
- **Real-time Status Visibility**: Canon-compliant status derivation across all workflows  
- **Cascade Framework Integration**: Unified P0→P1→P2→P3 orchestration with status tracking
- **Schema Enhancement**: Extended canonical_queue with cascade metadata and universal work support
- **Sacred Principle Preservation**: All changes maintain strict canon compliance

### v3.0.0 Changes (Breaking) — 2025-01-15
- **Unified Substrate Architecture**: `context_items` merged into `blocks` table
- **Three Pure Substrates**: raw_dumps, blocks (unified), timeline_events
- **Emergent Anchors**: Free-text `anchor_role` replaces fixed categorization
- **Universal Versioning**: All blocks version identically via `parent_block_id` chains
- **Scope Elevation**: Cross-basket memory via WORKSPACE/ORG/GLOBAL scopes
- **Semantic Types**: Knowledge (fact, metric), Meaning (intent, objective), Structural (entity)
- **See**: [YARNNN_SUBSTRATE_CANON_V3.md](./YARNNN_SUBSTRATE_CANON_V3.md) for complete details

### v2.0.0 Changes (Breaking)
- **Substrate/Artifact Separation**: Clear distinction between memory (substrate) and expressions (artifacts)
- **Two Artifact Types**: documents (versioned), reflections (computed)
- **Document Versioning**: Git-inspired versioning for stable artifact references
- **Legacy Table Removal**: Eliminated block_links, document_context_items, basket_events, revisions
- **No Artifact Recursion**: Reflections can target substrates OR document versions, never other artifacts

### v1.4.0 Changes
- Added Pure Supabase Async Intelligence Model as 5th Architectural Pillar
- Updated to reflect queue-based agent processing architecture 
- Clarified service role vs anon role authentication patterns
- Reinforced Agent Intelligence Mandatory principle (#4)
- **Memory Page Evolution**: Transformed primary operating surface into comprehensive memory interface
- **Document Library Integration**: Added document upload, library management, and breakdown proposal workflow
- **UX Simplification**: Dual-mode interface (Quick Capture ↔ Document Library) for clearer user journey  

## 📊 Canon v1.3.1 Compliance Audit Results

**Audit Date**: August 27, 2025  
**Auditor**: Claude Code  
**Overall Compliance Score: 78% (7/9 categories compliant or partial)**

The codebase shows **strong alignment** with Canon v1.3.1 principles, particularly in the core architectural areas. Recent work has successfully implemented substrate equality and generic composition patterns. Key violations involve legacy APIs that are deprecated but still present.

### Canon Compliance Achievements ✅

1. **Substrate Equality Compliance**: Generic `substrate_references.ts` contract and API implemented
2. **Pipeline Discipline**: Clear P0-P4 pipeline separation maintained  
3. **Sacred Write Path**: Primary `/api/dumps/new` path and batch ingestion working correctly
4. **Memory-First Architecture**: Reflections properly derived from substrate
5. **Workspace-Scoped Security**: RLS policies and workspace isolation implemented
6. **Event-Driven Consistency**: Timeline events properly emitted for mutations
7. **Database Schema Alignment**: Schema perfectly aligned with canon requirements

### Areas for Legacy Cleanup ⚠️

- Deprecated API routes still exist but marked DEPRECATED
- Legacy contract types (BlockLinkDTO) present but deprecated
- Frontend UI component compliance requires verification

**Key Achievement**: The core Canon v1.3.1 implementation work was successful. Major principles are implemented correctly, with only legacy cleanup remaining.

---
