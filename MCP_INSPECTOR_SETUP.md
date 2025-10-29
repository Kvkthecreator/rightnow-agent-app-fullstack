# MCP Inspector Setup Guide

This guide explains how to use MCP Inspector to test the YARNNN MCP server with bearer token authentication.

## Testing Strategy

### OAuth Flow Testing → Use Real Clients (Claude.ai)
- **Purpose**: Test user authentication, consent, authorization code flow
- **Why**: Requires browser-based login which Inspector cannot handle
- **How**: Configure Claude.ai to connect via `https://mcp.yarnnn.com`

### Tool Functionality Testing → Use MCP Inspector
- **Purpose**: Test MCP tools, prompts, resources, protocol compliance
- **Why**: Inspector excels at interactive MCP protocol testing
- **How**: Use bearer token authentication (detailed below)

---

## MCP Inspector Configuration

### 1. Install MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
```

### 2. Create Inspector Config File

Create a file at `~/.mcp-inspector/config.json`:

```json
{
  "mcpServers": {
    "yarnnn-production": {
      "url": "https://mcp.yarnnn.com",
      "transport": {
        "type": "streamableHttp"
      },
      "auth": {
        "type": "bearer",
        "token": "V3_UZKgbQq1dWkbnBnFWKwQhsG48LGB6VIQTvfOAR05trDD5ZaYElfcTVqU2bxmv"
      }
    }
  }
}
```

**Note**: This token is long-lived (expires October 29, 2026) and tied to your user account (aarikgulaya@gmail.com).

### 3. Launch Inspector

```bash
mcp-inspector
```

Then connect to the `yarnnn-production` server in the Inspector UI.

---

## Your Test Bearer Token

**Token**: `V3_UZKgbQq1dWkbnBnFWKwQhsG48LGB6VIQTvfOAR05trDD5ZaYElfcTVqU2bxmv`

**Details**:
- User: aarikgulaya@gmail.com (a2e2bb36-7f02-4677-a8bb-b3acf35fa603)
- Workspace: My Workspace (273db890-acd9-4640-9ebd-bd36881c6c00)
- Expires: October 29, 2026 (1 year)
- Type: MCP OAuth Session (stored in `mcp_oauth_sessions` table)

**Testing**:
```bash
# Test token works
curl -s 'https://mcp.yarnnn.com/health' \
  -H 'Authorization: Bearer V3_UZKgbQq1dWkbnBnFWKwQhsG48LGB6VIQTvfOAR05trDD5ZaYElfcTVqU2bxmv'
```

---

## What You Can Test with Inspector

### ✅ MCP Protocol Features
- **Tools**: All memory operations, substrate queries, timeline management
- **Prompts**: Brief composition, reflection generation, insights
- **Resources**: Document access, substrate browsing
- **Sampling**: AI model interactions through MCP

### ✅ Development Workflows
- **New tool development**: Test tools interactively before deploying
- **Protocol compliance**: Verify MCP spec adherence
- **Error handling**: Test edge cases and error scenarios
- **Performance**: Measure tool response times

### ❌ What Inspector Cannot Test
- OAuth authorization flow (use Claude.ai instead)
- Browser-based user interactions
- Multi-user scenarios
- Session cookie handling

---

## Generating New Test Tokens (Admin)

If you need to create additional test tokens in the future, run:

```python
import secrets
import uuid
from datetime import datetime, timedelta, timezone

# Generate token
access_token = secrets.token_urlsafe(48)
supabase_token = f'inspector_test_{secrets.token_urlsafe(32)}'
session_id = str(uuid.uuid4())
user_id = 'a2e2bb36-7f02-4677-a8bb-b3acf35fa603'  # Your user ID
workspace_id = '273db890-acd9-4640-9ebd-bd36881c6c00'  # Your workspace ID
expires_at = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
created_at = datetime.now(timezone.utc).isoformat()

print(f"Token: {access_token}")
print(f"\nSQL to insert:")
print(f"""
INSERT INTO mcp_oauth_sessions (id, mcp_token, supabase_token, user_id, workspace_id, expires_at, created_at, last_used_at)
VALUES (
  '{session_id}',
  '{access_token}',
  '{supabase_token}',
  '{user_id}',
  '{workspace_id}',
  '{expires_at}',
  '{created_at}',
  '{created_at}'
);
""")
```

Then run the SQL using your Supabase connection.

---

## Architecture Notes

### Why This Approach?

1. **Universal OAuth Server**: Your MCP server is designed for production OAuth with real clients
2. **Separation of Concerns**: OAuth testing ≠ Tool testing
3. **Practical**: Inspector is a dev tool that doesn't need full OAuth ceremony
4. **Secure**: Test tokens are scoped to your user account and expire after 1 year

### MCP Server Architecture

```
┌─────────────────────────────────────────────┐
│  MCP Clients                                │
│  ├─ Claude.ai (OAuth 2.0 flow)             │
│  ├─ Inspector (Bearer token)                │
│  └─ Future clients (OAuth 2.0 flow)         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  mcp.yarnnn.com (MCP Adapter)               │
│  ├─ OAuth endpoints (proxy to backend)     │
│  ├─ MCP protocol handler                    │
│  └─ Bearer token validation                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  api.yarnnn.com (Backend)                   │
│  ├─ OAuth authorization server              │
│  ├─ MCP business logic                      │
│  └─ Database (mcp_oauth_sessions)           │
└─────────────────────────────────────────────┘
```

### Token Validation Flow

1. Inspector sends request with `Authorization: Bearer <token>`
2. MCP adapter validates token against `mcp_oauth_sessions` table
3. If valid, request proceeds with user context
4. Backend receives authenticated requests with user_id and workspace_id

---

## Troubleshooting

### Token Not Working?
```bash
# Check if token exists in database
PGPASSWORD="..." psql -h ... -c "SELECT id, user_id, expires_at FROM mcp_oauth_sessions WHERE mcp_token = 'YOUR_TOKEN';"
```

### Inspector Connection Issues?
1. Verify MCP server is running: `curl https://mcp.yarnnn.com/health`
2. Check token format in config.json (no extra quotes or spaces)
3. Ensure Inspector is latest version: `npm update -g @modelcontextprotocol/inspector`

### Need to Revoke Token?
```sql
DELETE FROM mcp_oauth_sessions WHERE mcp_token = 'YOUR_TOKEN';
```

---

## Next Steps

1. **Launch Inspector** with the configuration above
2. **Test OAuth flow** with Claude.ai separately
3. **Develop new tools** using Inspector for rapid iteration
4. **Monitor sessions**: Check `mcp_oauth_sessions` table to see active tokens

Your MCP server is now ready for both production OAuth (Claude.ai) and development testing (Inspector)!
