# How to Use MCP Inspector with YARNNN

This guide teaches you how to test your YARNNN MCP server using MCP Inspector.

---

## Quick Start

### Step 1: Start the Auth Proxy (Required)

The auth proxy adds your bearer token to requests automatically:

```bash
# In a terminal, keep this running
node /Users/macbook/rightnow-agent-app-fullstack/mcp-auth-proxy.js
```

You should see:
```
🔐 MCP Auth Proxy running on http://localhost:3333
📡 Forwarding to: https://mcp.yarnnn.com
🔑 Adding auth token automatically
```

**Keep this terminal open!** The proxy must stay running while you use Inspector.

### Step 2: Launch Inspector

In another terminal:

```bash
cd /Users/macbook/rightnow-agent-app-fullstack
npx @modelcontextprotocol/inspector --config inspector-config.json
```

Inspector will open in your browser automatically, already connected to your YARNNN server!

---

## What You Can Test with Inspector

### 1. **Tools Tab** - Test MCP Tools

This is where you'll spend most time. Your YARNNN server has 6 tools:

#### **create_memory_from_chat**
Create a new basket from conversation history.

**Test Example:**
```json
{
  "conversation_history": "User: I need help with authentication\nAssistant: Let me help you design an auth system",
  "basket_name_suggestion": "Auth System Design",
  "anchor_suggestions": {
    "core_problem": "Need secure user authentication",
    "solution": "OAuth 2.0 with JWT tokens"
  },
  "session_fingerprint": {
    "embedding": [0.1, 0.2, 0.3, ...],  // Must be a real embedding vector
    "summary": "Discussing authentication design",
    "intent": "design",
    "keywords": ["auth", "security", "oauth"]
  }
}
```

**How to test:**
1. Click **"Tools"** tab
2. Find `create_memory_from_chat` in the list
3. Click it to expand
4. Fill in the parameters (Inspector shows a form)
5. Click **"Call Tool"**
6. View the result

**What to expect:** Returns the new basket ID and confirmation.

---

#### **get_substrate**
Query existing YARNNN memory.

**Test Example:**
```json
{
  "keywords": ["authentication", "oauth"],
  "format": "structured",
  "limit": 10
}
```

**How to test:**
1. Click `get_substrate` tool
2. Fill in keywords you want to search
3. Choose format: `structured` (JSON) or `prose` (narrative)
4. Click "Call Tool"

**What to expect:** Returns substrate items matching your keywords.

---

#### **add_to_substrate**
Add new content to memory.

**Test Example:**
```json
{
  "content": "We decided to use PKCE for mobile OAuth clients",
  "metadata": {
    "source": "architecture-review",
    "topic": "authentication"
  },
  "governance": {
    "confidence": 0.9,
    "require_approval": false
  },
  "session_fingerprint": {
    "embedding": [0.1, 0.2, ...],
    "summary": "Architecture decisions",
    "intent": "documentation"
  }
}
```

**What to expect:** Returns proposal ID. High confidence proposals may auto-approve.

---

#### **validate_against_substrate**
Check if new ideas conflict with existing memory.

**Test Example:**
```json
{
  "new_idea": "Let's use session cookies instead of JWT tokens",
  "focus_areas": ["authentication", "security"],
  "return_evidence": true
}
```

**What to expect:** Returns validation result showing conflicts/alignments with existing substrate.

---

#### **compose_document**
Generate documents from memory using P4 composition.

**Test Example:**
```json
{
  "basket_id": "YOUR_BASKET_ID_HERE",
  "intent": "Create a technical brief on our authentication approach for the engineering team",
  "document_type": "brief",
  "window": {
    "days_back": 30,
    "keywords": ["auth", "security"]
  },
  "citations": true
}
```

**What to expect:** Returns composed document with provenance metadata.

---

### 2. **Resources Tab** - Browse MCP Resources

Resources are read-only data your MCP server exposes.

**How to explore:**
1. Click **"Resources"** tab
2. Click **"List More Resources"** to see all available resources
3. Click any resource to view its content
4. Resources might include:
   - Documents
   - Substrate summaries
   - Basket metadata
   - Timeline events

---

### 3. **Prompts Tab** - Test MCP Prompts

Prompts are pre-configured conversation starters.

**How to use:**
1. Click **"Prompts"** tab
2. Browse available prompts
3. Select a prompt
4. Fill in any required parameters
5. View the generated prompt text

---

### 4. **Sampling Tab** - Test AI Model Calls

If your MCP server makes AI model calls, you can test them here.

**How to test:**
1. Click **"Sampling"** tab
2. Enter a test prompt
3. Configure model parameters
4. View the response

---

### 5. **History Tab** - View Request Log

See all requests you've made:

1. Click **"History"** tab at bottom
2. Click any request to see details
3. View request/response JSON
4. Replay requests by clicking them

---

## Testing Workflows

### Workflow 1: Create and Query Memory

**Goal:** Test the full memory lifecycle

1. **Create a basket** using `create_memory_from_chat`
   - Save the returned `basket_id`
2. **Query the substrate** using `get_substrate`
   - Verify your content appears
3. **Add more content** using `add_to_substrate`
4. **Query again** to see updates

---

### Workflow 2: Document Composition

**Goal:** Test P4 composition engine

1. **Get a basket_id** (from previous workflow or use existing)
2. **Compose a document** using `compose_document`
   - Try different document types: brief, report, analysis
   - Test different intents
   - Compare with/without citations
3. **Refine** by adjusting the window parameters

---

### Workflow 3: Validation Testing

**Goal:** Test substrate validation

1. **Add some substrate** with specific decisions/constraints
2. **Validate new ideas** using `validate_against_substrate`
   - Test ideas that align
   - Test ideas that conflict
3. **Review evidence** to understand why conflicts occur

---

## Tips & Tricks

### 🎯 Testing Best Practices

1. **Start simple**: Test tools with minimal required parameters first
2. **Build up**: Add optional parameters once basics work
3. **Use History**: Replay and modify previous successful requests
4. **Check logs**: Watch the auth proxy terminal for request/response activity

### 🔍 Debugging

**If a tool call fails:**
1. Check the **error message** in Inspector
2. Look at **request JSON** in History tab
3. Verify required parameters are filled
4. Check auth proxy logs for HTTP errors

**Common issues:**
- Missing `session_fingerprint.embedding`: Tools require this for basket inference
- Invalid basket_id: Make sure to use UUIDs from previous calls
- Empty results: Check your workspace actually has data

### 📝 Session Fingerprints

Many tools require `session_fingerprint` with an `embedding` vector. For testing:

```json
{
  "session_fingerprint": {
    "embedding": [0.1, 0.2, 0.3, 0.4, 0.5, ...],  // Array of numbers
    "summary": "Test session",
    "intent": "testing",
    "keywords": ["test"]
  }
}
```

In production, these embeddings come from your AI model. For testing, use dummy vectors.

---

## Stopping Inspector

1. **Stop Inspector**: Press `Ctrl+C` in the Inspector terminal
2. **Stop Auth Proxy**: Press `Ctrl+C` in the proxy terminal

Or kill all:
```bash
pkill -f "mcp-auth-proxy"
pkill -f "@modelcontextprotocol/inspector"
```

---

## What's Next?

Once you're comfortable with Inspector:

1. **Test new tools** as you develop them
2. **Validate tool schemas** ensure parameters work correctly
3. **Performance test** measure response times for complex queries
4. **Edge cases** test error handling with invalid inputs

For **OAuth flow testing**, use Claude.ai instead (Inspector can't handle browser-based login).

---

## Architecture Reminder

```
┌─────────────────────────────────┐
│  MCP Inspector (Browser)        │
│  http://localhost:6274           │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Auth Proxy (localhost:3333)    │
│  Adds: Authorization: Bearer... │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  YARNNN MCP Server              │
│  https://mcp.yarnnn.com         │
└─────────────────────────────────┘
```

The proxy is necessary because Inspector's UI doesn't properly send custom headers to StreamableHttp transports.

---

## Quick Reference

**Start Inspector:**
```bash
# Terminal 1: Auth Proxy
node mcp-auth-proxy.js

# Terminal 2: Inspector
npx @modelcontextprotocol/inspector --config inspector-config.json
```

**Your Tools:**
- `create_memory_from_chat` - Create baskets
- `get_substrate` - Query memory
- `add_to_substrate` - Add content
- `validate_against_substrate` - Check conflicts
- `compose_document` - Generate documents
- `connect_yarnnn` - Verify workspace connection

**Proxy Status:**
```bash
curl http://localhost:3333/health
```

Happy testing! 🚀
