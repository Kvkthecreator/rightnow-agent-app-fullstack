# OAuth Setup for Claude.ai Remote MCP Connector

This document explains how to configure OAuth for the YARNNN MCP server to work with Claude.ai's remote connector feature.

## Overview

Claude.ai requires OAuth 2.0 for remote MCP connectors. The YARNNN MCP server integrates with your existing Supabase authentication:

```
Claude.ai → OAuth Flow → MCP Server → YARNNN Auth → Supabase
```

## Prerequisites

- Claude Pro, Team, or Enterprise account
- YARNNN MCP server deployed and accessible via HTTPS
- YARNNN web app running at https://yarnnn.com

## Configuration Steps

### 1. Enable OAuth in MCP Server

Update your Render service environment variables:

```bash
OAUTH_ENABLED=true
OAUTH_CLIENT_ID=<optional-client-id>
OAUTH_CLIENT_SECRET=<optional-client-secret>
```

> **Note**: Client ID/Secret are optional. Claude.ai will work without them, but you can add them for additional security.

### 2. Deploy the Updated Server

```bash
# The server will automatically expose OAuth endpoints when OAUTH_ENABLED=true:
# - GET /authorize - Authorization endpoint
# - GET /oauth/callback - Callback from YARNNN web app
# - POST /token - Token exchange endpoint
# - GET /.well-known/mcp.json - Discovery with OAuth metadata
```

### 3. Register in Claude.ai

1. Go to **Settings → Connectors** (Pro/Max) or **Admin Settings → Connectors** (Team/Enterprise)
2. Click **Add custom connector**
3. Enter your MCP server URL: `https://yarnnn-mcp-anthropic.onrender.com`
4. Claude will fetch `/.well-known/mcp.json` and detect OAuth support
5. (Optional) If you configured client credentials, enter them here
6. Save the connector

### 4. User Authorization Flow

When a user enables the YARNNN connector in Claude:

1. **Claude redirects** → `https://your-mcp-server.com/authorize`
2. **MCP shows consent page** → Redirects to `https://yarnnn.com/mcp/authorize`
3. **User logs in** → Supabase authentication (if not already logged in)
4. **User clicks "Authorize"** → YARNNN web app
5. **Web app redirects back** → MCP server `/oauth/callback` with Supabase token
6. **MCP generates code** → Redirects to Claude with authorization code
7. **Claude exchanges code** → MCP `/token` endpoint
8. **MCP returns access token** → Mapped to user's Supabase session
9. **User is connected** → Can use YARNNN tools in Claude

## Environment Variables Reference

### MCP Server (Render)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OAUTH_ENABLED` | No | `false` | Enable OAuth 2.0 flow |
| `OAUTH_CLIENT_ID` | No | - | Optional client ID for added security |
| `OAUTH_CLIENT_SECRET` | No | - | Optional client secret |
| `BACKEND_URL` | Yes | - | YARNNN backend API URL |
| `MCP_TRANSPORT` | Yes | `stdio` | Set to `http` for cloud deployment |
| `PORT` | Yes (HTTP mode) | `3000` | Server port |

### Backend (FastAPI)

No additional configuration needed. The OAuth session endpoints (`/api/mcp/auth/sessions`) are automatically available.

## How It Works

### Token Mapping

The OAuth flow creates a mapping between Claude's access tokens and YARNNN Supabase tokens:

```
Claude OAuth Token (yat_xxx) → Supabase JWT → User Session
```

**Storage**:
- In-memory cache for fast lookups
- Backend persistence via `/api/mcp/auth/sessions` for reliability
- 24-hour token expiration

### Authentication Flow

When Claude makes MCP requests:

1. Claude sends: `Authorization: Bearer yat_xxx`
2. MCP server validates OAuth token
3. MCP server looks up Supabase token
4. MCP server calls YARNNN backend with Supabase token
5. Backend validates Supabase JWT
6. Backend resolves workspace via canonical helper
7. Tool executes with proper auth context

## Security Considerations

### Token Security

- OAuth tokens are cryptographically secure (32 bytes, base64url)
- Tokens expire after 24 hours
- Authorization codes expire after 10 minutes
- All tokens stored with expiration timestamps

### Workspace Isolation

- Each OAuth session is tied to a single Supabase user
- Workspace resolution follows YARNNN auth canon (single workspace per user)
- RLS policies enforce data isolation

### HTTPS Required

- Claude.ai requires HTTPS for remote connectors
- Render provides automatic SSL certificates
- Never expose OAuth endpoints over HTTP in production

## Testing the Flow

### Local Testing (Development)

```bash
# 1. Start MCP server with OAuth disabled (use bearer tokens for local dev)
OAUTH_ENABLED=false npm run dev:anthropic

# 2. Test with Claude Desktop using stdio (no OAuth needed)
```

### Production Testing

```bash
# 1. Verify discovery endpoint
curl https://yarnnn-mcp-anthropic.onrender.com/.well-known/mcp.json

# Expected response:
# {
#   "version": "2024-10-01",
#   "transports": { "sse": { "url": "..." } },
#   "auth": {
#     "type": "oauth2",
#     "oauth2": {
#       "authorization_endpoint": "https://.../authorize",
#       "token_endpoint": "https://.../token"
#     }
#   }
# }

# 2. Try authorization flow in Claude.ai
# - Go to Settings → Connectors
# - Add YARNNN connector
# - Click "Connect" and complete OAuth flow
```

## Troubleshooting

### "OAuth not enabled" error

**Symptom**: Claude shows error when trying to connect

**Solution**: Ensure `OAUTH_ENABLED=true` in Render environment variables and redeploy

### "Missing authorization" error

**Symptom**: SSE connection fails with 401

**Solution**: OAuth token validation is failing. Check:
- Token is being sent in Authorization header
- Token hasn't expired (24 hour limit)
- Backend session storage is working (`/api/mcp/auth/sessions/validate`)

### Redirect loop during authorization

**Symptom**: User keeps getting redirected between pages

**Solution**: Check that:
- Frontend OAuth page (`/mcp/authorize`) is deployed
- All query parameters are being preserved during redirects
- Supabase auth is working (user can log in normally)

### "Invalid client" error

**Symptom**: Token exchange fails

**Solution**: If you set `OAUTH_CLIENT_SECRET`, ensure:
- Claude.ai has the same client ID/secret configured
- Secret matches exactly (no trailing spaces/newlines)

## Revoking Access

Users can revoke Claude's access to their YARNNN workspace:

### Via YARNNN Settings (Future)

- Go to Settings → Integrations
- Find "Claude.ai" connection
- Click "Revoke Access"

### Via Backend API

```bash
curl -X DELETE \
  https://api.yarnnn.com/api/mcp/auth/sessions/<mcp_token> \
  -H "Authorization: Bearer <supabase_token>"
```

### Via Claude.ai

- Go to Settings → Connectors
- Find YARNNN
- Click menu → Remove

## Migration from Bearer Tokens

If you were previously using bearer tokens (integration tokens):

1. OAuth does not replace integration tokens - both work
2. OAuth is required for Claude.ai remote connector
3. Integration tokens still work for direct API access
4. Users can keep existing tokens and add OAuth connections

## Support

If you encounter issues:

1. Check Render logs for MCP server errors
2. Check browser console for OAuth page errors
3. Verify backend `/api/mcp/auth/sessions` endpoints work
4. Review YARNNN auth canon (`docs/YARNNN_AUTH_CANON.md`)
5. File issue at https://github.com/anthropics/claude-code/issues

---

**Version**: 1.0.0
**Last Updated**: 2025-10-11
**Related Docs**: `docs/CLAUDE_REMOTE_MCP.md`, `docs/YARNNN_AUTH_CANON.md`
