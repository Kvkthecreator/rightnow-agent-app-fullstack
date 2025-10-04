# YARNNN Canon v2.2 — The Authoritative Reference

**The Single Source of Truth for Yarnnn Service Philosophy and Implementation**

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
- `context_blocks` mutations (P1 - via proposals)
- `context_items` mutations (P1 - via proposals)
- `timeline_events` (system controlled)

**INDEPENDENT (Artifact Layer - Expression):**
- `documents` - Read-only composed views, regenerated from substrate (v3.0)
- `reflections` - Direct computation from substrate
- `substrate_references` - Document-substrate metadata linking
- All artifact analytics and composition stats

**Canon v3.0 Revolution**: Documents are no longer editable. They are composed views of substrate state that regenerate when substrate changes or composition instructions are refined. Users manage substrate, not prose.

## 🎯 Conceptual Model

```
User Thought → Raw Capture → Agent Processing → Substrate Evolution → Reflection Derivation → Narrative Composition
     ↓             ↓              ↓                    ↓                      ↓                    ↓
  Memory       Immutable      Intelligence        Structured            Read-Model           Deliberate
  Stream        Dumps          Required           Substrates            Patterns             Documents
```

## 📚 Substrate vs Artifact Distinction

### Four Substrate Types (Memory Layer)

1. **raw_dumps** - Immutable user input (text, files, captures) - Sacred capture
2. **context_blocks** - Structured knowledge ingredients extracted from raw input (goals, constraints, metrics, entities) - Building blocks
3. **context_items** - Semantic connective tissue between substrates - Linking layer
4. **timeline_events** - Append-only activity stream - System memory

**Critical**: These are PEERS. No hierarchy between substrates.

### Two Artifact Types (Expression Layer)

1. **documents** - Read-only composed views FROM substrate (v3.0: no direct editing)
2. **reflections** - Computed insights and observations ABOUT substrate patterns

**Critical**: Artifacts are derived FROM substrates, never the reverse. No artifact recursion.

**v3.0 Revolution**: Documents are **composition definitions** that generate versioned snapshots. Content lives in immutable `document_versions`, not editable `documents` table. Users curate substrate and refine composition instructions—they never edit prose directly.

## 🔄 The Five Pipelines (Substrate → Artifacts)

| Pipeline | Layer | Purpose | Sacred Rule |
|----------|-------|---------|-------------|
| **P0: Capture** | Substrate | Ingest raw memory | Only writes raw_dumps, never interprets (always direct, no proposals) |
| **P1: Governed Evolution (Propose → Commit)** | Substrate | Propose and (upon approval) evolve basket substrate | **All Create/Revise/Merge occur only via approved governance proposals (no direct writes)** |
| **P2: Connect** | Substrate | Link existing substrates semantically | Creates relationships only, never creates new substrate |
| **P3: Reflect** | Artifact | Compute insights about substrates | Creates reflections only, never modifies substrate |
| **P4: Compose** | Artifact | Create narrative compositions | Creates documents only, consumes substrate |

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
2. Agent reads existing substrate in basket (blocks, context_items)
3. Agent determines evolution needed:
   - Novel concepts → CREATE new substrate
   - Refined understanding → UPDATE existing substrate  
   - Duplicate concepts → MERGE substrate
   - Contradictions → REVISE substrate
4. Proposal approval → Operations executed atomically → Substrate evolved
```

**Critical Insight**: P1 is a **substrate evolution agent**, not just creation. Early baskets see mostly CREATE operations, mature baskets see mostly UPDATE/MERGE operations as conceptual space fills out.

## 🏛️ Architectural Pillars

### 1. Memory-First Architecture
- User thoughts emerge from captured substrate, not imposed structure
- **Substrate Layer**: Immutable memory (raw_dumps, context_blocks, context_items, timeline_events)
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

**Operation Schema** (P1 Evolution Agent Output):
```typescript
// Creation operations - novel concepts
{
  type: "CreateBlock",
  content: "New insight from dumps...",
  semantic_type: "insight" | "fact" | "plan" | "reflection", 
  confidence: 0.8
}

{
  type: "CreateContextItem",
  label: "New Project Beta", 
  kind: "project" | "person" | "concept" | "goal",
  synonyms: ["Project β", "Beta"],
  confidence: 0.9
}

// Evolution operations - refining existing substrate
{
  type: "ReviseBlock",
  block_id: "existing-uuid",
  content: "Updated content with new information...",
  confidence: 0.85
}

{
  type: "MergeContextItems", 
  from_ids: ["uuid1", "uuid2"],
  canonical_id: "uuid1",
  merged_synonyms: ["all", "combined", "labels"]
}

{
  type: "UpdateContextItem",
  context_item_id: "existing-uuid", 
  label: "Updated label",
  additional_synonyms: ["new", "aliases"]
}
```

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
- Update context_items, blocks through proposals

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

1. **Substrate Equality** - The four substrate types (dumps, blocks, context_items, events) are peers
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
  Semantic roles and flows across substrates (raw_dump, block, document, context_item, event).  

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
- Context_items gain governance states: `PROVISIONAL → PROPOSED → ACTIVE`
- Unified governance preserves sacred capture path while enabling manual substrate curation

**Breaking Changes**: Requires context_items schema evolution and proposal table addition

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

- Canon version: **v3.0**
- Frozen as of: **2025-10-04**
- Update policy: Do not edit in place. Amendments require a new canon version.

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

### v2.0.0 Changes (Breaking)
- **Substrate/Artifact Separation**: Clear distinction between memory (substrate) and expressions (artifacts)
- **Four Pure Substrates**: raw_dumps, context_blocks, context_items, timeline_events
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
