# Canonical Basket+Dump Ingest (v1)
This canon is normative and assumed true. All code MUST conform to it.

## 0) Purpose
Atomically create (or replay) a basket and its raw dumps in a single operation with idempotency guarantees.

## 1) Route
POST /api/baskets/ingest
Authorization: Bearer <jwt>
Content-Type: application/json

## 2) Auth & Workspace
JWT MUST be verified per /docs/AUTH_WORKFLOW.md §3.
Server MUST resolve the single authoritative workspace_id via ensureWorkspaceForUser(userId) (§4).
All DB access MUST use a user-scoped client honoring RLS.

## 3) Contracts
Types are shared from shared/contracts/{baskets,dumps,ingest}.ts.
// IngestReq
type IngestReq = {
  idempotency_key: string;               // Ingest operation key
  basket?: { name?: string | null };     // Optional basket attrs
  dumps: Array<{
    dump_request_id: string;             // Per-dump idempotency
    text_dump?: string | null;
    file_urls?: string[] | null;
    meta?: Record<string, unknown> | null;
  }>;
};

// IngestRes
type IngestRes = {
  basket_id: string;
  dumps: Array<{ dump_id: string }>;
};

## 4) Idempotency Rules (authoritative)
Basket level: (workspace_id, idempotency_key) is UNIQUE.
If a row exists, the operation replays and returns the existing basket.
Dump level: (workspace_id, dump_request_id) is UNIQUE.
Existing rows replay with created=false.
Idempotency keys MUST be stable, client-generated, and collision-resistant (e.g., UUIDv4).

## 5) Transaction Semantics
The ingest operation MUST be atomic. Either:
Use a single SQL function that wraps the process in a transaction, or
Use a server-side transaction with equivalent guarantees.
The response returns only IDs. Created vs replayed status SHOULD be captured in logs, not in the payload.
## 6) Logging
Server MUST log request_id, user_id, workspace_id, idempotency_key, and outcome per entity:
basket.created|replayed
dump[ i ].created|replayed (dump_request_id)

## 7) Security & RLS
All inserts MUST set workspace_id.
RLS policies MUST restrict read/write to members of the workspace (see /docs/AUTH_WORKFLOW.md §6).
Elevated actions are not part of ingest; standard member privileges suffice.

## 8) Error Model
401 invalid/missing JWT
403 not a member of workspace (should not occur in single-workspace model)
409 idempotency conflict only if keys violate uniqueness specification
422 schema validation error (Zod)

## 9) Testability
The combined flow MUST have an integration test that:
Calls /api/baskets/ingest with {idempotency_key, dumps[]} and a valid user session.
Replays the same request and observes identical basket_id and dump_ids.