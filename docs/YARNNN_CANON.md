# Canon v1.3.1 — docs clarification (no code change)
Aligns reflections (derived + optional cache), sacred write path endpoints, DTO wording (file_url), schema term context_blocks, basket lifecycle, and event tokens.

# Yarnnn Canon

## Canon Update: Memory-First Reflection (v1.3)

### Pillars
1) **Capture is sacred**: all user input becomes an immutable `raw_dump`.
2) **Reflection is derived**: insights are computed as a **read-model** from the current substrate.
3) **Narrative is deliberate**: agents may write short prose to `documents(document_type='narrative')`.

Blocks (**context_blocks**) are structured units of meaning.

### Roles (unchanged, clarified)
- **Substrate (objective)**: `raw_dumps`, `context_items`, `substrate_relationships`, `context_blocks`.
- **Memory Plane**: `reflection_cache` (optional, non-authoritative), `timeline_events` (append-only stream).
- **Reflection (derived)**: pattern/tension/question computed at read-time from substrate.
- **Narrative (authored)**: agent-written short text that cites substrate signals.

Reflections are derived from substrate. If persisted, they live in reflection_cache as a non-authoritative cache; readers may recompute on demand.

### Glossary
- **Memory-First**: User thoughts and patterns emerge from captured substrate, not imposed structure.
- **Read-Model**: Computed state derived from authoritative data, not stored separately.
- **Sacred Write Path**: The sacred write path is **POST /api/dumps/new** (one dump per call).
- **Optional onboarding alias:** **POST /api/baskets/ingest** orchestrates basket + multiple dumps in one transaction; it performs **no additional side-effects** beyond the split endpoints and is idempotent on both the basket and each dump.

Basket lifecycle: **INIT → ACTIVE → ARCHIVED**; empty INIT baskets older than **48h** are **eligible for cleanup** (policy-guarded; disabled by default).

---

**Executive Summary**  
This repository defines the **canonical contracts** for Yarnnn as of 2025-08-19.  
Each file listed below is frozen and serves as the single source of truth for its scope.  
Schema, API, and runtime implementations must conform to these references.  

---

## Canonical Files

- **YARNNN_PHILOSOPHY.md**  
  Unified service philosophy synthesizing all canon documents into cohesive vision.

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

## Version Lock

- Canon version: **v1.3**  
- Frozen as of: **2025-08-19**  
- Update policy: Do not edit in place. Amendments require a new canon version.  

---
