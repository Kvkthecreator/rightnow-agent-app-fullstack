# Vercel 503 Error - Root Cause Analysis

**Date**: 2025-11-22
**Status**: IDENTIFIED - Environment Variable Missing

---

## Problem

`POST /api/projects/new` returns **503 Service Unavailable** in **578ms** (not a timeout).

---

## Root Cause

**Missing Environment Variable** in Vercel deployment:

The Next.js API route at `/api/projects/new/route.ts` uses:

```typescript
const WORK_PLATFORM_API_URL = process.env.NEXT_PUBLIC_WORK_PLATFORM_API_URL || 'http://localhost:8000';
```

**Issue**: `NEXT_PUBLIC_WORK_PLATFORM_API_URL` is **not set** in Vercel environment variables.

**Result**:
1. Falls back to `http://localhost:8000`
2. Vercel serverless function tries to connect to localhost
3. Connection fails immediately (localhost doesn't exist in serverless context)
4. Returns 503 Service Unavailable

---

## Evidence

1. **Execution time**: 578ms (instant failure, not timeout)
2. **Backend logs**: No requests reaching `https://yarnnn-app-fullstack.onrender.com`
3. **Vercel logs**: "No logs found for this request" (error before logging)

---

## Solution

Add environment variable in Vercel project settings:

```
NEXT_PUBLIC_WORK_PLATFORM_API_URL=https://yarnnn-app-fullstack.onrender.com
```

### Steps to Fix:

1. Go to Vercel dashboard: https://vercel.com/yarnnn/yarnnn-platform/settings/environment-variables
2. Add new environment variable:
   - **Key**: `NEXT_PUBLIC_WORK_PLATFORM_API_URL`
   - **Value**: `https://yarnnn-app-fullstack.onrender.com`
   - **Environments**: Production, Preview, Development
3. Click "Save"
4. Redeploy (or trigger new deployment by pushing empty commit)

---

## Verification

After adding the environment variable and redeploying:

1. **Test project creation**: `POST https://www.yarnnn.com/api/projects/new`
2. **Check Render logs**: Should see incoming requests with `[PROJECT SCAFFOLDING]` logs
3. **Expected response**: 200 OK with project data including `agent_session_ids`

---

## Why Previous Fix Didn't Work

The `vercel.json` timeout configuration (commit `1cde3ed9`) addressed a **different problem**:
- Timeout config prevents future timeout issues (good for production)
- But doesn't solve the **immediate 503** caused by missing backend URL

---

## Impact

**Current State**:
- ✅ Backend deployed successfully (Render)
- ✅ Frontend deployed successfully (Vercel)
- ❌ Frontend → Backend connection broken (missing env var)

**After Fix**:
- ✅ Complete end-to-end project creation
- ✅ All 4 agent sessions pre-scaffolded
- ✅ Overview page shows "4 Agents Ready"
