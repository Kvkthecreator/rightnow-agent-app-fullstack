# YARNNN MCP Server

Model Context Protocol server that exposes YARNNN substrate memory to LLM hosts (ChatGPT, Claude, etc.)

## Architecture

```
LLM Host (ChatGPT/Claude)
    ↓ MCP Protocol (stdio or HTTP+SSE)
YARNNN MCP Server (THIS)
    ↓ HTTP REST API
YARNNN Backend (FastAPI)
    ↓ PostgreSQL
Supabase Database
```

## Features

### 4 MCP Tools

1. **create_memory_from_chat** - Create YARNNN basket from conversation
2. **get_substrate** - Query substrate memory (blocks, items, raw_dumps)
3. **add_to_substrate** - Add new content with governance
4. **validate_against_substrate** - Check alignment with existing substrate

### Two Transport Modes

- **stdio** (default): For local Claude Desktop integration
- **http**: For cloud deployment via Server-Sent Events

### YARNNN Canon v3.0 Compliant

- Respects P0-P4 pipeline flow
- Honors governance settings (auto/manual/confidence)
- Substrate-first architecture
- Workspace-scoped security

## Quick Start

### Local Development (stdio mode)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env:
# BACKEND_URL=http://localhost:10000
# MCP_TRANSPORT=stdio

# 3. Run server
npm run dev
```

### Claude Desktop Integration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yarnnn": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/server.js"],
      "env": {
        "BACKEND_URL": "https://rightnow-api.onrender.com",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

### Cloud Deployment (HTTP mode)

```bash
# Deploy to Render
render deploy

# Or manually:
npm run build
MCP_TRANSPORT=http PORT=3000 npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | Yes | `http://localhost:10000` | YARNNN backend API URL |
| `NODE_ENV` | No | `development` | Node environment |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode (`stdio` or `http`) |
| `PORT` | No | `3000` | HTTP server port (http mode only) |
| `LOG_LEVEL` | No | `info` | Log level |

## Authentication

MCP requests must include `user_token` in request metadata:

```typescript
{
  "_meta": {
    "user_token": "eyJhbGc..."  // Supabase JWT token
  }
}
```

The server validates tokens against YARNNN backend (`/api/auth/validate`) and extracts:
- `user_id`
- `workspace_id`
- `basket_id` (optional)

## Tool Usage

### create_memory_from_chat

Create a new basket from conversation history.

**Input:**
```json
{
  "conversation_history": "User: I want to build...\nAssistant: Great idea!...",
  "basket_name_suggestion": "Product Vision Q4 2024",
  "anchor_suggestions": {
    "core_problem": "Users struggle with context management",
    "product_vision": "Build a context OS"
  }
}
```

**Output:**
```json
{
  "status": "success",
  "basket_id": "uuid",
  "basket_name": "Product Vision Q4 2024",
  "blocks_created": 12,
  "visualization": "# Substrate Overview\n...",
  "actions": ["Review 12 substrate proposals in governance"]
}
```

### get_substrate

Query substrate memory.

**Input:**
```json
{
  "basket_id": "uuid (optional)",
  "keywords": ["authentication", "user flow"],
  "anchors": ["core_problem", "product_vision"],
  "format": "structured",
  "limit": 50
}
```

**Output:**
```json
{
  "substrate": [
    {
      "type": "block",
      "id": "uuid",
      "content": "Users need seamless authentication",
      "semantic_type": "goal",
      "confidence": 0.95
    }
  ],
  "total_count": 42,
  "substrate_snapshot_id": "uuid"
}
```

### add_to_substrate

Add new content with governance.

**Input:**
```json
{
  "basket_id": "uuid (optional)",
  "content": "New feature: Social login with OAuth",
  "metadata": {
    "source": "chat",
    "topic": "authentication"
  },
  "governance": {
    "confidence": 0.9,
    "require_approval": false
  }
}
```

**Output:**
```json
{
  "status": "success",
  "raw_dump_id": "uuid",
  "proposed_blocks": 3,
  "governance_mode": "auto"
}
```

### validate_against_substrate

Check alignment with existing substrate.

**Input:**
```json
{
  "basket_id": "uuid (optional)",
  "new_idea": "Add email/password authentication",
  "focus_areas": ["core_problem", "technical_constraints"],
  "return_evidence": true
}
```

**Output:**
```json
{
  "alignment_score": 0.85,
  "conflicts": [
    {
      "existing_substrate_id": "uuid",
      "conflict_type": "overlap",
      "description": "Similar auth method already proposed",
      "severity": "medium"
    }
  ],
  "recommendation": "Consider merging with existing auth proposal",
  "analysis": "High alignment overall, one overlap detected"
}
```

## Development

```bash
# Run in dev mode with auto-reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Run production build
npm start
```

## Backend Integration

### Required Backend Endpoints

The MCP server expects these endpoints on YARNNN backend:

1. `GET /api/auth/validate` - Validate JWT token
2. `POST /api/mcp/onboarding/create-from-chat` - Create basket from chat
3. `GET /api/mcp/substrate` - Query substrate
4. `POST /api/mcp/substrate` - Add to substrate
5. `POST /api/mcp/validate` - Validate against substrate

See [Backend Implementation Guide](./docs/BACKEND_INTEGRATION.md) for details.

## Deployment

### Render (Recommended)

```bash
# 1. Create Render service
render services create

# 2. Deploy
git push origin main  # Auto-deploy via render.yaml
```

### Manual Deployment

```bash
# Build
npm run build

# Set environment
export BACKEND_URL=https://rightnow-api.onrender.com
export MCP_TRANSPORT=http
export PORT=3000

# Start
npm start
```

## Troubleshooting

### "Missing user_token in request context"

Ensure MCP host is passing authentication token in request metadata.

### "Authentication failed"

- Check `BACKEND_URL` is correct
- Verify backend `/api/auth/validate` endpoint exists
- Ensure token is valid Supabase JWT

### "Tool execution failed"

- Check backend endpoint exists and returns expected format
- Review server logs for detailed error messages
- Verify network connectivity to backend

## YARNNN Canon Compliance

This MCP server follows YARNNN Canon v3.0:

✅ **Sacred Capture (P0)** - All content creates immutable raw_dumps
✅ **Governed Evolution (P1)** - Substrate mutations via proposals
✅ **Substrate Peers** - No hierarchy between substrate types
✅ **Workspace Security** - All requests workspace-scoped
✅ **Event-Driven** - Timeline events for all mutations

## License

MIT
