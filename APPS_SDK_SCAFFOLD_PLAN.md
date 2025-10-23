# Apps SDK Scaffold Plan – Yarnnn

## Target End State
- ChatGPT App (“Yarnnn – Audited Briefs”) installable in Atlas with two actions: **Connect Yarnnn** (OAuth handshake) and **Create Audited GTM Brief** (brief + provenance payload).
- Dedicated workspace under `apps/chatgpt` hosting manifest, Apps SDK runtime, OAuth handlers, tests, and deployment docs.
- Reusable tool logic shared through `@yarnnn/integration-core`, keeping Claude (Anthropic) parity while exposing new Yarnnn actions to Atlas.

## Proposed File Layout
```
apps/chatgpt/
  manifest.json
  README.md
  .env.template
  src/
    server.ts               # Apps SDK entry (registers tools, bootstraps OAuth-aware runtime)
    routes/
      health.ts
      oauth.ts              # /oauth/start, /oauth/callback, /oauth/token, /oauth/revoke
      actions.ts            # Tool handlers bridging to integration-core + Yarnnn API
    lib/
      auth.ts               # PKCE helpers, token storage adapter, session cache
      client.ts             # Thin wrapper over Yarnnn FastAPI endpoints
      schemas.ts            # Zod schemas shared by manifest + tool registry
      logging.ts
    tests/
      connect-yarnnn.e2e.ts # Simulated OAuth + tool invocation
      brief-compose.e2e.ts  # Create brief + provenance assertions
```

## Module Responsibilities
- `apps/chatgpt/src/server.ts` – Import the official ChatGPT Apps SDK (e.g., `@openai/chatgpt-apps`), mount tool handlers, expose `/healthz` & `/readyz`, and forward request context (install id, user id) to handlers.
- `apps/chatgpt/src/routes/oauth.ts` – Implements PKCE (generate verifier/challenge), state validation, and token exchange/refresh using `api/src/app/routes/openai_apps.py`.
- `apps/chatgpt/src/routes/actions.ts` – Wraps `connectYarnnn()` (ensures persisted token + workspace health) and `createAuditedBrief()` (invokes Yarnnn API, formats response cards for Apps SDK).
- `apps/chatgpt/src/lib/auth.ts` – Stores code verifiers, state, and refresh tokens (leverages Supabase via backend endpoint); encrypts secrets at rest using `MCP_SHARED_SECRET`.
- `apps/chatgpt/src/lib/client.ts` – Adds helper methods for `POST /api/briefs/compose`, `GET /api/briefs/{id}/provenance`, `GET /api/blocks/search`.
- `apps/chatgpt/src/lib/schemas.ts` – Houses shared Zod contracts used by manifest, tool registration, and backend validation.

## Manifest & Tool Definitions
`apps/chatgpt/manifest.json` (Apps SDK schema 2024-10) should include:
- `name`, `description`, `developer { name, url }`, `termsOfUseUrl`, `privacyPolicyUrl`.
- `oauth` block: `client_id`, `redirect_urls` (localhost + Render), `scopes` (`apps.tools.read`, `apps.tools.write`, `offline_access`), `grant_type` (`authorization_code_pkce`), `auth_url`, `token_url`, `refresh_url`.
- `capabilities.tools` array registering:
  - `connect_yarnnn` – **description**: “Verifies Yarnnn OAuth linkage and active workspace.”
  - `create_audited_gtm_brief` – Accepts basket metadata and returns structured brief with provenance list.
- `authorization` fallback: instruct ChatGPT UI to surface Connect Yarnnn CTA when tokens absent.

### Sample Zod Schemas (`apps/chatgpt/src/lib/schemas.ts`)
```ts
import { z } from 'zod';

export const ConnectYarnnnInput = z.object({
  workspaceHint: z.string().uuid().optional(),
});

export const ConnectYarnnnResult = z.object({
  linked: z.boolean(),
  installId: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const AuditedBriefInput = z.object({
  basketId: z.string().uuid(),
  topic: z.string().min(3),
  audience: z.string().min(3),
  goals: z.array(z.string().min(3)).min(1),
  enableCitations: z.boolean().default(true),
  provenanceDepth: z.enum(['summary', 'full']).default('full'),
});

export const ProvenanceSource = z.object({
  blockId: z.string().uuid(),
  sourceUrl: z.string().url(),
  title: z.string(),
  excerpt: z.string(),
});

export const AuditedBriefResult = z.object({
  briefId: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    body: z.string(),
  })),
  provenance: z.array(ProvenanceSource),
});
```

## Backend & Core Updates
- Create `api/src/app/routes/briefs.py` with:
  - `POST /api/briefs/compose` – Accepts `AuditedBriefInput`, calls existing composition pipeline, returns `AuditedBriefResult`.
  - `GET /api/briefs/{brief_id}/provenance` – Returns provenance array; optionally hydrates via existing substrate/provenance utilities (`api/src/app/routes/p3_insights.py` patterns).
- Extend `api/src/app/routes/openai_apps.py`:
  - Persist PKCE verifier hash and refresh token metadata.
  - Add `GET /integrations/openai/status` used by Connect Yarnnn action.
  - Add `POST /integrations/openai/refresh` to rotate tokens when apps runtime requests it.
- Update Supabase migration (`supabase/migrations/20251010_openai_app_tokens.sql`) or add new migration to include `pkce_verifier_hash`, `refresh_expires_at`, `rotated_at`.
- Promote new tool interfaces inside `mcp-server/packages/core`:
  - `tools/create_audited_brief.ts` and `tools/connect_yarnnn.ts` reusing Yarnnn client methods.
  - Export aggregated tool registry with naming parity to manifest so both adapters can reuse logic.

## OAuth Configuration
| Variable | Location | Notes |
| --- | --- | --- |
| `OPENAI_CLIENT_ID` | `apps/chatgpt/.env.template`, Render env | Provided by OpenAI developer dashboard. |
| `OPENAI_REDIRECT_URI` | Same | Include `http://localhost:4312/oauth/callback` (dev) & `https://chatgpt.yarnnn.com/oauth/callback` (prod). |
| `OPENAI_TOKEN_URL` | Manifest + env | `https://chat.openai.com/oauth/token`. |
| `MCP_SHARED_SECRET` | `apps/chatgpt/.env.template`, reused in `mcp-server/.env.example` | Encrypts payloads when persisting tokens to FastAPI. |
| `YARNNN_API_URL` | `.env.template` | Typically `https://api.yarnnn.com`. |
| `YARNNN_APP_HOST` | `.env.template` | Used to construct callback/manifest URLs. |

Token storage flow:
1. Apps runtime -> `apps/chatgpt/src/routes/oauth.ts` captures code & verifier.
2. Server exchanges code (PKCE) with OpenAI, receives access + refresh tokens.
3. Server posts payload to `POST /integrations/openai/tokens` (FastAPI) with shared secret; backend writes Supabase row.
4. Tool invocation fetches fresh token via `GET /integrations/openai/status`; refresh as needed through backend helper.

## Tests & CI
- Add local simulator script (`apps/chatgpt/tests/connect-yarnnn.e2e.ts`) that:
  1. Spins up Apps runtime + FastAPI backend (using Docker compose or `start-dev.sh`).
  2. Initiates OAuth with dummy OpenAI endpoints (stub via `msw` or VCR).
  3. Verifies Supabase row created and Connect Yarnnn returns `linked: true`.
- Add `apps/chatgpt/tests/brief-compose.e2e.ts` to:
  1. Seed basket + blocks (fixtures).
  2. Call `create_audited_gtm_brief` tool.
  3. Assert response structure matches `AuditedBriefResult` and provenance entries map to seeded blocks.
- Wire tests into `.github/workflows/ci.yml` by adding new job `apps-chatgpt` that runs `npm install` + `npm test --workspace apps/chatgpt`.
- Update `mcp-server` workspace tests to cover new tool handlers (unit tests using Vitest).

## Documentation & Developer Experience
- `apps/chatgpt/README.md` should document:
  - Prerequisites (Node 18+, OpenAI developer app).
  - `npm install && npm run dev --workspace apps/chatgpt` to start local server.
  - Ngrok (or Atlas tunnel) instructions for OAuth callbacks.
  - Render deployment checklist (service name, env vars, health endpoints).
- Update `docs/CHATGPT_MCP_PREVIEW.md` to reference new app, replacing “coming soon” copy with installation guide.
- Add changelog entry summarising availability.

## E2E Simulation (Developer Loop)
1. `make dev-chatgpt` – Launch Apps runtime on port `4312`.
2. `scripts/mock-openai-oauth.ts` – Node script that mimics token exchange for local development (returns deterministic access/refresh tokens).
3. Run `npm run e2e --workspace apps/chatgpt` – Executes Playwright-based flow: start OAuth, call Connect Yarnnn, call brief tool, assert card rendering (use Apps SDK CLI or Atlas sandbox).
4. Clean up Supabase records via `scripts/reset-openai-app-tokens.py`.

## Execution Plan (7–10 steps)
1. **Scaffold workspace** – Create `apps/chatgpt` tree, add manifest, README, .env template, baseline server bootstrapping (Apps SDK).  
2. **Implement OAuth module** – Build PKCE-capable handlers (`src/routes/oauth.ts`), update backend route & Supabase schema for storing refresh metadata.  
3. **Define tool schemas** – Add Zod contracts in `apps/chatgpt/src/lib/schemas.ts` and mirror them in `mcp-server/packages/core` implementations.  
4. **Expose Yarnnn APIs** – Introduce FastAPI routes (`api/src/app/routes/briefs.py`) + service functions to compose briefs and surface provenance.  
5. **Wire tool handlers** – Implement `connectYarnnn` & `createAuditedBrief` handlers in `src/routes/actions.ts`, reusing integration-core client utilities.  
6. **Integrate with Apps SDK** – Register tools in `src/server.ts`, ensure lifecycle hooks send structured cards, and add `/healthz`/`/readyz`.  
7. **Update infrastructure** – Extend `mcp-server/render.yaml` (and optionally root `render.yaml`) with new service; add env scaffolding for secrets.  
8. **Author tests** – Unit test tool handlers (Vitest), add integration tests for backend briefs routes, create Apps runtime e2e scripts.  
9. **Document & DX polishing** – Fill `README.md`, update docs, author migration notes for teams.  
10. **Prepare release** – Update CI workflow (`.github/workflows/ci.yml`), add monitoring hooks, run dry-run deployment to Render sandbox.

## Pending Questions / Assumptions
- Await confirmation of official ChatGPT Apps SDK package names and manifest schema revision (currently inferred from preview docs).
- Clarify whether audited brief creation should reuse existing P3/P4 pipelines or a new fast-path; plan assumes backend will expose dedicated endpoints.
- Confirm Atlas requires device authorization fallback; if so, extend OAuth module with device-code flow.

