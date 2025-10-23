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

Future PRs will flesh out token refresh, tool execution, tests, and deployment descriptors. This scaffold establishes the contract expected by ChatGPT while we wire the underlying behaviour.
