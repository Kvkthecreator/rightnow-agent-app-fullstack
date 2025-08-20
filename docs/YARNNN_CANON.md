# Yarnnn Canon

## Canon Update: Memory-First Reflection (v1.3)

### Pillars
1) **Capture is sacred**: all user input becomes an immutable `raw_dump`.
2) **Reflection is derived**: insights are computed as a **read-model** from the current substrate.
3) **Narrative is deliberate**: agents may write short prose to `documents(document_type='narrative')`.

### Roles (unchanged, clarified)
- **Substrate (objective)**: `raw_dumps`, `context_items`, `substrate_relationships`, `blocks`.
- **Memory Plane**: `basket_reflections` (durable), `basket_history` (append-only stream).
- **Reflection (derived)**: pattern/tension/question computed at read-time from substrate.
- **Narrative (authored)**: agent-written short text that cites substrate signals.

### Glossary
- **Memory-First**: User thoughts and patterns emerge from captured substrate, not imposed structure.
- **Read-Model**: Computed state derived from authoritative data, not stored separately.
- **Sacred Write Path**: Single entry point for user input via `/create` → `raw_dump`.

---

**Executive Summary**  
This repository defines the **canonical contracts** for Yarnnn as of 2025-08-19.  
Each file listed below is frozen and serves as the single source of truth for its scope.  
Schema, API, and runtime implementations must conform to these references.  

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

## Version Lock

- Canon version: **v1.3**  
- Frozen as of: **2025-08-19**  
- Update policy: Do not edit in place. Amendments require a new canon version.  

---
