# Canon v1.4.0 — Pure Supabase Architecture Update

📜 docs/YARNNN_AUTH_WORKFLOW.md — Canonical Authentication & Workspace Flow (v2)
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
RLS First + Pure Supabase Architecture
Sensitive access control is enforced by Postgres RLS tied to workspace_memberships.
Service-role keys are used for backend agent processing operations requiring elevated permissions.
Anon keys are used for user-scoped operations with RLS enforcement.
No DATABASE_URL dependency - single Supabase connection type for cleaner architecture.

## 2) Data Model (authoritative excerpt)
workspaces
Columns: id (uuid PK), owner_id (uuid), name (text), is_demo (bool default false), timestamps.
workspace_memberships
Columns: workspace_id (uuid), user_id (uuid), role (enum: owner|member), timestamps.
Constraint: (workspace_id, user_id) is UNIQUE.
Workspace-scoped tables (examples): baskets, raw_dumps, blocks (**context_blocks**), documents, context_items, …
Each SHALL include workspace_id (uuid NOT NULL) and be protected by RLS that references workspace_memberships.

Baskets timestamp semantics
- `baskets` does **not** have `updated_at`.
- "Last activity" MUST be derived from `timeline_events.max(ts)`; callers MAY fall back to `baskets.created_at` when no history exists.

## 3) Authentication & Token Handling
Frontend
SHALL use `supabase.auth.getUser()` in the client for UI state only.
Server actions/route handlers SHALL obtain the verified user via a helper (e.g., `getAuthenticatedUser()`), then rely on **RLS** for data visibility.
Backend
SHALL verify Supabase JWTs by validating signature, issuer, audience, and exp using Supabase JWKS.
user_id is taken from the token’s sub claim after verification.
Transport
Requests include Authorization: Bearer <jwt> (preferred) or sb-access-token header.

## 4) Workspace Resolution Contract
A single authoritative function SHALL exist server-side:
```python
# Python implementation in api/src/app/utils/workspace.py
def get_or_create_workspace(user_id: str) -> str:
    """Returns workspace_id, creating if necessary using admin client"""
```
Rules
- Uses `supabase_admin()` client (service role) to bypass RLS for bootstrap operations
- If a workspace exists with owner_id=user_id → return its id
- If none exists → create workspace row (owner = user), name = "{user_id[:6]}'s workspace" → return id
- Returns only the single authoritative workspace_id
- This function is the only place allowed to create default workspaces
- MUST validate user_id is a valid UUID before proceeding

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
1. **JWT Verification**
   - `AuthMiddleware` extracts token from headers (Authorization or sb-access-token)
   - `verify_jwt()` validates with raw JWT secret from env
   - Derives user_id from token's sub claim
   
2. **Workspace Resolution**
   - Call `get_or_create_workspace(user_id)` → workspace_id
   - Uses admin client for bootstrap operations only
   
3. **Database Operations**
   - Workspace bootstrap: Use `supabase_admin()` (service role)
   - User data operations: Use `supabase_admin()` for now (until user-scoped client is implemented)
   - All inserts MUST include workspace_id
   - Generate UUIDs client-side when needed (e.g., basket_id)
   
4. **Error Handling**
   - Return debug info when `x-yarnnn-debug-auth: 1` header present
   - Wrap exceptions in try/catch with proper logging
   - Use HTTPException for standard error responses

## 8) Next.js (App Router) — Web & API Rules
Server Components
SHALL use `createServerComponentClient({ cookies })` for database operations.
SHALL call a server helper: `getAuthenticatedUser()` → verified `userId`.
SHALL resolve the active workspace via RLS (e.g., membership query) or `ensureWorkspaceForUser(userId)`.

API Route Handlers
SHALL use `createRouteHandlerClient({ cookies })` for database operations.
SHALL verify authentication directly via `supabase.auth.getUser()` and return 401 on failure.
SHALL resolve the active workspace via `ensureWorkspaceForUser(userId)`.
SHALL rely on **RLS** for authorization (no trust in unverified session objects).

Example API route pattern:
```typescript
import { createRouteHandlerClient } from '@/lib/supabase/clients'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Auth check
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  
  // Workspace resolution  
  const { id: workspaceId } = await ensureWorkspaceForUser(data.user.id, supabase)
  // ... rest of implementation
}
```

Middleware
SHALL NOT perform authentication or RBAC decisions.
MAY normalize host names and canonicalize `/baskets/:id/*` paths (see §8.1).
Client Components
Access session via supabase.auth.getUser() for UI state only.
All data mutations go through server actions or API routes that follow sections 7 and 8.
### 8.1 Routing Normalization (Canonicalization)
The web layer MAY correct stale basket IDs before render:
- For paths matching `/baskets/:id(/...)`, call `GET /api/baskets/resolve` (RLS-scoped) to obtain the canonical basket id for the active workspace.
- If `:id` differs, **302** to `/baskets/<canonicalId>/<same-subpath>`.
- Middleware MUST NOT gate access by calling `auth.getUser()`; auth happens in server handlers via §8.

No Duplication
Workspace bootstrap logic lives only in the server helper described in §4.

## 9) API Contract Examples (normative)
Create Basket
POST /api/baskets/new
Authorization: Bearer <jwt>

Body: { "idempotency_key": "<uuid>", "intent": "optional intent", "raw_dump": "optional", "notes": "optional" }

Behavior:
- Verify JWT → userId via AuthMiddleware
- workspace_id = get_or_create_workspace(userId)
- Check idempotency_key for replay protection
- Generate basket_id client-side (uuid4)
- Insert baskets(id, name, workspace_id, user_id, idempotency_key, status='INIT', tags=[])
- Return { "id": basket_id, "name": basket_name }
Resolve Basket (single-basket world)
GET /api/baskets/resolve
Authorization: Bearer <jwt>
Returns: { "id": "<uuid>" }
Behavior:
- RLS-scoped query of `baskets` by `workspace_id`, order by `created_at` desc, limit 1.
- 404 if no basket exists (caller may trigger autocreate flow).

Basket State (last activity)
GET /api/baskets/{id}/state
Authorization: Bearer <jwt>
Returns: { "id": "...", "name": "...", "status": "...", "last_activity_ts": "<iso8601>" }
Behavior:
- Validate basket by `id` & `workspace_id` via RLS.
- Compute `last_activity_ts = max(timeline_events.ts)`; fallback to `baskets.created_at`.
- MUST NOT select or expose `baskets.updated_at`.

Create Raw Dump
POST /api/dumps/new
Authorization: Bearer <jwt>

Body: { "dump_request_id": "<uuid>", "text_dump": "...", "file_url": "..." }

Behavior:
 - Verify JWT → userId
 - workspaceId = ensureWorkspaceForUser(userId)
 - Insert raw_dumps(workspace_id, dump_request_id, text_dump, file_url)
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

Canonicalization

---

## 12) Realtime Guidance (Stabilized)

Purpose: avoid auth drift and noisy failures when using Supabase Realtime.

- Default transport: polling. Enable WebSocket only behind feature flags after verification.
- Environment flags (frontend):
  - `NEXT_PUBLIC_BASKET_EVENTS` = `polling` | `websocket` (default: polling)
  - `NEXT_PUBLIC_ENABLE_WORK_STATUS_REALTIME` = `true|false` (default: false)
- Known pitfall: ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` has no trailing newline or spaces. A copied newline surfaces as `%0A` in the ws URL and causes connection failure.
- Scope: subscribe narrowly (basket‑scoped or workspace‑scoped) and auto‑fallback to polling on `CHANNEL_ERROR`.

Implementation reference
- Basket events hook selects polling unless explicitly set to `websocket`.
- Work queue indicator subscribes only when `NEXT_PUBLIC_ENABLE_WORK_STATUS_REALTIME` is `true` and a valid `workspace_id` exists.

---

## 13) Workspace Hook (Client) — Canon Constraints

Client helpers MUST NOT broaden the server contract or assume schema fields beyond canon. The recommended minimal shape is:

```ts
// useWorkspace() should derive only id + name via a membership join
select `workspace_id, workspaces (id, name)` from workspace_memberships where user_id = auth.uid()
```

Rules
- Avoid non‑canonical fields like `workspaces.slug` unless documented in schema.
- If no membership row exists, treat as unauthenticated workspace context; server will bootstrap on demand.

---

## 14) Optional Work Status Surfaces (Universal Queue)

These endpoints are optional and may be enabled later; they are listed here to avoid future drift:

- `GET /api/work/{work_id}/status` — Canonical per‑work status (see Universal Orchestration Canon v2.1)
- `GET /api/work/workspace/{workspace_id}/summary` — Optional summary used by top‑bar indicators

Requirements
- Both endpoints MUST enforce workspace isolation (RLS + server validation).
- If not implemented, the UI MUST guard calls and keep realtime disabled.

---

## 15) Drift Watchlist (Auth/Workspace)

Use this checklist during reviews:
- [ ] All server routes: `getAuthenticatedUser()` + `ensureWorkspaceForUser()` before data access
- [ ] No client use of service‑role keys; browser uses `anon` only
- [ ] All queries filtered by `workspace_id`; never rely on client‑supplied workspace
- [ ] Realtime disabled in prod unless explicitly enabled by flags
- [ ] Env keys sanitized (no trailing newline in anon key)
- [ ] Writes flow only through `/api/dumps/*` or `/api/changes`
- Stale `/baskets/:id/*` paths SHOULD be corrected by middleware before render.
- Server routes encountering `PGRST116` (no rows) MAY redirect to `/memory` as a last resort; this SHOULD be rare if §8.1 is in place.

---

## 16) Capture Policy (P0) — Canon Defaults

P0 capture (raw dumps) is always direct insert. Governance applies to substrate evolution (P1+), not to raw dump creation.

- Default route for `entry_point=onboarding_dump`: `direct`
- Side‑effects: database triggers enqueue work for P1/P2/P3, but API success is not gated by downstream processing
- Rationale: users need immediate acknowledgement of capture; intelligence arrives asynchronously

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
 Middleware does not perform authentication decisions
 No code selects or orders by `baskets.updated_at`
