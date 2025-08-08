# Context OS Monorepo Architecture

## System Architecture Overview

This is a **Context OS Monorepo** with a Python FastAPI backend and Next.js frontend implementing a full-stack knowledge processing system.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Context OS Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input ──→ Python Agents ──→ PROPOSED blocks ──→ Review    │
│      │              │                    │            │         │
│      │              │                    ▼            ▼         │
│      │              │               ACCEPTED ──→ LOCKED         │
│      │              │                    │            │         │
│      │              ▼                    ▼            ▼         │
│      │         Event Stream ────→ Document Composition          │
│      │              │                                           │
│      └──────────────┼───────────────────────────────────────────┘
│                     │                                           │
│                     ▼                                           │
│               Audit Trail                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Architecture

```
┌──────────────────┐    HTTPS     ┌─────────────────────┐    SQL     ┌──────────────┐
│   yarnnn.com     │◄─────────────►│   api.yarnnn.com    │◄──────────►│   Supabase   │
│   (Next.js)      │               │   (Python FastAPI)  │            │  Database    │
│   Vercel         │               │   Render.com        │            │              │
└──────────────────┘               └─────────────────────┘            └──────────────┘
         │                                   │                                │
         │                                   │                                │
         ▼                                   ▼                                ▼
    UI/Frontend                      22+ Agents                    Block States
    Mock Fallbacks ❌               Block Mgmt                    Events Log
    localhost:8000 ❌               Context OS Core ✅            Full Schema ✅
```

## Backend Services (api.yarnnn.com)

### Available API Endpoints

The Python backend at `api.yarnnn.com` provides these core services:

#### Agent Endpoints
- `POST /api/agent` - Direct agent execution
- `POST /api/agent/direct` - Direct agent execution
- `GET /api/agents` - List available agents (22+ implemented)

#### Block Lifecycle Management
- `POST /api/blocks` - Create blocks
- `GET /api/blocks/{block_id}` - Get block details
- `PUT /api/blocks/{block_id}/state` - Update block state (PROPOSED→ACCEPTED→LOCKED)
- `GET /api/block-lifecycle` - Block lifecycle operations

#### Context & Intelligence
- `POST /api/context-intelligence` - Context-aware intelligence generation
- `POST /api/narrative-intelligence` - Narrative intelligence processing
- `GET /api/context-items` - Context item management

#### Document Composition
- `POST /api/document-composition` - Document composition from blocks
- `GET /api/baskets/{basket_id}` - Basket operations
- `POST /api/baskets/new` - Create new baskets

#### Event Streaming
- WebSocket endpoints for real-time events
- Event log for complete audit trail

### Context OS Agents (22+ Available)

The backend implements a full agent ecosystem:
- Block Manager Agents
- Context Extraction Agents  
- Document Analysis Agents
- Pattern Recognition Agents
- Memory Management Agents
- And 17+ more specialized agents

## 🌐 Frontend Integration Points (yarnnn.com)

### ❌ CURRENT PROBLEMS (Must Fix):
1. **Environment Configuration Conflict**:
   ```bash
   # .env.local has both:
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # ❌ WRONG
   NEXT_PUBLIC_API_BASE_URL=https://api.yarnnn.com # ✅ CORRECT
   ```

2. **Hardcoded localhost in route.ts**:
   ```typescript
   // ❌ WRONG: Falls back to localhost
   const agentUrl = process.env.PYTHON_AGENT_URL || 'http://localhost:8000';
   
   // ✅ CORRECT: Use deployed backend
   const agentUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yarnnn.com';
   ```

3. **Mock Fallbacks Still Active**:
   ```typescript
   // ❌ WRONG: "mock response for now since agents may not be fully connected"
   // ✅ CORRECT: Always use real backend, fail loudly if down
   ```

### ✅ PROPER INTEGRATION PATTERNS:

#### 1. Agent Calls (Not Mocks)
```typescript
// File: lib/services/AgentService.ts
const AGENT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yarnnn.com';

export async function callAgent(agentType: string, payload: any) {
  const response = await fetch(`${AGENT_BASE_URL}/api/agents/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_type: agentType, ...payload })
  });
  
  if (!response.ok) {
    throw new Error(`Agent ${agentType} failed: ${response.status}`);
  }
  
  return response.json();
}
```

#### 2. Block State Management
```typescript
// File: components/BlockReview.tsx
export function BlockReview({ blockId, currentState }: BlockReviewProps) {
  const handleApprove = async () => {
    await fetch(`${AGENT_BASE_URL}/api/blocks/${blockId}/approve`, {
      method: 'PUT'
    });
    // Refresh block state
  };
  
  return (
    <div className={`block-${currentState.toLowerCase()}`}>
      <span className="state-badge">{currentState}</span>
      {currentState === 'PROPOSED' && (
        <>
          <button onClick={handleApprove}>Accept</button>
          <button onClick={handleReject}>Reject</button>
        </>
      )}
    </div>
  );
}
```

#### 3. WebSocket Event Consumption
```typescript
// File: hooks/useContextEvents.ts
export function useContextEvents(basketId: string) {
  useEffect(() => {
    const ws = new WebSocket(`wss://api.yarnnn.com/api/events/stream/${basketId}`);
    
    ws.onmessage = (event) => {
      const contextEvent = JSON.parse(event.data);
      
      switch (contextEvent.type) {
        case 'block_proposed':
          // Show notification for new proposed block
          break;
        case 'agent_completed':
          // Update UI with agent results
          break;
      }
    };
    
    return () => ws.close();
  }, [basketId]);
}
```

## 🔧 Development Setup

### Local Development (Both Services)
```bash
# Terminal 1: Python Backend
cd api/
pip install -r requirements.txt
uvicorn src.app.agent_server:app --host 0.0.0.0 --port 8000

# Terminal 2: Next.js Frontend  
cd web/
npm install
npm run dev

# Terminal 3: Database
supabase start
```

### Environment Variables
```bash
# web/.env.local
NEXT_PUBLIC_API_BASE_URL=https://api.yarnnn.com  # Production
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # Local development

NEXT_PUBLIC_SUPABASE_URL=https://galytxxkrbksilekmhcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Testing Full Context OS Flow
```bash
# Test script: test-context-os.sh
echo "Testing complete Context OS pipeline..."

# 1. Add raw dump
curl -X POST https://api.yarnnn.com/api/dumps/new \
  -H "Content-Type: application/json" \
  -d '{"content": "Test content", "basket_id": "test-basket"}'

# 2. Run agent analysis
curl -X POST https://api.yarnnn.com/api/agents/analyze \
  -H "Content-Type: application/json" \
  -d '{"basket_id": "test-basket"}'

# 3. Check for proposed blocks
curl https://api.yarnnn.com/api/blocks/lifecycle/test-basket

# 4. Approve blocks via UI
echo "Manual step: Use frontend to approve blocks"

# 5. Compose document
curl -X POST https://api.yarnnn.com/api/documents/compose \
  -H "Content-Type: application/json" \
  -d '{"basket_id": "test-basket", "title": "Test Document"}'
```

## 🚨 Common Mistakes to Avoid

### 1. Frontend-Only Tunnel Vision
- ❌ Making changes only in `/web`
- ❌ Thinking this is just a Next.js app
- ✅ Remember: This is a Context OS with intelligent backend

### 2. Mock Dependency
- ❌ Using mocks when real backend exists
- ❌ "localhost unavailable, using mock"  
- ✅ Always call real backend, surface errors clearly

### 3. Ignoring Block States
- ❌ Showing documents as simple text
- ❌ Hiding agent attribution
- ✅ Show block lifecycle, agent contributions

### 4. Event Blindness  
- ❌ No real-time updates
- ❌ Missing audit trails
- ✅ Consume WebSocket events, show activity streams

## 🔀 ARCHITECTURAL CONCERNS: Coupling Analysis

### ⚠️ COUPLING ISSUES IDENTIFIED:

#### 1. Environment Configuration Chaos
- **Problem**: Multiple conflicting API URLs in same file
- **Impact**: Unpredictable backend connections
- **Solution**: Single source of truth with clear dev/prod distinction

#### 2. Mock Fallback Anti-Pattern
- **Problem**: Silent degradation to mocks
- **Impact**: Backend issues go unnoticed
- **Solution**: Fail fast approach with clear error boundaries

#### 3. Missing Middleware Layer
- **Problem**: Direct API calls scattered throughout frontend
- **Impact**: No centralized error handling, auth, or retry logic
- **Solution**: Unified API client service

#### 4. Event System Disconnect
- **Problem**: Backend emits events, frontend doesn't consume
- **Impact**: Users miss real-time updates
- **Solution**: WebSocket middleware with event bus

### 📋 RECOMMENDED DECOUPLING IMPROVEMENTS:

1. **API Client Service**: Single point for all backend calls
2. **Event Middleware**: Centralized WebSocket management  
3. **State Management**: Redux/Zustand for backend state sync
4. **Error Boundaries**: Graceful degradation without silent mocks
5. **Configuration Service**: Environment-aware URL resolution

## 📈 Success Metrics

### Context OS Integration Health:
- [ ] Zero mock service usage in production
- [ ] All backend services callable from frontend
- [ ] Block states visible and manageable in UI
- [ ] Real-time events flowing to frontend
- [ ] Complete audit trail from raw_dump to document
- [ ] Agent attribution shown on all generated content

---

**Next Steps**: Execute `fix-backend-connections.md` to address immediate coupling issues and restore proper Context OS functionality.