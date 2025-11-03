# MCP OAuth Troubleshooting Guide

## Common Issues & Solutions

### Issue: "Failed to generate authorization url"

**Symptoms**: Claude.ai shows error when trying to connect

**Root Causes**:
1. Missing `scopes_supported` in OAuth metadata
2. Missing `registration_endpoint` in authorization server metadata

**Solution**:
```typescript
// In /.well-known/oauth-authorization-server metadata:
{
  registration_endpoint: "https://mcp.yarnnn.com/oauth/register",
  scopes_supported: ["mcp:*"]
}

// In /.well-known/oauth-protected-resource metadata:
{
  scopes_supported: ["mcp:*"],
  bearer_methods_supported: ["header"]
}
```

**Why**: Claude.ai requires Dynamic Client Registration (RFC 7591) and needs to know what scopes are available before constructing authorization URLs.

---

### Issue: "Auth session missing" / Login redirect loop

**Symptoms**: After Google OAuth, user is redirected back to login page instead of MCP authorize page

**Root Cause**: MCP authorize page using wrong Supabase client initialization

**Wrong**:
```typescript
import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(url, key);
```

**Correct**:
```typescript
import { createBrowserClient } from '@/lib/supabase/clients';
const supabase = createBrowserClient();
```

**Why**: The centralized client uses `@supabase/auth-helpers-nextjs` which properly configures cookie-based session storage. Direct `@supabase/ssr` initialization doesn't read session cookies correctly after OAuth redirects.

---

### Issue: Redirect to `/dashboard` instead of MCP authorize page

**Symptoms**: After Google login, user goes to dashboard instead of completing MCP authorization

**Root Cause**: `returnUrl` query parameter not being stored before OAuth

**Solution**:
```typescript
// In LoginClient component:
useEffect(() => {
  const returnUrl = searchParams.get('returnUrl');
  if (returnUrl) {
    localStorage.setItem('redirectPath', returnUrl);
  }
}, [searchParams]);

// Auth callback already reads from localStorage:
const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
```

**Why**: OAuth redirects lose query parameters. Using `localStorage` preserves the intended destination across the OAuth flow.

---

### Issue: MCP initialize requests not triggering OAuth

**Symptoms**: Claude sends initialize requests but doesn't proceed to authorization

**Root Cause**: Server not detecting JSON-RPC requests properly

**Solution**:
```typescript
// Check for jsonrpc field, not User-Agent:
if (rpcRequest.jsonrpc === '2.0' && rpcRequest.method === 'initialize') {
  // Return 401 with OAuth challenge
}
```

**Why**: User-Agent headers vary and are unreliable. JSON-RPC requests always have `jsonrpc: "2.0"`.

---

## Debugging Tips

### Enable verbose logging

Check browser console for:
- `[Login] returnUrl from query params:`
- `[Auth Callback] Redirect path from localStorage:`
- `[MCP Auth] Checking authentication...`
- `[MCP Auth] Auth check result:`

Check Render/server logs for:
- `[OAuth] Dynamic client registration request:`
- `[OAuth] Authorization request:`
- `[MCP] Received initialize request`
- `[MCP] No OAuth token, returning 401 with OAuth challenge`

### Verify OAuth metadata

```bash
# Check authorization server metadata
curl https://mcp.yarnnn.com/.well-known/oauth-authorization-server | jq .

# Check protected resource metadata
curl https://mcp.yarnnn.com/.well-known/oauth-protected-resource | jq .

# Test MCP discovery
curl https://mcp.yarnnn.com/.well-known/mcp.json | jq .
```

### Test OAuth flow manually

```bash
# 1. Register client
curl -X POST https://mcp.yarnnn.com/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","redirect_uris":["http://localhost"]}'

# 2. Visit authorize URL in browser (use client_id from step 1)
# https://mcp.yarnnn.com/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=http://localhost&state=test&scope=mcp:*

# 3. After authorization, exchange code for token
curl -X POST https://mcp.yarnnn.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=CODE&redirect_uri=http://localhost&client_id=CLIENT_ID"
```

---

## Key Learnings

1. **Dynamic Client Registration is required** - Claude.ai won't work without RFC 7591 support
2. **Scopes must be advertised** - Both in authorization server and protected resource metadata
3. **Cookie-based sessions** - Use centralized Supabase client for proper cookie handling
4. **localStorage for redirects** - OAuth flows lose query params, use storage
5. **90-day tokens** - Long-lived tokens with auto-renewal for better UX
6. **JSON-RPC detection** - Check protocol fields, not User-Agent headers
