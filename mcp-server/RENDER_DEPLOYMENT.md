# YARNNN MCP Server - Render Deployment Guide

## Overview

This guide will help you deploy the YARNNN MCP Server as a separate **Web Service** on Render, independent from your existing backend service.

### Architecture After Deployment

```
┌─────────────────────────────────────────────┐
│  Render Services (Oregon)                   │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ rightnow-agent-app-fullstack        │  │
│  │ (Python/FastAPI - Existing)         │  │
│  │ URL: api.yarnnn.com                 │  │
│  └─────────────────────────────────────┘  │
│                ↑                            │
│                │ HTTP REST API              │
│                │                            │
│  ┌─────────────────────────────────────┐  │
│  │ yarnnn-mcp-server                   │  │
│  │ (Node/TypeScript - New)             │  │
│  │ URL: mcp.yarnnn.com                 │  │
│  └─────────────────────────────────────┘  │
│                ↑                            │
└────────────────┼────────────────────────────┘
                 │ MCP Protocol (HTTP+SSE)
                 ↓
         ┌───────────────┐
         │  MCP Clients  │
         │ (Claude, etc) │
         └───────────────┘
```

## Deployment Options

### Option 1: Using Render Dashboard (Recommended for First Time)

#### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Kvkthecreator/rightnow-agent-app-fullstack`

#### Step 2: Configure Service

**Basic Settings:**
- **Name:** `yarnnn-mcp-server`
- **Region:** Oregon (same as backend)
- **Branch:** `main`
- **Root Directory:** `mcp-server`
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

**Instance Type:**
- **Plan:** Starter ($7/month) or Free (for testing)

#### Step 3: Environment Variables

Add these environment variables in the Render dashboard:

| Key | Value | Description |
|-----|-------|-------------|
| `BACKEND_URL` | `https://api.yarnnn.com` | YARNNN backend API gateway |
| `NODE_ENV` | `production` | Node environment |
| `MCP_TRANSPORT` | `http` | Use HTTP+SSE for cloud |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Logging level |

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Build TypeScript
   - Start the MCP server
3. Wait for deployment (~2-3 minutes)

#### Step 5: Get Your MCP Server URL

After deployment succeeds:
- Your MCP server URL: `https://yarnnn-mcp-server.onrender.com`
- SSE endpoint: `https://yarnnn-mcp-server.onrender.com/sse`

### Option 2: Using Blueprint (render.yaml) - Automated

The `mcp-server/render.yaml` file is already configured. To use it:

#### Step 1: Add to Root Blueprint

Edit `/render.yaml` (root) and add:

```yaml
services:
  # Existing backend service
  - type: web
    name: rightnow-api
    env: python
    # ... existing config ...

  # NEW: MCP Server
  - type: web
    name: yarnnn-mcp-server
    env: node
    region: oregon
    plan: starter
    root: mcp-server
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: BACKEND_URL
        value: https://api.yarnnn.com
      - key: NODE_ENV
        value: production
      - key: MCP_TRANSPORT
        value: http
      - key: PORT
        value: 3000
      - key: LOG_LEVEL
        value: info
```

#### Step 2: Deploy via Blueprint

```bash
# Commit blueprint changes
git add render.yaml
git commit -m "Add MCP server to Render blueprint"
git push origin main

# Render will auto-detect and deploy both services
```

## Custom Domain Setup (Optional)

### Using mcp.yarnnn.com

1. In Render dashboard → `yarnnn-mcp-server` → **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter: `mcp.yarnnn.com`
4. Render provides CNAME record
5. Add to your DNS provider:
   ```
   CNAME  mcp  yarnnn-mcp-server.onrender.com
   ```
6. Wait for DNS propagation (~5-10 minutes)
7. SSL certificate auto-provisions

### Result:
- MCP Server: `https://mcp.yarnnn.com`
- SSE Endpoint: `https://mcp.yarnnn.com/sse`

## Connecting MCP Clients

### For Claude Desktop (when using HTTP transport)

Edit Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "yarnnn": {
      "url": "https://mcp.yarnnn.com/sse",
      "headers": {
        "Authorization": "Bearer YOUR_SUPABASE_JWT_TOKEN"
      }
    }
  }
}
```

### For Other MCP Clients

Provide connection details:
- **Transport:** HTTP+SSE
- **Endpoint:** `https://mcp.yarnnn.com/sse`
- **Authentication:** Include `user_token` in request metadata

## Monitoring & Logs

### View Logs

**Render Dashboard:**
1. Go to `yarnnn-mcp-server` service
2. Click **"Logs"** tab
3. See real-time server logs

**Key Log Messages:**
```
[CONFIG] Loaded configuration: { backendUrl: 'https://api.yarnnn.com', ... }
[SERVER] Starting MCP server in HTTP mode on port 3000...
[SERVER] MCP server running on http://0.0.0.0:3000
[SERVER] SSE endpoint: http://0.0.0.0:3000/sse
[AUTH] User authenticated: { userId: '...', workspaceId: '...' }
[TOOL] Executing: get_substrate { ... }
[TOOL] Success: get_substrate { substrate: [...] }
```

### Health Check

```bash
# Check if server is running
curl https://mcp.yarnnn.com/sse

# Should return SSE connection headers
```

## Troubleshooting

### Issue: Build Fails

**Error:** `Cannot find module '@modelcontextprotocol/sdk'`

**Solution:**
1. Check `package.json` exists in `mcp-server/`
2. Verify build command: `npm install && npm run build`
3. Check Render build logs for errors

### Issue: Server Starts but Crashes

**Error:** `Missing required environment variable: BACKEND_URL`

**Solution:**
1. Verify all env vars are set in Render dashboard
2. Redeploy service

### Issue: Authentication Fails

**Error:** `Authentication failed: 401`

**Solution:**
1. Verify `BACKEND_URL=https://api.yarnnn.com` is correct
2. Ensure backend `/api/auth/validate` endpoint exists
3. Check token is valid Supabase JWT

### Issue: Can't Connect from Claude

**Error:** Connection timeout

**Solution:**
1. Verify SSE endpoint: `https://mcp.yarnnn.com/sse`
2. Check server is running (Render logs)
3. Verify custom domain DNS is configured
4. Try with direct Render URL first

## Testing Deployment

### 1. Test Server Health

```bash
# Basic connectivity
curl -v https://mcp.yarnnn.com/sse
```

### 2. Test Authentication (requires valid token)

```bash
# Will fail without backend endpoint, but shows if server responds
curl -X POST https://mcp.yarnnn.com/sse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test from Claude Desktop

1. Configure Claude Desktop with MCP server URL
2. Open Claude Desktop
3. Check if YARNNN tools appear
4. Try executing a tool

## Cost Estimate

**Render Pricing:**
- **Starter Plan:** $7/month
  - 512 MB RAM
  - 0.5 CPU
  - Good for production

- **Free Plan:** $0/month
  - Spins down after 15 min inactivity
  - 512 MB RAM
  - Good for testing only

**Recommendation:** Start with **Free** for testing, upgrade to **Starter** for production.

## Rollback / Revert

If deployment fails:

1. **Render Dashboard:**
   - Go to service → **Settings**
   - Click **"Delete Service"**

2. **Blueprint Method:**
   - Remove MCP service from `render.yaml`
   - Commit and push

## Next Steps After Deployment

1. ✅ MCP server deployed and running
2. ⏳ Implement backend endpoints (`/api/mcp/*`)
3. ⏳ Test with Claude Desktop
4. ⏳ Configure custom domain
5. ⏳ Set up monitoring/alerts

## Summary Checklist

- [ ] Create Render Web Service for `mcp-server`
- [ ] Configure environment variables
- [ ] Deploy and verify logs
- [ ] (Optional) Set up custom domain `mcp.yarnnn.com`
- [ ] Test connection from Claude Desktop
- [ ] Monitor logs for errors
- [ ] Implement backend MCP endpoints

Your MCP server will be accessible at:
- **Default:** `https://yarnnn-mcp-server.onrender.com`
- **Custom:** `https://mcp.yarnnn.com` (after DNS setup)
