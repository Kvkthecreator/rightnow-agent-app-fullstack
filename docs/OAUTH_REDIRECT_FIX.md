# OAuth Redirect Fix - Issue Resolution

## Problem
After Google OAuth login, users were redirected to `www.yarnnn.com/#` instead of `/baskets`.

## Root Cause
The redirect chain was:
1. Google OAuth → `galytxxkrbksilekmhcw.supabase.co/auth/v1/callback`
2. Supabase → `yarnnn.com/auth/callback` ❌ (no www)
3. Next.js middleware → `www.yarnnn.com/` (strips query params during redirect)
4. Result: User lands on root page without auth code

## Solution

### 1. Supabase Dashboard Configuration
**URL**: https://supabase.com/dashboard/project/galytxxkrbksilekmhcw/auth/url-configuration

**Required Settings:**
- **Site URL**: `https://www.yarnnn.com` (WITH www)
- **Redirect URLs**: 
  - `https://www.yarnnn.com/auth/callback`
  - `http://localhost:3000/auth/callback` (for local development)

### 2. Vercel Environment Variables
**Location**: Vercel Dashboard → Project Settings → Environment Variables

**Required Variable:**
```
NEXT_PUBLIC_SITE_URL=https://www.yarnnn.com
```

### 3. Local Development (.env.local)
```bash
NEXT_PUBLIC_SITE_URL=https://www.yarnnn.com
```

### 4. Code Changes Made
- Enhanced OAuth callback debugging (commit: 0bf6c7d4)
- Simplified redirect logic to use Next.js router (commit: 5f42d9a1)

## Testing Checklist
- [ ] Update Supabase Site URL to `https://www.yarnnn.com`
- [ ] Add `https://www.yarnnn.com/auth/callback` to Supabase Redirect URLs
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel environment variables
- [ ] Trigger new Vercel deployment
- [ ] Clear browser cookies for www.yarnnn.com
- [ ] Test OAuth login flow
- [ ] Verify console shows debug logs
- [ ] Confirm redirect to `/baskets` after successful login

## Expected Flow After Fix
1. User clicks "Continue with Google" at `www.yarnnn.com/login`
2. Google OAuth completes → redirects to Supabase callback
3. Supabase → `www.yarnnn.com/auth/callback?code=...` (WITH www)
4. Auth callback exchanges code for session
5. User redirected to `/baskets`
6. Console shows: `✅ Auth complete! Redirecting to: /baskets`

## Critical Notes
- **Always use `www.yarnnn.com`** in all OAuth configurations
- The `www` subdomain is canonical per Next.js config redirects
- Never use `yarnnn.com` without www in production settings

---
**Date**: 2025-10-01  
**Status**: Awaiting Supabase configuration update
