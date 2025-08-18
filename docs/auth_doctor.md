# Auth Doctor Report

This report documents the investigation and fix for 401 errors on `POST /api/baskets/new` in production.

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
