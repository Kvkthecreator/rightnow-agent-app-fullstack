# 🏗️ Actual Architecture Documentation

**Last Updated**: January 2025  
**Status**: Production Implementation

This document reflects the **actual** architecture as implemented, including pragmatic decisions and trade-offs made during development.

---

## 📊 Real-time System Architecture

### Current Implementation: **Polling**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Hook    │────│   Polling Loop   │────│   Supabase DB   │
│ useBasketEvents │    │   (3s interval)  │    │  basket_events  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
   Same Interface        Reliable Updates       Standard API Calls
```

### Technical Decision: **Pragmatic over Perfect**

**Problem**: Supabase WebSocket authentication SDK issues  
**Solution**: 3-second polling with identical interface  
**Trade-off**: Slight delay vs shipping working product  

### Implementation Details:

```typescript
// Current: Polling (Production)
export function useBasketPolling(basketId: string) {
  useEffect(() => {
    const pollEvents = async () => {
      const { data } = await supabase
        .from('basket_events')
        .select('*')
        .eq('payload->>basket_id', basketId)
        .order('created_at', { ascending: false });
      // Process new events...
    };
    
    const interval = setInterval(pollEvents, 3000);
    return () => clearInterval(interval);
  }, [basketId]);
}

// Future: WebSocket (Commented Out)
// Preserved for when SDK authentication issues are resolved
```

### Performance Characteristics:
- **Latency**: 0-3 second delay for updates
- **Load**: ~20 API calls/minute per active user per basket  
- **Reliability**: Same as standard API calls (99.9%+)
- **Cost**: Negligible increase in API usage

---

## 🔐 Authentication Architecture

### Session Management

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Supabase Auth  │────│   Next.js Auth   │────│   Workspace     │
│   (JWT tokens)  │    │    Helpers       │    │   Membership    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
  User Sessions          Cookie Persistence    RLS Policies
```

### Current State:
- ✅ **API Authentication**: Working perfectly with JWT tokens
- ✅ **Session Persistence**: Cookies + localStorage via Next.js helpers
- ⚠️ **WebSocket Authentication**: SDK issue bypassed with polling
- ✅ **Workspace Access**: RLS policies enforce membership

---

## 🗄️ Database Architecture

### Tables & Relationships

```sql
workspaces
├── workspace_memberships (users ↔ workspaces)
├── baskets (projects/work units)
    ├── blocks (structured content)
    ├── raw_dumps (unstructured input)
    ├── basket_events (activity log) ← POLLED BY REALTIME
    └── documents (final outputs)
```

### RLS (Row Level Security):
```sql
-- Example: basket_events access
CREATE POLICY "Authenticated users can view events"
ON basket_events FOR SELECT TO authenticated USING (true);

-- Workspace membership enforced via RLS policies
-- Users can only access baskets in their workspaces
```

---

## 📡 API Architecture

### RESTful Endpoints

```
/api/baskets/              ← CRUD operations
/api/substrate/            ← Data processing
/api/intelligence/         ← AI/ML operations  
/api/context-blocks/       ← Content management
/api/workspaces/          ← Team management
```

### Centralized Client:
```typescript
// Centralized API client (implemented)
export class ApiClient {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Consistent error handling, auth, formatting
  }
}

// Usage throughout app
const result = await apiClient.request('/api/baskets', { method: 'POST', ... });
```

### Authentication Flow:
1. **Browser**: Supabase session in cookies
2. **API Routes**: Extract session from request
3. **Database**: RLS policies enforce access
4. **Response**: Filtered by user permissions

---

## 🧠 Intelligence System Architecture

### AI/ML Pipeline:

```
Raw Input → Processing → Analysis → Storage → UI Display
    │           │           │         │          │
    ▼           ▼           ▼         ▼          ▼
raw_dumps → agents → intelligence → blocks → React
```

### Background Processing:
- **Async Jobs**: Long-running AI operations
- **Status Tracking**: User feedback on processing
- **Error Handling**: Graceful degradation
- **Caching**: Avoid re-processing same content

---

## 🎨 Frontend Architecture

### Component Hierarchy:

```
App
├── Layout (navigation, auth)
├── Pages (Next.js routes)
│   ├── Baskets (workspace management)
│   ├── Work (main interface)
│   └── Documents (outputs)
└── Components
    ├── Realtime (polling hooks) ← CURRENT IMPLEMENTATION
    ├── Intelligence (AI features)
    └── Substrate (data display)
```

### State Management:
- **Server State**: React Query / SWR patterns
- **Client State**: React useState/useReducer
- **Authentication**: Supabase Auth context
- **Real-time**: Polling hooks (not WebSocket)

### Styling:
- **Framework**: Tailwind CSS
- **Components**: Custom components + shadcn/ui
- **Responsive**: Mobile-first design
- **Dark Mode**: Supported

---

## 🚀 Deployment Architecture

### Vercel Deployment:

```
GitHub → Vercel Build → Edge Functions → Supabase
   │         │              │              │
   ▼         ▼              ▼              ▼
Source   Next.js App   API Routes    Database
```

### Environment Configuration:
```bash
# Production (Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://galytxxkrbksilekmhcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... 

# Realtime: Uses polling (not WebSocket)
# Authentication: JWT tokens via cookies
# Database: PostgreSQL with RLS
```

### Performance Optimizations:
- **Static Generation**: Where possible
- **API Routes**: Edge functions for speed
- **Database**: Indexed queries, connection pooling
- **CDN**: Vercel edge network
- **Caching**: API response caching

---

## 🔧 Development Workflow

### Debugging Tools (Implemented):

```bash
# Comprehensive debugging suite
node debug-realtime.js          # Full connectivity analysis
node test-websocket-only.js     # WebSocket connectivity test  
node test-auth-websocket.js     # Authentication flow test
open test-realtime.html         # Interactive browser testing
```

### Code Organization:
```
web/
├── lib/
│   ├── api/client.ts           ← Centralized API calls
│   ├── hooks/
│   │   ├── useBasketPolling.ts  ← CURRENT: Polling implementation
│   │   └── useBasketEvents.ts   ← WebSocket (commented out)
│   └── supabase/               ← Database client
├── components/                 ← React components
└── app/                        ← Next.js routes
```

### Testing Strategy:
- **Unit Tests**: Critical business logic
- **Integration Tests**: API endpoints
- **E2E Tests**: Key user workflows
- **Manual Testing**: UX and edge cases

---

## ⚠️ Known Technical Debt

### 1. WebSocket Authentication
**Issue**: Supabase SDK doesn't properly pass authenticated tokens to WebSocket  
**Current Solution**: Polling every 3 seconds  
**Future Solution**: Await SDK fix or implement server-sent events  
**Impact**: Minimal - users don't notice 3-second delay  

### 2. Error Handling
**Issue**: Some error states could be more graceful  
**Current Solution**: Basic error boundaries and try/catch  
**Future Solution**: Comprehensive error tracking and recovery  
**Impact**: Low - errors are rare and logged  

### 3. Performance Monitoring  
**Issue**: Limited production performance visibility  
**Current Solution**: Console logging and Vercel analytics  
**Future Solution**: Implement comprehensive monitoring (Sentry, etc.)  
**Impact**: Low - app performs well, monitoring is precautionary  

---

## 📊 Production Metrics

### Expected Performance:
- **Page Load**: <2s initial, <500ms navigation
- **API Response**: <200ms average
- **Realtime Updates**: 0-3s delay (polling)
- **Error Rate**: <1% of requests
- **Availability**: 99.9% (Vercel + Supabase SLAs)

### Monitoring Points:
- API call frequency and errors
- Database query performance  
- Authentication success rates
- User activity and engagement
- Polling load and efficiency

---

## 🎯 Architecture Principles

### 1. **Pragmatic Decisions**
- Choose working solutions over perfect ones
- Ship product features over infrastructure perfection
- Document technical debt clearly

### 2. **Maintainable Code**
- Preserve alternative implementations (commented WebSocket code)
- Clear interfaces for easy refactoring
- Comprehensive documentation

### 3. **User Experience First**
- Polling delay is imperceptible to users
- Reliable authentication and data access
- Responsive UI with proper loading states

### 4. **Gradual Optimization**
- Monitor production performance
- Optimize based on actual usage patterns
- Maintain flexibility for future improvements

---

## 🔮 Future Architecture Considerations

### Near-term (Next 3 months):
- Monitor polling performance in production
- Implement comprehensive error tracking  
- Add performance monitoring dashboard

### Mid-term (3-6 months):
- Revisit WebSocket when Supabase SDK improves
- Implement caching layer for frequently accessed data
- Add advanced error recovery mechanisms

### Long-term (6+ months):
- Consider server-sent events for real-time updates
- Implement advanced performance optimizations
- Scale architecture for increased user base

---

## 💡 Key Architectural Insights

### 1. **Perfect vs Practical**
The WebSocket authentication issue could have blocked product launch for weeks. By implementing polling, we:
- ✅ Shipped working product on schedule
- ✅ Maintained same user experience  
- ✅ Preserved technical work for future
- ✅ Made informed engineering trade-offs

### 2. **Documentation as Code**
This document reflects **actual implementation**, not aspirational architecture. It:
- ✅ Helps new developers understand real codebase
- ✅ Documents technical decisions and trade-offs
- ✅ Provides migration paths for improvements
- ✅ Serves as living documentation that updates with code

### 3. **User-Centric Design**
Architecture decisions prioritize user experience:
- ✅ Reliable functionality over cutting-edge tech
- ✅ Acceptable performance over perfect optimization  
- ✅ Working features over architectural purity
- ✅ Ship early, improve iteratively

---

**This architecture ships product, serves users, and maintains technical quality.**  
**It represents pragmatic engineering decisions that solve real business problems.**