# Yarnnn Canon

**Executive Summary**  
This repository defines the **canonical contracts** for Yarnnn as of 2025-08-16.  
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

---

## Version Lock

- Canon version: **v1.0**  
- Frozen as of: **2025-08-16**  
- Update policy: Do not edit in place. Amendments require a new canon version.  

---
