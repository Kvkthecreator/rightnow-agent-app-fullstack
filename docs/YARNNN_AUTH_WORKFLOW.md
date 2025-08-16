📜 docs/YARNNN_AUTH_WORKFLOW.md — Canonical Authentication & Workspace Flow (v1)
This document is the source of truth. All code MUST conform to it.
Terms: “MUST/SHALL/SHOULD” follow RFC-2119 semantics.
## 0) Scope & Guarantees
Single-Workspace Model: Every authenticated user belongs to exactly one workspace.
Strong Auth: All backend requests are authenticated with verified Supabase JWTs.
Data Isolation: All workspace-scoped tables enforce access exclusively via RLS policies bound to workspace_memberships.
RBAC: Role logic is enforced at both the API and DB layers.

## 1) Core Principles
Single Workspace per User
On first authenticated touch, the system SHALL create a workspace and membership (owner) if none exists.
Every request is evaluated against the user’s single authoritative workspace_id.
Supabase Auth
Clients obtain the session/JWT through Supabase.
Backends SHALL verify the token signature and claims before using it.
RLS First
Sensitive access control is enforced by Postgres RLS tied to workspace_memberships.
Service-role keys are reserved for internal, non-user-scoped operations (e.g., webhooks, maintenance), never for end-user CRUD.

## 2) Data Model (authoritative excerpt)
workspaces
Columns: id (uuid PK), owner_id (uuid), name (text), is_demo (bool default false), timestamps.
workspace_memberships
Columns: workspace_id (uuid), user_id (uuid), role (enum: owner|member), timestamps.
Constraint: (workspace_id, user_id) is UNIQUE.
Workspace-scoped tables (examples): baskets, raw_dumps, blocks, documents, context_items, …
Each SHALL include workspace_id (uuid NOT NULL) and be protected by RLS that references workspace_memberships.

## 3) Authentication & Token Handling
Frontend
SHALL use supabase.auth.getUser() (client) or supabase.auth.getUser() (server actions/route handlers) to confirm session and fetch the JWT.
Backend
SHALL verify Supabase JWTs by validating signature, issuer, audience, and exp using Supabase JWKS.
user_id is taken from the token’s sub claim after verification.
Transport
Requests include Authorization: Bearer <jwt> (preferred) or sb-access-token header.

## 4) Workspace Resolution Contract
A single authoritative function SHALL exist server-side:
// Pseudocode contract — server-only
type WorkspaceBootstrapResult = { workspaceId: string; created: boolean };

async function ensureWorkspaceForUser(userId: string): Promise<WorkspaceBootstrapResult>;
Rules
If a membership exists → return its workspace_id.
If none exists → create workspaces row (owner = user), insert workspace_memberships (role='owner') → return.
Returns only the single authoritative workspace_id.
This function is the only place allowed to create default workspaces and memberships.

## 5) RBAC (Role-Based Access Control)
Roles: owner, member.
Owner privileges include all member actions plus elevated actions such as deleting the workspace or transferring ownership.
Member privileges exclude destructive global actions.
RBAC is enforced:
API layer: route-level guards call a shared requireRole(workspaceId, userId, roleOrHigher) utility.
DB layer: RLS policies consider membership and role for reads/writes where applicable.

## 6) RLS (Row-Level Security) Policy Canon
Read: a row is visible only if EXISTS (SELECT 1 FROM workspace_memberships m WHERE m.user_id = auth.uid() AND m.workspace_id = row.workspace_id).
Write/Update/Delete: same membership predicate; additional role predicates where applicable (e.g., destructive ops require role = 'owner').
All workspace-scoped tables SHALL implement these predicates.
Implication: even if an API route is misconfigured, Postgres still denies cross-workspace access.

## 7) Backend (FastAPI) Workflow (authoritative)
Verify JWT → derive user_id.
Resolve Workspace → ensureWorkspaceForUser(user_id) → workspace_id.
Create User-Scoped DB Client
All workspace CRUD SHALL use a user-scoped database client/session that relies on RLS; avoid service-role for user endpoints.
Apply RBAC Guards
Before performing action, check role when elevated privileges are required.
Persist with workspace_id
All inserts MUST set workspace_id.
All selects/updates MUST filter by workspace_id.

## 8) Next.js (App Router) — Web & API Rules
Server Components / Route Handlers
SHALL call a server helper: getAuthenticatedUser() → verified userId.
SHALL call ensureWorkspaceForUser(userId) and cache the result per-request.
SHALL use server-side user-scoped DB client for data operations.
Client Components
Access session via supabase.auth.getUser() for UI state only.
All data mutations go through server actions or API routes that follow sections 7 and 8.
No Duplication
Workspace bootstrap logic lives only in the server helper described in §4.

## 9) API Contract Examples (normative)
Create Basket
POST /api/baskets/new
Authorization: Bearer <jwt>

Body: { "name": "My Basket" }

Behavior:
- Verify JWT → userId
- workspaceId = ensureWorkspaceForUser(userId)
- Insert baskets(name, workspace_id)
- Return { id, name, workspace_id }
Create Raw Dump
POST /api/dumps/new
Authorization: Bearer <jwt>

Body: { "text_dump": "...", "file_urls": ["..."] }

Behavior:
- Verify JWT → userId
- workspaceId = ensureWorkspaceForUser(userId)
- Insert raw_dumps(workspace_id, text_dump, file_urls)
- Return { id, workspace_id }

## 10) Logging & Observability
Each request SHALL log: request_id, user_id, workspace_id, route, action, and decision outcomes (RBAC allow/deny).
Security-relevant failures (JWT invalid, RLS violation, role denial) SHALL be logged at warning or higher.

## 11) Error Semantics
401: Missing/invalid JWT.
403: Authenticated but not authorized (membership/role).
409: Idempotency/workspace uniqueness conflicts.
422: Schema/validation failures.
Errors return a machine-readable JSON:
{ "error": { "code": "FORBIDDEN", "message": "Owner role required." } }

## 12) Threat Model (baseline)
Token forgery: mitigated by JWKS signature verification.
Cross-tenant data leakage: mitigated by RLS + workspace_id checks.
Privilege escalation: mitigated by RBAC checks at API + RLS role predicates.

## 13) Compliance Checklist (MUST pass)
 JWT signature verified on every protected route
 Single authoritative workspace resolver in server code
 User-scoped DB client used for all user CRUD
 RLS enabled on all workspace tables
 RBAC enforced at API layer for elevated actions
 All rows carry correct workspace_id
 Logs include user_id + workspace_id