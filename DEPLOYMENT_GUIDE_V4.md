# YARNNN v4.0 Mono-Repo Deployment Guide (Phase 2: Architecture Refactor)

## Overview

YARNNN v4.0 mono-repo follows a **Backend-for-Frontend (BFF)** architecture pattern with clear domain separation:

1. **Platform API** (`platform/api/`) - AI Work Platform (BFF Layer) - Calls Substrate API
2. **Substrate API** (`substrate-api/api/`) - Core Memory/Context Domain with MCP integration
3. **Infrastructure** (`infra/`) - Pure utilities (auth, DB clients, shared types)
4. **ChatGPT App** (`mcp-server/adapters/openai-apps/`) - OpenAI GPT integration

## Architecture Principles

### Backend-for-Frontend (BFF) Pattern
- **Platform API** is product-specific, handles work/agent orchestration
- **Substrate API** is the core service for memory/context management
- Platform calls Substrate via HTTP (Phase 3) - no direct substrate DB access
- Both services use `infra/` for shared utilities only

### Domain Separation
- **Platform Domain**: Work sessions, agent orchestration, governance
- **Substrate Domain**: Memory blocks, documents, relationships, embeddings
- **Infrastructure**: Authentication, database clients, JWT utilities

## Render Deployment (APIs)

The `render.yaml` configuration defines three services:

### Platform API (BFF Layer)
- **Service name**: `yarnnn-platform-api`
- **Root directory**: `platform/api/`
- **Build command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start command**: `uvicorn src.app.agent_server:app --host 0.0.0.0 --port 10000 --log-level debug`
- **Environment variables**:
  - OPENAI_API_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL

### Substrate API (Core Domain)
- **Service name**: `yarnnn-substrate-api`
- **Root directory**: `substrate-api/api/`
- **Build command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start command**: `uvicorn src.app.agent_server:app --host 0.0.0.0 --port 10000 --log-level debug`
- **Environment variables**:
  - OPENAI_API_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL
  - MCP_SHARED_SECRET (for ChatGPT/Claude integration)

### ChatGPT App (MCP Integration)
- **Service name**: `yarnnn-chatgpt-app`
- **Root directory**: `mcp-server/adapters/openai-apps/`
- **Runtime**: Node.js
- See render.yaml for full configuration

## Vercel Deployment (Web Frontends)

### Platform Web
- **Root directory**: `platform/web/`
- **Framework**: Next.js (auto-detected)
- **Build command**: `npm run build` (auto)
- **Output directory**: `.next` (auto)

### Substrate Web
- **Root directory**: `substrate-api/web/`
- **Framework**: Next.js (auto-detected)
- **Build command**: `npm run build` (auto)
- **Output directory**: `.next` (auto)

## Deployment Steps

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Update Render Services
Go to Render Dashboard:
- **Platform API**: Ensure Root Directory is `platform/api/`
- **Substrate API**: Update service name to `yarnnn-substrate-api`, Root Directory to `substrate-api/api/`

### 3. Update Vercel Projects
Go to Vercel Dashboard:
- **Platform Web**: Ensure Root Directory is `platform/web/`
- **Substrate Web**: Update Root Directory to `substrate-api/web/`

## Infrastructure Layer

The `infra/` directory contains **pure utilities only** (no business logic):
- `infra/utils/` - JWT, Supabase client, database utilities
- `infra/substrate/` - Shared substrate models and types

**Important**:
- Both Platform and Substrate APIs import from `infra.*`
- Platform API uses local `app.utils.*` for platform-specific code
- Substrate API uses `infra.*` for all shared utilities

## Migration History

### Phase 1: Import Fixes (Completed)
- Platform API no longer depends on `/shared` directory
- All imports use local copies: `app.utils.*`, `services.*`, `app.models.*`

### Phase 2: Architecture Refactor (Current)
- Renamed `enterprise/` → `substrate-api/` (clear domain naming)
- Renamed `shared/` → `infra/` (infrastructure-only utilities)
- Updated all substrate-api imports: `shared.*` → `infra.*`
- Updated render.yaml service names and paths

### Phase 3: BFF Implementation (Next)
- Platform calls Substrate via HTTP
- Remove direct substrate table access from Platform
- Clean up duplicate code
- Establish API contracts between layers

## Testing Deployment

### Platform API Health Check
```bash
curl https://yarnnn-platform-api.onrender.com/health
```

### Substrate API Health Check
```bash
curl https://yarnnn-substrate-api.onrender.com/health
```

### MCP Integration Test
```bash
curl https://yarnnn-substrate-api.onrender.com/api/mcp/v1/resources
```

## Troubleshooting

### Import Errors
**Platform API:**
- Should use `app.utils.*`, `services.*`, `app.models.*`
- NO imports from `infra.*` or `shared.*`

**Substrate API:**
- Should use `infra.*` for shared utilities
- NO imports from `shared.*`

### Missing Environment Variables
Check Render/Vercel dashboard to ensure all env vars are set correctly.

### Database Connection Issues
Verify `DATABASE_URL` and `SUPABASE_URL` are correct and accessible from service.

### Render Cache Issues
If deployment shows old code:
1. Go to Render Dashboard → Service Settings
2. Manual Deploy → Clear build cache & deploy
3. Or Suspend → Resume service

## Architecture Decision Records

### Why Substrate API (not "Enterprise")?
- "Enterprise" was misleading - didn't reflect actual domain
- "Substrate" clearly indicates memory/context management
- Aligns with codebase terminology (substrate blocks, relationships, etc.)

### Why `infra/` (not "shared")?
- "Shared" implies sharing business logic (anti-pattern)
- "Infrastructure" clarifies this is utilities-only
- Forces proper domain separation

### Why BFF Pattern?
- Follows industry best practices (Anthropic Claude, OpenAI ChatGPT)
- Clear separation of product logic vs core domain
- Enables independent scaling and evolution
- Platform can evolve UX without touching substrate
