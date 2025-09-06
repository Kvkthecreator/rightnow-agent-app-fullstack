# Auth Doctor Report - 2025-09-06 UPDATE

## Latest Issue: 404 Errors on Basket API (RESOLVED)

### Symptoms
- Basket API returning 404 errors for existing baskets
- PGRST116 "The result contains 0 rows" from Supabase
- Timeline and documents endpoints failing with 404s

### Root Cause Analysis

**Primary Issue**: Missing workspace memberships causing RLS policy denials

**Investigation Results**:
1. ✅ Basket `fa622620-824e-4734-b4f1-d47a733a0ec1` exists in database
2. ✅ API routes are correctly implemented 
3. ❌ Workspace `99e6bf7d-513c-45ff-9b96-9362bd914d12` had no membership entries
4. ❌ RLS policies denied access due to missing membership

### Auth Canon Compliance Gap

**Canon Violation**: AUTH_WORKFLOW.md Section 4
- **Required**: "Uses `supabase_admin()` client (service role) to bypass RLS for bootstrap operations"
- **Actual**: `ensureWorkspaceServer.ts` uses regular authenticated client
- **Impact**: Workspace creation succeeds, membership creation fails silently due to RLS

### Fix Applied ✅

**Immediate Data Fix** (2025-09-06):
```sql
-- Fixed 4 orphaned workspaces
INSERT INTO workspace_memberships (workspace_id, user_id, role) VALUES 
  ('99e6bf7d-513c-45ff-9b96-9362bd914d12', 'aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'e9cc5af4-fe89-4c40-8ffb-26ce5ce5e24a', 'owner'),
  ('31ee30fe-6ae3-4604-ab6d-ac9b9f06dfda', '24520389-0352-48b4-9a33-a960dabe02a5', 'owner'),
  ('f31ba16d-cde7-4246-89c4-8b46eefb7150', 'aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2', 'owner');
```

**Result**: Immediate resolution of 404 errors

---

## Previous Issue: 401 Errors on Basket API (RESOLVED)

This section documents the investigation and fix for 401 errors on `POST /api/baskets/new` in production.

## Environment Audit

### Production `_env-doctor`

```
TODO: Insert JSON output from https://www.yarnnn.com/api/_env-doctor
```

### Local `_env-doctor`

```
TODO: Insert JSON output from http://localhost:3000/api/_env-doctor
```

## Auth Echo

### yarnnn.com

```
TODO: Insert JSON output from https://yarnnn.com/api/_auth-echo
```

### www.yarnnn.com

```
TODO: Insert JSON output from https://www.yarnnn.com/api/_auth-echo
```

## Root Cause

Supabase auth cookies were scoped to the exact host where login occurred. When API requests were sent to another host (e.g. `www.yarnnn.com` vs `yarnnn.com`), the cookies were not included and `getUser()` returned `null`, producing `401 Unauthorized` responses.

## Fix Summary

- Canonicalized hostnames to `www.yarnnn.com` using Next.js redirects.
- Introduced a server Supabase client that sets cookies with the domain `.yarnnn.com` to share auth across subdomains.
- Added diagnostics endpoints for environment and auth state verification.

## Verification Steps

1. Log in at `https://www.yarnnn.com`.
2. `curl -i https://www.yarnnn.com/api/_auth-echo` → `userPresent: true`.
3. `curl -i -X POST https://www.yarnnn.com/api/baskets/new -d '{"intent":"test"}'` → `201 Created`.
4. Confirm Vercel logs show no `401` for `/api/baskets/new` in the last 10 minutes.

## Screenshots / Logs

```
TODO: Add relevant screenshots or log snippets.
```
