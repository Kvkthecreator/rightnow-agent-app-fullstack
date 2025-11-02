# YARNNN v4.0 Mono-Repo Deployment Guide

## Overview

YARNNN v4.0 mono-repo contains three deployable services:

1. **Platform API** (`platform/api/`) - AI Work Platform with v4.0 unified governance
2. **Enterprise API** (`enterprise/api/`) - Context Management with MCP integration
3. **ChatGPT App** (`apps/chatgpt/`) - OpenAI GPT integration

## Render Deployment (APIs)

The `render.yaml` configuration has been updated for mono-repo structure:

### Platform API
- **Service name**: `yarnnn-platform-api`
- **Root directory**: `platform/api/`
- **Build command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start command**: `uvicorn src.app.agent_server:app --host 0.0.0.0 --port 10000 --log-level debug`
- **Environment variables**:
  - OPENAI_API_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL

### Enterprise API
- **Service name**: `yarnnn-enterprise-api`
- **Root directory**: `enterprise/api/`
- **Build command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start command**: `uvicorn src.app.agent_server:app --host 0.0.0.0 --port 10000 --log-level debug`
- **Environment variables**:
  - OPENAI_API_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL
  - MCP_SHARED_SECRET

## Vercel Deployment (Web Frontends)

### Platform Web
- **Root directory**: `platform/web/`
- **Framework**: Next.js (auto-detected)
- **Build command**: `npm run build` (auto)
- **Output directory**: `.next` (auto)

### Enterprise Web
- **Root directory**: `enterprise/web/`
- **Framework**: Next.js (auto-detected)
- **Build command**: `npm run build` (auto)
- **Output directory**: `.next` (auto)

## Deployment Steps

### 1. Push to GitHub
```bash
git push origin feature/mono-repo-restructure
```

### 2. Update Render Services
Go to Render Dashboard:
- **Platform API**: Update Root Directory to `platform/api/`
- **Enterprise API**: Create new service with Root Directory `enterprise/api/`

### 3. Update Vercel Projects
Go to Vercel Dashboard:
- **Platform Web**: Update Root Directory to `platform/web/`
- **Enterprise Web**: Create new project with Root Directory `enterprise/web/`

## Environment Variables

Both APIs share most environment variables except:
- **Enterprise API** additionally requires `MCP_SHARED_SECRET` for ChatGPT/Claude integration

## Shared Code

The `shared/` directory contains:
- `shared/substrate/` - Substrate models, routes, services
- `shared/utils/` - JWT, Supabase client, etc.
- `shared/database/` - Migrations and database client

**Important**: Ensure `shared/` is accessible from both `platform/` and `enterprise/` by adding the repo root to PYTHONPATH in build scripts if needed.

## Migration Notes

### From v2.1 to v4.0
- Work sessions now use `work_sessions` table instead of `agent_processing_queue`
- New unified governance endpoints: `/api/work/sessions` and `/api/work/review`
- UnifiedApprovalOrchestrator handles single-review dual-effect governance

### Rollback (Enterprise)
Enterprise API is rolled back to commit `b735c693` (pre-v4.0) with MCP routes added.
This ensures MCP integration remains stable while Work Platform evolves independently.

## Testing Deployment

### Platform API Health Check
```bash
curl https://yarnnn-platform-api.onrender.com/health
```

### Enterprise API Health Check
```bash
curl https://yarnnn-enterprise-api.onrender.com/health
```

### MCP Integration Test
```bash
curl https://yarnnn-enterprise-api.onrender.com/api/mcp/v1/resources
```

## Troubleshooting

### Import Errors
If you see "ModuleNotFoundError: No module named 'shared'":
- Ensure PYTHONPATH includes repo root
- Check that `shared/` directory is accessible from service root

### Missing Environment Variables
Check Render/Vercel dashboard to ensure all env vars are set correctly.

### Database Connection Issues
Verify `DATABASE_URL` and `SUPABASE_URL` are correct and accessible from service.
