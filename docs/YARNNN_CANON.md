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

## 📚 The Five Substrate Types (All Peers)

1. **raw_dumps** - Immutable user input (text, files, captures)
2. **context_blocks** - Structured knowledge ingredients extracted from raw input (goals, constraints, metrics, entities, relationships) with semantic classification and transformation capabilities
3. **context_items** - Semantic connectors and tags
4. **reflections** - Derived patterns (computed, optionally cached)
5. **timeline_events** - Append-only activity stream

**Critical**: These are PEERS. No hierarchy. Documents can compose ANY substrate type.

## 🔄 The Five Pipelines (Strict Separation)

| Pipeline | Purpose | Sacred Rule |
|----------|---------|-------------|
| **P0: Capture** | Ingest raw memory | Only writes dumps, never interprets |
| **P1: Substrate** | Extract structured knowledge ingredients from raw_dumps | Never writes relationships or reflections |
| **P2: Graph** | Connect substrates | Never modifies substrate content |
| **P3: Reflection** | Derive insights | Read-only computation, optional cache |
| **P4: Presentation** | Synthesize artifacts from ingredient data | Consumes substrate, never creates it |

## 🏛️ Architectural Pillars

### 1. Memory-First Architecture
- User thoughts emerge from captured substrate, not imposed structure
- Reflections are **derived read-models**, not stored truths
- Timeline events provide append-only memory stream

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

### Document Composition
- Documents = synthesized artifacts from ingredient data + intentional composition
- Any substrate type can be used as ingredient data (no hierarchy)
- P4 agent transforms structured block ingredients into coherent narratives based on user intent

## 💡 Key Insights from Canon

1. **Substrate Equality** - The system must never privilege one substrate type over another
2. **Derived Reflections** - Patterns/tensions/questions are computed at read-time
3. **Pipeline Discipline** - Each pipeline has strict write boundaries
4. **Memory Permanence** - Dumps are immutable; evolution happens through new substrate
5. **Workspace Isolation** - Complete data isolation between workspaces
6. **Agent Necessity** - Substrate (blocks, context_items, relationships) cannot exist without agent processing
7. **Async Intelligence** - User feedback is instant, intelligence processing happens asynchronously

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

- Canon version: **v1.4**  
- Frozen as of: **2025-08-28**  
- Update policy: Do not edit in place. Amendments require a new canon version.

### v1.4.0 Changes
- Added Pure Supabase Async Intelligence Model as 5th Architectural Pillar
- Updated to reflect queue-based agent processing architecture 
- Clarified service role vs anon role authentication patterns
- Reinforced Agent Intelligence Mandatory principle (#4)
- **Memory Page Evolution**: Transformed primary operating surface into comprehensive memory interface
- **Document Library Integration**: Added document upload, library management, and breakdown proposal workflow
- **UX Simplification**: Dual-mode interface (Quick Capture ↔ Document Library) for clearer user journey  

---
