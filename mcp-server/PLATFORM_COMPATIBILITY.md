# YARNNN AI Platform Integration - Compatibility Guide

## Platform Support Matrix

| Platform | Protocol | Status | Implementation |
|----------|----------|--------|----------------|
| **Claude (Anthropic)** | MCP (Model Context Protocol) | ✅ Supported | `/mcp-server` (this repo) |
| **ChatGPT (OpenAI)** | Apps SDK | ❌ Not Supported | Requires `/openai-apps-server` (not built) |
| **Other AI Assistants** | MCP | ✅ Supported | `/mcp-server` (if MCP-compatible) |

## Protocol Differences

### MCP (Model Context Protocol) - Anthropic
**Used by:** Claude, MCP-compatible assistants

**Architecture:**
- Open standard created by Anthropic (Nov 2024)
- Transports: stdio (local), HTTP+SSE (cloud)
- Tool definition via SDK with Zod schemas
- Request/response via JSON-RPC

**What we built:** ✅ Complete (`/mcp-server`)

**Example Tool Registration:**
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const toolInput = request.params.arguments;

  const result = await executeTool(toolName, toolInput, client);

  return {
    content: [{ type: 'text', text: JSON.stringify(result) }]
  };
});
```

---

### Apps SDK - OpenAI
**Used by:** ChatGPT

**Architecture:**
- Proprietary OpenAI protocol
- Requires HTTPS endpoint (no stdio)
- Tool definition via `registerTool()` with different metadata
- OAuth 2.1 authentication required
- Returns `structuredContent` + HTML component templates

**What we need:** ❌ Not built yet

**Example Tool Registration:**
```typescript
server.registerTool(
  'create_memory_from_chat',
  {
    title: 'Create Memory from Chat',
    inputSchema: { /* Zod schema */ },
    outputSchema: { /* Zod schema */ },
    metadata: {
      outputTemplate: '...', // HTML template for UI
      invocationMessage: '...'
    }
  },
  async (input) => {
    const result = await handler(input);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result, // For ChatGPT UI
      _meta: { /* component metadata */ }
    };
  }
);
```

## Implementation Roadmap

### Phase 1: Claude Integration ✅ COMPLETE
- [x] MCP server scaffolding (`/mcp-server`)
- [x] stdio transport for Claude Desktop
- [x] HTTP+SSE transport for cloud deployment
- [x] 4 YARNNN tools (create, get, add, validate)
- [x] Auth via Supabase JWT
- [x] YARNNN Canon v3.0 compliance

**Status:** Ready for backend integration

### Phase 2: ChatGPT Integration ❌ NOT STARTED
- [ ] Create `/openai-apps-server` directory
- [ ] Implement OpenAI Apps SDK
- [ ] HTTPS endpoint with OAuth 2.1
- [ ] Component templates for ChatGPT UI
- [ ] Same 4 tools, different protocol
- [ ] Deploy to separate Render service

**Estimated effort:** ~1-2 days (similar to MCP server)

### Phase 3: Unified Backend ⏳ PENDING
Both protocols will call the same YARNNN backend endpoints:
- `/api/mcp/onboarding/create-from-chat`
- `/api/mcp/substrate`
- `/api/mcp/validate`

The backend is **protocol-agnostic** - it just receives HTTP requests.

## Architecture Comparison

### Current (Claude Only)
```
Claude Desktop
    ↓ MCP (stdio)
/mcp-server
    ↓ HTTP REST
YARNNN Backend
```

### Future (Claude + ChatGPT)
```
Claude Desktop                ChatGPT Desktop
    ↓ MCP (stdio)                 ↓ Apps SDK (HTTPS)
/mcp-server                   /openai-apps-server
    ↓ HTTP REST                   ↓ HTTP REST
           ↓                       ↓
        YARNNN Backend (Shared)
```

## When to Build ChatGPT Integration

**Build ChatGPT integration when:**
1. ✅ MCP server is tested and working with Claude
2. ✅ Backend endpoints are implemented and stable
3. ✅ User demand for ChatGPT integration exists
4. ✅ OpenAI Apps SDK has stable documentation

**Don't build yet if:**
- MCP server (Claude) isn't tested
- Backend endpoints don't exist
- No user requests for ChatGPT integration

## Quick Start Guide

### For Claude Users (Available Now)
```bash
cd mcp-server
npm install
npm run dev

# Configure Claude Desktop
# See README.md for claude_desktop_config.json
```

### For ChatGPT Users (Future)
```bash
# Not yet available
# Will require openai-apps-server implementation
# Estimated: Q2 2025 after OpenAI's MCP adoption
```

## Key Takeaways

1. **MCP ≠ Apps SDK**: They are completely different protocols
2. **Current implementation**: Only works with Claude ✅
3. **Modular design needed**: Separate servers per platform
4. **Shared backend**: Both protocols call same YARNNN API
5. **Priority**: Get Claude working first, then add ChatGPT

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
