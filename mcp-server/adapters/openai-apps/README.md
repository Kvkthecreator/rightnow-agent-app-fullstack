# Yarnnn – Audited Briefs (ChatGPT App)

This workspace hosts the ChatGPT/Atlas application that lets users connect Yarnnn and compose audited GTM briefs directly inside ChatGPT.

## Getting Started

1. Copy `.env.template` to `.env` and fill in values:
   ```bash
   cp apps/chatgpt/.env.template apps/chatgpt/.env
   ```
2. Install dependencies:
   ```bash
   npm install --prefix apps/chatgpt
   ```
3. Run the development server:
   ```bash
   npm run dev --prefix apps/chatgpt
   ```
   The server listens on `http://localhost:4312` by default.
4. Register `manifest.json` with the ChatGPT developer console (Atlas) using the base URL from `APPS_BASE_URL`.
5. Start the OAuth flow by hitting `/oauth/start?workspace_id=<uuid>`; on success the callback will persist encrypted tokens to the Yarnnn API.

## Scripts

- `npm run dev` – Start the local development server with automatic reload.
- `npm run build` – Type-check and emit JavaScript into `dist/`.
- `npm run start` – Launch the compiled server.

## Folder Structure

- `manifest.json` – Apps SDK manifest describing OAuth, tools, and endpoints.
- `src/server.ts` – Entry point that routes health, OAuth, and tool requests.
- `src/routes/` – Health, OAuth, and tool handler modules.
- `src/lib/` – Shared utilities (API client, Zod schemas, logger).

## Current Scope & Next Steps

- ✅ Developer-mode ready: `/oauth/start` implements PKCE and persists encrypted tokens via the Yarnnn backend, and tool routes proxy to `/api/agents/p4-composition` (compose documents) and `/api/integrations/openai/tokens/me` (connection status).
- ⚠️ Pending for full launch: Dynamic Client Registration (per-install client IDs), refresh-token retry loop, and durable storage for OAuth state beyond the in-memory cache. Until these land, limit testing to ChatGPT developer mode.
- 🚦 Testing guidance: run `npm run dev` (exposed over HTTPS/Ngrok) and register `manifest.json` in ChatGPT → Settings → Apps & Connectors → Developer Mode. Verify `connect_yarnnn` and `compose_document` through the Apps SDK simulator before wider pilots.
