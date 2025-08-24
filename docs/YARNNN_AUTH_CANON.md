# Canon v1.3.1 — docs clarification (no code change)
Aligns reflections (derived + optional cache), sacred write path endpoints, DTO wording (file_url), schema term context_blocks, basket lifecycle, and event tokens.

# Yarnnn Frontend Auth

This document tracks how the web client attaches the user's session token to every API request.

## Token requirement

All calls to the FastAPI backend must include the Supabase access token in both the `sb-access-token` and `Authorization` headers. The helper `fetchWithToken` throws an error when the token is missing. Pages should redirect the user to `/login` when this occurs.

## Utilities

- **fetchWithToken** – wraps `fetch` and ensures the token is present.
- **apiGet/apiPost/apiPut** – thin wrappers that delegate to `fetchWithToken`.

## Handling failures

If `fetchWithToken` throws, the caller should assume the user is signed out. Redirect to `/login` or surface a message prompting them to reauthenticate.

## Backend requirements

All backend services must validate tokens by:
- Checking both `sb-access-token` and `Authorization` headers
- Using `AuthMiddleware` with proper exempt paths configuration
- Verifying JWT with raw secret (no base64 decoding)
- Returning 401 on invalid/missing tokens with optional debug info via `x-yarnnn-debug-auth: 1`

## Server-side routes

Next.js API routes must:
- Use `createRouteHandlerClient` for Supabase access
- Forward user tokens to backend services (both `sb-access-token` and `Authorization` headers)
- Never use service-role keys in client-facing routes
- Try headers first, then fall back to cookies for auth token extraction

## Python Backend Auth Stack

1. **Middleware**: `AuthMiddleware` validates all non-exempt routes
2. **JWT Verifier**: `verify_jwt()` supports both raw and base64-decoded secrets
3. **Environment Variables Required**:
   - `SUPABASE_URL`: Base URL without /auth/v1
   - `SUPABASE_JWT_SECRET`: Raw JWT secret from dashboard
   - `SUPABASE_JWT_AUD`: Default "authenticated"
   - `SUPABASE_SERVICE_ROLE_KEY`: For admin operations only

## Service Role Usage

Service role keys are used ONLY for:
- Workspace bootstrap operations (`get_or_create_workspace`)
- System-level operations that bypass RLS
- Never exposed to client code or used in user-facing endpoints

## RLS Summary
- **Memory tables**: workspace-scoped SELECT; service_role-only INSERT/UPDATE/DELETE
- `reflection_cache (optional, non-authoritative)`, `timeline_events`: read by workspace members, write by service_role only
- Standard pattern: users read via workspace membership, system writes via service_role

Reflections are derived from substrate. If persisted, they live in reflection_cache as a non-authoritative cache; readers may recompute on demand.
