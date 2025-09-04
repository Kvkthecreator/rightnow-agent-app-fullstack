# YARNNN Canon v1.4.0 — The Authoritative Reference

**The Single Source of Truth for Yarnnn Service Philosophy and Implementation**

## 🌊 Core Philosophy: Memory-First, Substrate-Equal

Yarnnn is a **memory-first cognitive system** that captures human thought as immutable substrate, allows it to evolve through agent interpretation, and presents it back through deliberate narrative composition.

### The Four Sacred Principles

1. **Capture is Sacred** - All user input becomes an immutable `raw_dump`
2. **All Substrates are Peers** - No substrate type is privileged over another  
3. **Narrative is Deliberate** - Documents compose substrate references plus authored prose
4. **Agent Intelligence is Mandatory** - Substrate cannot exist without agent interpretation

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

1. **documents** - Deliberate narrative compositions FROM substrate + authored prose
2. **reflections** - Computed insights and observations ABOUT substrate patterns

**Critical**: Artifacts are derived FROM substrates, never the reverse. No artifact recursion.

## 🔄 The Five Pipelines (Substrate → Artifacts)

| Pipeline | Layer | Purpose | Sacred Rule |
|----------|-------|---------|-------------|
| **P0: Capture** | Substrate | Ingest raw memory | Only writes raw_dumps, never interprets |
| **P1: Extract** | Substrate | Extract structured knowledge from raw_dumps | Creates context_blocks only |
| **P2: Connect** | Substrate | Link substrates semantically | Creates context_items and relationships only |
| **P3: Reflect** | Artifact | Compute insights about substrates | Creates reflections only, never modifies substrate |
| **P4: Compose** | Artifact | Create narrative compositions | Creates documents only, consumes substrate |

## 🏛️ Architectural Pillars

### 1. Memory-First Architecture
- User thoughts emerge from captured substrate, not imposed structure
- **Substrate Layer**: Immutable memory (raw_dumps, context_blocks, context_items, timeline_events)
- **Artifact Layer**: Derived expressions (documents, reflections) that never become substrate
- Unidirectional flow: Substrate → Artifacts

### 2. Workspace-Scoped Security
- Single workspace per user (strong guarantee)
- All access via RLS policies on workspace_memberships
- No client-side data synthesis allowed

### 3. Event-Driven Consistency
- Every mutation emits timeline events
- Events flow: `timeline_events` → `events` → client subscriptions
- Single source of truth: the substrate tables

### 4. Sacred Write Paths
- **Primary**: `POST /api/dumps/new` - One dump per call
- **Onboarding**: `POST /api/baskets/ingest` - Orchestrates basket + dumps
- **No side effects** - These endpoints only write what they declare

### 5. Pure Supabase Async Intelligence Model
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

### Share Updates & Comprehensive Review
- Share Updates = unified multi-input ingestion (text + files + images)
- P1 Substrate Agent v2 performs comprehensive cross-content analysis
- Single governance proposal generated from unified structured ingredients
- Batch processing maintains semantic coherence across related inputs

### Document Composition (Artifact Layer)
- Documents = independent artifacts composed from substrate ingredients + authored prose
- Git-inspired versioning: Documents create snapshots for stable references
- Substrate ingredients remain immutable; documents evolve independently
- P4 agent creates initial composition, users freely edit afterward

## 💡 Key Insights from Canon

1. **Substrate Equality** - The four substrate types (dumps, blocks, context_items, events) are peers
2. **Substrate vs Artifacts** - Clear separation between memory (substrate) and expressions (artifacts)
3. **Artifact Independence** - Documents and reflections evolve separately from substrate
4. **Pipeline Discipline** - P0-P2 create substrate, P3-P4 create artifacts
5. **Memory Permanence** - Substrate is immutable; artifacts can be edited freely
6. **Document Versioning** - Git-inspired versioning for stable artifact references
7. **Workspace Isolation** - Complete data isolation between workspaces
8. **Agent Necessity** - Substrate cannot exist without agent processing
9. **Async Intelligence** - User feedback is instant, intelligence processing happens asynchronously

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
   - Respect pipeline restrictions
   - Write only allowed substrate types
   - Emit proper event contracts

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

## Version Lock

- Canon version: **v2.0**  
- Frozen as of: **2025-01-04**  
- Update policy: Do not edit in place. Amendments require a new canon version.

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

---
