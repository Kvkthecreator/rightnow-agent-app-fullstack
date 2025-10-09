# YARNNN AI Integrations Workspace

This package hosts the reusable integration core and platform-specific adapters that expose YARNNN substrate memory to AI assistants.

## Directory Layout

```
mcp-server/
├── packages/
│   └── core/                 # Shared tool logic, auth helpers, backend client
├── adapters/
│   ├── anthropic/            # Claude / MCP adapter (production-ready)
│   └── openai-apps/          # ChatGPT Apps SDK adapter (scaffold)
├── tsconfig.base.json
├── package.json              # npm workspace definition
└── README.md                 # This file
```

The **core** package is protocol-agnostic: it defines tool schemas, orchestration logic, and the HTTP client used to talk to the YARNNN backend. Each adapter wires that core logic into a specific platform surface:

- `@yarnnn/anthropic-mcp` runs as a classical MCP server (stdio or HTTP+SSE) for Claude.
- `@yarnnn/openai-apps` is a scaffold that will host the OpenAI Apps SDK integration once OAuth and UI wiring are complete.

## Prerequisites

- Node.js 18+
- npm 9+ (workspaces enabled)
- Access to the YARNNN backend (`BACKEND_URL`)

## Install Dependencies

```bash
cd mcp-server
npm install
```

> npm will install root dev tooling plus each workspace package.

## Anthropic (Claude) Adapter

### Local Development (stdio)

```bash
# Run the Anthropic adapter in stdio mode
npm run dev:anthropic
```

Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "yarnnn": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/node_modules/.bin/yarnnn-mcp-anthropic"],
      "env": {
        "BACKEND_URL": "https://api.yarnnn.com",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

### Cloud Deployment (HTTP + SSE)

```bash
# Build the core and Anthropic packages
npm run build:core
npm run build:anthropic

# Start in HTTP mode
MCP_TRANSPORT=http PORT=3000 BACKEND_URL=https://api.yarnnn.com npm run start -w @yarnnn/anthropic-mcp
```

The HTTP service exposes:

- `GET /sse` for MCP SSE sessions
- `POST /message?sessionId=...` for inbound messages
- `GET /health` for uptime checks

### Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `BACKEND_URL` | ✅ | `http://localhost:10000` | YARNNN backend root |
| `MCP_TRANSPORT` | ❌ | `stdio` | `stdio` or `http` |
| `PORT` | ❌ | `3000` | Required when `MCP_TRANSPORT=http` |
| `LOG_LEVEL` | ❌ | `info` | Logging verbosity |

## OpenAI Apps Adapter (Scaffold)

The OpenAI adapter is intentionally minimal today—it exposes health/tool discovery routes but returns `501 Not Implemented` for tool execution. It exists so the OAuth + Apps SDK integration can be layered in without touching the shared core.

```bash
# Launch the scaffold
npm run dev:openai

# Verify placeholder endpoints
curl http://localhost:4000/health
curl http://localhost:4000/tools
```

Configure the following environment variables before wiring in OAuth:

| Variable | Purpose |
|----------|---------|
| `BACKEND_URL` | YARNNN backend root |
| `OPENAI_CLIENT_ID` | OAuth client id (optional until full implementation) |
| `OPENAI_CLIENT_SECRET` | OAuth secret |
| `OPENAI_REDIRECT_URI` | Callback URL registered with OpenAI |
| `PORT` | Adapter HTTP port (default `4000`) |

## Shared Tooling

Common scripts run across the workspace:

```bash
# Typecheck every package
npm run typecheck

# Build all packages (core + adapters)
npm run build
```

## Rendering Architecture

Both adapters reuse the same backend contracts:

```
AI Assistant → Adapter (Anthropic or OpenAI) → @yarnnn/integration-core → YARNNN Backend REST API
```

As additional platforms adopt MCP or other protocols, create a new adapter that consumes the core package instead of duplicating tool logic.

## Next Steps

- Implement OAuth + Apps SDK wiring inside `adapters/openai-apps`.
- Add automated smoke tests for both adapters.
- Publish `@yarnnn/integration-core` if external partners need the shared tool definitions.
