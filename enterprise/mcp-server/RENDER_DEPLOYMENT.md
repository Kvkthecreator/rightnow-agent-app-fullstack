# Render Deployment Guide – YARNNN AI Integrations

The workspace now ships two deployable adapters that reuse the same `@yarnnn/integration-core` logic. Each adapter should run as its own Render Web Service.

## 1. Anthropic MCP Adapter (`@yarnnn/anthropic-mcp`)

**Purpose:** Claude / MCP access over stdio or HTTP (SSE).

### Dashboard Setup
1. Render dashboard → **New +** → **Web Service**
2. Repo: `Kvkthecreator/rightnow-agent-app-fullstack`
3. Branch: `main`
4. Root Directory: `mcp-server`
5. Environment: **Node**
6. Build Command:
   ```bash
   npm install && npm run build:core && npm run build:anthropic
   ```
7. Start Command:
   ```bash
   npm run start -w @yarnnn/anthropic-mcp
   ```
8. Instance: Starter ($7/mo) or Free for testing

### Environment Variables
| Key | Value | Required |
|-----|-------|----------|
| `BACKEND_URL` | `https://api.yarnnn.com` | ✅ |
| `MCP_TRANSPORT` | `http` *(use `stdio` only for CLI testing)* | ✅ |
| `PORT` | `3000` | ✅ |
| `LOG_LEVEL` | `info` | ❌ |
| `OAUTH_ENABLED` | `true` *(for Claude.ai remote connector)* | ❌ |
| `OAUTH_CLIENT_ID` | `<optional>` | ❌ |
| `OAUTH_CLIENT_SECRET` | `<optional>` | ❌ |

> **OAuth Setup**: For Claude.ai remote connector support, set `OAUTH_ENABLED=true`. See `docs/OAUTH_SETUP.md` for complete OAuth configuration guide.

> The service automatically exposes `/sse`, `/message`, `/health`, and (when OAuth enabled) `/authorize`, `/token`, `/oauth/callback` routes.

### Resulting URLs
- Service: `https://yarnnn-mcp-server.onrender.com`
- SSE endpoint: `https://yarnnn-mcp-server.onrender.com/sse`
- Health: `https://yarnnn-mcp-server.onrender.com/health`

## 2. OpenAI Apps Adapter (`@yarnnn/openai-apps`)

**Status:** scaffolded stub – use it as the landing point for OAuth and Apps SDK integration.

### Dashboard Setup
1. Render dashboard → **New +** → **Web Service**
2. Repo: `Kvkthecreator/rightnow-agent-app-fullstack`
3. Branch: `main`
4. Root Directory: `mcp-server`
5. Environment: **Node**
6. Build Command:
   ```bash
   npm install && npm run build:core && npm run build:openai
   ```
7. Start Command:
   ```bash
   npm run start -w @yarnnn/openai-apps
   ```
8. Instance: Starter ($7/mo) recommended (OAuth callbacks)

### Environment Variables
| Key | Recommended Value | Notes |
|-----|-------------------|-------|
| `BACKEND_URL` | `https://api.yarnnn.com` | Shared backend |
| `PORT` | `4000` | Default scaffold port |
| `LOG_LEVEL` | `info` | |
| `OPENAI_CLIENT_ID` | `<set when available>` | Needed for real Apps SDK usage |
| `OPENAI_CLIENT_SECRET` | `<set when available>` | |
| `OPENAI_REDIRECT_URI` | `https://<service>.onrender.com/oauth/callback` | Register with OpenAI |

> Until OAuth wiring is implemented the service will respond with `501 Not Implemented` for tool execution. The `/tools` endpoint is useful for smoke tests.

### Resulting URLs
- Service (example): `https://yarnnn-openai-apps.onrender.com`
- Health: `https://yarnnn-openai-apps.onrender.com/health`
- Tool list (temporary): `https://yarnnn-openai-apps.onrender.com/tools`

## Custom Domains (Optional)
Assign distinct subdomains so clients can reference the correct adapter:

| Adapter | Suggested Domain |
|---------|------------------|
| Anthropic MCP | `mcp.yarnnn.com` |
| OpenAI Apps | `chatgpt.yarnnn.com` |

Configure CNAME records pointing to the Render service hostnames. SSL certificates are provisioned automatically once DNS propagates.

## Deployment via Blueprint
If you prefer infrastructure-as-code, extend the root `render.yaml` to declare both services. Example snippet:

```yaml
services:
  - type: web
    name: yarnnn-mcp-server
    env: node
    plan: starter
    root: mcp-server
    buildCommand: npm install && npm run build:core && npm run build:anthropic
    startCommand: npm run start -w @yarnnn/anthropic-mcp
    envVars:
      - key: BACKEND_URL
        value: https://api.yarnnn.com
      - key: MCP_TRANSPORT
        value: http
      - key: PORT
        value: 3000

  - type: web
    name: yarnnn-openai-apps
    env: node
    plan: starter
    root: mcp-server
    buildCommand: npm install && npm run build:core && npm run build:openai
    startCommand: npm run start -w @yarnnn/openai-apps
    envVars:
      - key: BACKEND_URL
        value: https://api.yarnnn.com
      - key: PORT
        value: 4000
      - key: LOG_LEVEL
        value: info
```

Commit the updated blueprint and push to `main`; Render will deploy both services automatically.

## Smoke Testing After Deployment

```bash
# Anthropic adapter
curl https://yarnnn-mcp-server.onrender.com/health

# OpenAI adapter scaffold
curl https://yarnnn-openai-apps.onrender.com/tools
```

If both checks return 200 OK you are ready to connect Claude or continue building the ChatGPT integration.EOF

