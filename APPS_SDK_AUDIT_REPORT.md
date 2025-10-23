# Apps SDK Audit – Yarnnn (2025-10-23)

## Repo Map
- `mcp-server/adapters/openai-apps/src/server.ts:1` – Express stub that stands in for the ChatGPT Apps SDK runtime; exposes `/health`, `/tools`, `/oauth/*`, and a `501` placeholder for `/tools/:name`.
- `mcp-server/adapters/openai-apps/src/config.ts:1` – Loads adapter configuration (backend URL, OAuth credentials, shared secret) from environment variables.
- `mcp-server/packages/core` – Protocol-neutral tool schemas and handlers (`create_memory_from_chat`, `get_substrate`, `add_to_substrate`, `validate_against_substrate`) that both adapters consume.
- `api/src/app/routes/openai_apps.py:14` – FastAPI router that stores or retrieves ChatGPT OAuth tokens in Supabase (`openai_app_tokens`).
- `api/src/app/routes/mcp_{auth,inference,activity}.py` – Shared MCP endpoints for session storage, basket inference, and telemetry used by Anthropic today; OpenAI Apps will need compatible surfaces.
- `supabase/migrations/20251010_openai_app_tokens.sql` & `20251011_mcp_oauth_sessions.sql` – Database structures for persisting OpenAI installs and Claude OAuth sessions.
- `docs/CHATGPT_MCP_PREVIEW.md`, `docs/MCP_OPENAI_APPS_TODO.md`, `mcp-server/RENDER_DEPLOYMENT.md` – Product and deployment notes describing intended ChatGPT support.
- `web/app/dashboard/integrations/page.tsx:70` – Frontend surface that reports ChatGPT install status (`openai_app_tokens`) alongside Claude.

### Dependency Graph (current)
```
ChatGPT Apps Adapter (mcp-server/adapters/openai-apps/src/server.ts)
        │
        │ uses @yarnnn/integration-core (packages/core)
        ▼
Yarnnn FastAPI backend (api/src/app/routes/openai_apps.py, mcp_*.py)
        │
        │ persists via Supabase tables (supabase/migrations/20251010_openai_app_tokens.sql)
        ▼
Yarnnn web dashboard reads status (web/app/dashboard/integrations/page.tsx)

Anthropic adapter shares the same @yarnnn/integration-core and backend surfaces.
```

## Required Command Outputs
### 0) Top-level context
```bash
$ git rev-parse --show-toplevel
/Users/macbook/rightnow-agent-app-fullstack

$ git status --short
(clean)

$ git branch -vv
  feature/ambient-dashboard       29281d49 [origin/feature/ambient-dashboard] Add logging for unassigned queue and refresh frontend canon
  feature/ambient-source-metadata 8b004b54 [origin/feature/ambient-source-metadata] Tighten integration prompts on dashboard and landing
* main                            0c9eb870 [origin/main] Fix composition_agent_v2: use LLMResponse.content not .text

$ node -v
v22.15.0

$ python --version
Python 3.11.9
```

### 1) Workspaces & packages
```bash
$ jq -r '.workspaces // [] | .[]' package.json
(no npm workspaces declared at repo root)

$ pnpm -v || npm -v
Volta error: Could not find executable "pnpm"
10.9.2

$ find apps adapters packages api web mcp -maxdepth 4 -type d | head
DIR: api
DIR: api/export_agent
DIR: api/migrations
DIR: api/tests
DIR: api/tests/agent_memory
DIR: api/tests/agent_memory/__pycache__
DIR: api/tests/ingestion
DIR: api/tests/ingestion/__pycache__
DIR: api/tests/util
DIR: api/tests/util/__pycache__
… (3,412 lines total – truncated)
```

### 2) Likely app/MCP locations
```bash
$ find . -maxdepth 6 -type f \( -iname '*apps-sdk*' -o -iname '*chatgpt*' -o -iname '*openai-apps*' -o -iname '*mcp*' -o -iname '*modelcontext*' -o -iname '*anthropic*' -o -iname '*atlas*' \) -not -path '*node_modules*'
./docs/MCP_INTEGRATION_ARCHITECTURE.md
./docs/MCP_OPENAI_APPS_TODO.md
./docs/mcp.md
./docs/MCP_LAUNCH_CHECKLIST.md
./docs/CHATGPT_MCP_PREVIEW.md
./api/src/app/routes/mcp_activity.py
./api/src/app/routes/mcp_inference.py
./api/src/app/routes/mcp_auth.py
./api/src/app/routes/openai_apps.py
./mcp-server/adapters/openai-apps/src/server.ts
… (additional docs and temporary inspector files)
```

### 3) Dependency scan
```bash
$ grep -R --line-number --include='package.json' --exclude-dir='node_modules' --exclude-dir='.venv' '"openai\|"apps\|"modelcontext\|"anthropic\|"mcp\|"fastapi\|"starlette\|"pydantic\|"zod\|"oauth\|"openid\|"passport\|"next-auth"' .
./web/package.json:64:    "zod": "^3.25.76",
./mcp-server/adapters/openai-apps/ui/package.json:2:  "name": "@yarnnn/openai-apps-ui",
./mcp-server/adapters/openai-apps/package.json:2:  "name": "@yarnnn/openai-apps",
./mcp-server/adapters/anthropic/package.json:2:  "name": "@yarnnn/anthropic-mcp",
./mcp-server/package.json:6:    "adapters/anthropic",
./mcp-server/packages/core/package.json:20:    "zod": "^3.22.4",
./package.json:51:    "zod": "^3.24.4",
./tmp/mcp-inspector/server/package.json:31:    "@modelcontextprotocol/sdk": "^1.18.0",
… (OpenAI/Anthropic references concentrated in `mcp-server` workspace)
```

### 4) Server boot & entry points
```bash
$ rg --files -g '*.{ts,tsx,js,py}' --glob '!node_modules/*' --glob '!.venv/*' | rg '(server|main|index|app|router|routes|handler|tool|mcp)' | head
src/app/orchestration/__init__.py
mcp-server/packages/core/src/index.ts
mcp-server/adapters/anthropic/src/server.ts
mcp-server/adapters/openai-apps/src/server.ts
api/src/app/routes/openai_apps.py
api/src/app/routes/mcp_auth.py
api/src/app/routes/mcp_inference.py
api/src/app/routes/mcp_activity.py
web/app/mcp/authorize/page.tsx
… (553 total hits – truncated)
```

### 5) OAuth flows
```bash
$ rg --line-number 'OAuth|OpenID|OIDC|passport|next-auth|auth0|jwks|authorize|PKCE|client_secret' mcp-server api web docs --glob '!node_modules/*' --glob '!.venv/*' | head
mcp-server/AUTH_ONBOARDING.md:29:- Clicking it starts the OpenAI OAuth flow (Apps SDK requirements).
mcp-server/README.md:116:| `OPENAI_CLIENT_ID` | OAuth client id (optional until full implementation) |
mcp-server/docs/OAUTH_IMPLEMENTATION_SUMMARY.md:1:# OAuth Implementation Summary
mcp-server/docs/OAUTH_SETUP.md:1:# OAuth Setup for Claude.ai Remote MCP Connector
web/app/mcp/authorize/page.tsx:4: * MCP OAuth Authorization Page
web/app/dashboard/integrations/page.tsx:62:            Connect external hosts to Yarnnn&apos;s ambient memory…
docs/MCP_TOOL_CATALOG.md:78:- ChatGPT Apps: OAuth flow (Apps SDK) stores credentials server-side.
… (326 matches – focuses on docs and Claude implementation; no PKCE code for ChatGPT stub)
```

### 6) Provenance / brief endpoints
```bash
$ rg --line-number 'briefs?\.compose|blocks\.search|policy\.inspect|provenance' api mcp-server --glob '!node_modules/*' --glob '!.venv/*' | head
api/src/services/events.py:65:            name: Event name (e.g., "brief.compose", "block.create")
api/migrations/20250903_structured_ingredients.sql:10:ADD COLUMN IF NOT EXISTS provenance_validated boolean DEFAULT false,
api/src/app/routes/p3_insights.py:742:    Build derived_from provenance array from substrate (V3.0 compliant).
… (no existing `briefs.compose` tool implementation)
```

### 7) Render service files
```bash
$ find . -type f \( -name 'render.yaml' -o -name 'Procfile' -o -name 'Dockerfile' \)
./render.yaml
./mcp-server/render.yaml
./tmp/mcp-inspector/Dockerfile

$ rg --line-number 'PORT=|HEALTH|/health|/ready|/live' --glob '!node_modules/*' --glob '!.venv/*' mcp-server api | head
mcp-server/adapters/openai-apps/src/server.ts:45:app.get('/health', …
mcp-server/adapters/anthropic/src/server.ts:784:          console.log(`[SERVER] Health check: http://0.0.0.0:${config.port}/health`);
api/src/app/routes/health.py:7:@router.get("/health/sb-admin")
… (additional health endpoints exposed by FastAPI and Anthropic adapter)
```

### 8) Env & secrets
```bash
$ find . -type f \( -name '.env*.template' -o -name '.env*.example' \)
./web/.env.local.example
./web/.env.example
./mcp-server/.env.example
./.env.template
./api/.env.example
./.env.example

$ rg --line-number 'process\.env|os\.environ|getenv' --glob '!node_modules/*' --glob '!.venv/*' mcp-server api web | head
mcp-server/adapters/openai-apps/src/config.ts:31:  backendUrl: getEnv('BACKEND_URL', 'http://localhost:10000'),
api/src/app/agent_server.py:74:    missing = [k for k in ("SUPABASE_URL","SUPABASE_JWT_SECRET","SUPABASE_SERVICE_ROLE_KEY") if not os.getenv(k)]
web/components/dev/RuntimeHUD.tsx:5:const IS_DEV = process.env.NODE_ENV !== 'production';
… (total 502 matches across backend, web, scripts)
```

### 9) Tests & CI
```bash
$ find . -type f \( -name '*test.ts' -o -name '*spec.ts' -o -name '*test.js' -o -name '*spec.js' \) | head
./web/app/api/baskets/ingest/route.test.ts
./tests/contracts/onboarding.test.ts
./tests/api-contracts/baskets.spec.ts
./tests/features/memory/add-memory-governance.spec.ts
./tests/e2e/document_substrate_composition.spec.ts
… (664 total files; none exercise the OpenAI Apps adapter)

$ find . -type f -path '*\.github/workflows/*'
./web/.github/workflows/notification-guards.yml
./.github/workflows/pipeline-guard.yml
./.github/workflows/nightly_orchestration.yml
./.github/workflows/contracts-trace.yml
./.github/workflows/test-streamlined.yml
./.github/workflows/ci.yml
… (no workflow builds or tests the ChatGPT adapter)
```

## Current Behavior
- **Service boot** – `mcp-server/adapters/openai-apps/src/server.ts:28-259` starts an Express server, logs configuration, serves a static UI shell, and exposes `/health`, `/tools`, `/tool-registry`, `/oauth/start`, `/oauth/callback`, and `/ui-shell`. Tool execution is stubbed with a `501 Not Implemented` response.
- **OAuth flow** – `server.ts:71-145` manages state, exchanges authorization codes against `https://chat.openai.com/oauth/token`, and calls `persistTokens()`; the implementation lacks PKCE, refresh rotation, and Apps SDK-specific redirect handling.
- **Token persistence** – `server.ts:207-239` posts to the FastAPI endpoint guarded by `MCP_SHARED_SECRET`; the backend handler at `api/src/app/routes/openai_apps.py:37-94` upserts into Supabase `openai_app_tokens`.
- **Shared tooling** – Tool schemas live in `mcp-server/packages/core/src/tools/index.ts:20-118`, enabling both adapters to reuse `create_memory_from_chat`, `get_substrate`, `add_to_substrate`, and `validate_against_substrate`. No brief/provenance tool exists.
- **Deployment story** – `mcp-server/RENDER_DEPLOYMENT.md:34-111` outlines two Render services (Anthropic and OpenAI). The repository-level `render.yaml` only ships the FastAPI backend; the OpenAI service is not currently represented in infrastructure-as-code.
- **Frontend visibility** – `web/app/dashboard/integrations/page.tsx:70-118` expects `openai_app_tokens.updated_at` to report install freshness, but UI copy still labels the ChatGPT integration “coming soon”.

### Key Excerpt – OpenAI Apps adapter (first 80 lines)
```ts
// mcp-server/adapters/openai-apps/src/server.ts:1-80
#!/usr/bin/env node
/**
 * YARNNN OpenAI Apps Adapter (Scaffold)
 *
 * This adapter prepares the HTTP surface required by the OpenAI Apps SDK
 * while delegating core tool logic to @yarnnn/integration-core.
 *
 * TODO: Replace the stub routes with real Apps SDK wiring once OAuth and
 * component rendering requirements are finalised.
 */

import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

import {
  getToolsList,
  selectBasket,
  type SessionFingerprint,
  type BasketCandidate,
} from '@yarnnn/integration-core';

import { config, logConfigSummary } from './config.js';

const app = express();
app.use(express.json());

logConfigSummary();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.resolve(__dirname, '..', 'static');

if (fs.existsSync(STATIC_DIR)) {
  app.use('/ui', express.static(STATIC_DIR));
}

const oauthStateStore = new Map<string, { workspaceId: string; createdAt: number }>();
```

### Backend OAuth upsert handler
```py
# api/src/app/routes/openai_apps.py:37-66
@router.post("/tokens", status_code=202)
async def upsert_token(payload: TokenUpsertRequest, request: Request):
    _verify_shared_secret(request)
    ...
    sb.table("openai_app_tokens").upsert(record, on_conflict="workspace_id").execute()
    return {"status": "accepted"}
```

## Gaps & Risks
| Area | Status | Notes |
| --- | --- | --- |
| Manifest | 🟥 Red | No `apps/chatgpt/manifest.json`; nothing describes OAuth, tools, or permissions for the ChatGPT App SDK. |
| OAuth | 🟨 Yellow | `/oauth/start` and `/oauth/callback` exist but lack PKCE, refresh/token rotation, and Atlas-specific redirect handling; relies on shared secret rather than per-install storage. |
| Tool wiring | 🟥 Red | `/tools/:name` returns 501; no OpenAI Apps SDK integration or bindings for Yarnnn-specific actions (connect, audited brief). Only substrate tools exist in `@yarnnn/integration-core`. |
| Deployability | 🟨 Yellow | Render guide documents an OpenAI service, but repo-level `render.yaml` omits it; no health checks for new routes; environment templates lack new vars. |
| Tests | 🟥 Red | No unit/integration tests cover OpenAI adapter, OAuth lifecycle, or ChatGPT tool flows; CI does not build the adapter. |

Additional risks:
- No schema or API contract for “Audited GTM Brief” – searches show provenance tooling but no `briefs.compose` API or MCP tool. Shipping the ChatGPT app will require new backend endpoints and tool definitions.
- Token refresh/rotation is missing; persisted access tokens will expire without handling.
- `mcp-server/adapters/openai-apps/src/server.ts:217-239` depends on `MCP_SHARED_SECRET`, but no config ensures that value is deployed for the OpenAI service.
- The placeholder UI served from `/ui-shell` is not the component tree the Apps SDK expects (no manifest-driven actions, no OAuth CTA).

## Decision Log
- **Scope surfaced ChatGPT actions** – Recommend building new MCP tool wrappers for “connect_yarnnn” (OAuth handshake health check) and “briefs.compose_audited” that proxy to Yarnnn APIs rather than overloading existing substrate tools. This keeps substrate memory tools intact for Anthropic while enabling Atlas-specific actions.
- **OAuth token storage** – Align with existing Supabase `openai_app_tokens` table; extend schema to capture refresh token metadata and rotation timestamps instead of introducing a second store.
- **Service topology** – Maintain the dedicated Render service inside `mcp-server` so both Anthropic and OpenAI adapters reuse `@yarnnn/integration-core`; add IaC coverage (Render blueprint) to avoid drift.
- **Atlas manifest location** – Place manifest + supporting code under `apps/chatgpt` to match future multi-app pattern and keep adapter workspace focused on bridging logic.
- **Tool schema source of truth** – Define new Zod schemas in `mcp-server/packages/core` to maintain parity across adapters; avoid duplicating request/response shapes inside the Apps service.

## Exact To-Do List
1. Add `apps/chatgpt/manifest.json` describing OAuth settings, permissions, and the two required actions; include local/Render redirect URIs and scopes (Apps SDK schema v2024-10).  
2. Scaffold `apps/chatgpt/src/server.ts` (or equivalent entry) using the official ChatGPT Apps SDK: register `connect_yarnnn` and `create_audited_gtm_brief` tools, bridge to `@yarnnn/integration-core`, and reuse shared logging.  
3. Implement OAuth handler routes (`apps/chatgpt/src/routes/oauth.ts`) with PKCE, state validation, refresh token persistence, and error responses compatible with Apps SDK expectations.  
4. Extend backend endpoints:  
   - `api/src/app/routes/openai_apps.py` – support storing PKCE verifier hashes, refresh tokens, rotation timestamps, and expose a `/status` check for the Connect Yarnnn tool.  
   - Add new FastAPI routes for `briefs.compose` and `briefs/{id}/provenance` (or surface existing ones) with provenance-focused responses.  
5. Update `@yarnnn/integration-core` (`mcp-server/packages/core`) with new tool schemas, handlers, and a Yarnnn API client method for the audited brief compose/provenance workflow.  
6. Replace the Express stub in `mcp-server/adapters/openai-apps/src/server.ts` with an Apps SDK bridge that proxies tool invocations to the new core handlers; retire the 501 placeholder.  
7. Provide environment scaffolding: `apps/chatgpt/.env.template`, `mcp-server/.env.example`, and Render blueprint entries so local + Render deployments include `OPENAI_CLIENT_ID/SECRET`, `OPENAI_APP_REDIRECT_URI`, and `MCP_SHARED_SECRET`.  
8. Author docs in `apps/chatgpt/README.md` covering local dev (`pnpm dev:apps:chatgpt`), OAuth setup, and Atlas installation steps; link from `docs/CHATGPT_MCP_PREVIEW.md`.  
9. Add automated coverage: unit tests for tool handlers, Playwright (or Apps SDK simulator) e2e script covering OAuth + brief creation, and CI jobs that build/test the new workspace.  
10. Instrument health checks (`/healthz`, `/readyz`) and activity logging so Render deployments can report status and Yarnnn dashboards can monitor ChatGPT usage alongside Claude.

