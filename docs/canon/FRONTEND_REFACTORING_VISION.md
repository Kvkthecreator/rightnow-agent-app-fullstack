# Frontend Refactoring Vision - Thinking Partner Gateway Architecture

**Date**: 2025-11-20
**Context**: Post-Thinking Partner MVP, aligning frontend with gateway/mirror/meta pattern
**Goal**: Transform frontend from direct agent calls to unified TP gateway orchestration

---

## Executive Summary

### The Fundamental Shift

**Before TP** (Current Implementation):
```
User → CreateWorkRequestModal → Direct Agent API Calls → Backend
         ├─ ResearchConfigForm
         ├─ ContentConfigForm
         └─ ReportingConfigForm
```

**After TP** (Gateway Pattern):
```
User → TPChat Interface → Thinking Partner Gateway → [Orchestrates] → Specialized Agents
                                                    ├─ Research
                                                    ├─ Content
                                                    └─ Reporting
```

**Key Insight**: **80% of interactions should flow through TP chat**, with specialized views for deep review (20%).

---

## Current State Assessment

### What We Have (Frontend)

**Strong Foundation** ✅:
1. **API Architecture**: Clean BFF proxy, centralized ApiClient, consistent auth
2. **Thinking Partner Foundation**: `YarnnnThinkingPartner.tsx` already exists with:
   - Context awareness (`usePageContext()`)
   - Universal changes integration
   - Intelligence generation endpoint
   - Substrate integration
3. **Component Structure**: Good server/client separation, reusable UI components
4. **Authentication**: Solid Supabase integration with RLS
5. **State Management**: Zustand for notifications, hooks for data

**Current Gaps** ❌:
1. **Direct Agent Invocation**: Each agent has its own config form and route
2. **No Unified Gateway**: No single orchestration point for agent calls
3. **Modal-Heavy UI**: `CreateWorkRequestModal.tsx` (300+ lines) with multiple agent forms
4. **Polling-Based Updates**: 2s interval polling instead of subscriptions
5. **Isolated TP Component**: Thinking Partner exists but not integrated with work system

### Backend TP Implementation (Complete)

**API Endpoints Available**:
- ✅ `POST /api/tp/chat` - Main chat interface
- ✅ `GET /api/tp/capabilities` - Tools and agent info
- ✅ `GET /api/tp/session/{id}` - Session management

**TP Tools**:
- ✅ `agent_orchestration` - Delegate to specialized agents
- ✅ `infra_reader` - Query work state
- ✅ `steps_planner` - Multi-step workflow planning
- ✅ `emit_work_output` - TP meta-intelligence

**Database Schema** (Phase 2e):
- ✅ `agent_sessions` - Persistent TP conversations (claude_session_id)
- ✅ `work_requests` - User asks
- ✅ `work_tickets` - Execution tracking
- ✅ `work_outputs` - Deliverables

---

## Refactoring Vision

### Three-Tier UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: CHAT INTERFACE (80% of interactions)                    │
│ Component: TPChatInterface.tsx                                   │
│                                                                   │
│ Features:                                                         │
│ - Natural language requests                                       │
│ - Inline work output cards                                        │
│ - Progressive disclosure                                          │
│ - Session continuity                                              │
│ - Agent delegation visibility                                     │
│ - Quick actions (approve, reject, refine)                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ TIER 2: SPECIALIZED VIEWS (20% - deep review/configuration)     │
│ Pages: /projects/[id]/agents/[agentType]/                       │
│                                                                   │
│ Features:                                                         │
│ - Deep dive into work outputs                                     │
│ - Advanced agent configuration                                    │
│ - Batch operations                                                │
│ - Analytics and metrics                                           │
│ - Work history timeline                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ TIER 3: GATEWAY ORCHESTRATION (Infrastructure)                  │
│ Library: /lib/gateway/ThinkingPartnerGateway.ts                 │
│                                                                   │
│ Responsibilities:                                                 │
│ - Route all agent requests through TP                             │
│ - Session management (claude_session_id)                          │
│ - Work state tracking                                             │
│ - Real-time subscriptions                                         │
│ - Response normalization                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Refactoring Strategy

### Phase 1: Gateway Infrastructure (Week 1)

**NEW: `/lib/gateway/` - Gateway Orchestration Library**

```typescript
// /lib/gateway/ThinkingPartnerGateway.ts
export class ThinkingPartnerGateway {
  private basketId: string;
  private sessionId: string | null;
  private subscription: RealtimeChannel | null;

  constructor(basketId: string) {
    this.basketId = basketId;
    this.sessionId = null;
  }

  // Main chat interface
  async chat(message: string): Promise<TPChatResponse> {
    const response = await fetchWithToken('/api/tp/chat', {
      method: 'POST',
      body: JSON.stringify({
        basket_id: this.basketId,
        message: message,
        claude_session_id: this.sessionId,
      }),
    });

    const data = await response.json();
    this.sessionId = data.claude_session_id; // Preserve session
    return data;
  }

  // Subscribe to work ticket updates
  subscribeToWorkUpdates(callback: (update: WorkTicketUpdate) => void) {
    const supabase = createClientComponentClient();

    this.subscription = supabase
      .channel(`work_tickets:basket_${this.basketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_tickets',
          filter: `basket_id=eq.${this.basketId}`,
        },
        (payload) => callback(payload as WorkTicketUpdate)
      )
      .subscribe();
  }

  // Get capabilities (for UI hints)
  async getCapabilities(): Promise<TPCapabilities> {
    const response = await fetch('/api/tp/capabilities');
    return response.json();
  }

  // Cleanup
  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

// Singleton hook
export function useThinkingPartnerGateway(basketId: string) {
  const gatewayRef = useRef<ThinkingPartnerGateway | null>(null);

  useEffect(() => {
    gatewayRef.current = new ThinkingPartnerGateway(basketId);
    return () => gatewayRef.current?.cleanup();
  }, [basketId]);

  return gatewayRef.current;
}
```

**UPDATED: `/lib/api/client.ts` - Deprecate Direct Agent Calls**

```typescript
// Mark as deprecated, route through TP
/** @deprecated Use ThinkingPartnerGateway.chat() instead */
export async function runAgent(
  agentType: 'research' | 'content' | 'reporting',
  task: string,
  config: AgentConfig
): Promise<WorkSession> {
  console.warn('Direct agent calls deprecated. Use TP gateway.');
  // Fallback for legacy code
  return fetchWithToken('/api/agent-run', {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType, task, config }),
  }).then(r => r.json());
}
```

---

### Phase 2: Chat Interface (Week 2-3)

**NEW: `/components/thinking/TPChatInterface.tsx` - Main Chat UI**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useThinkingPartnerGateway } from '@/lib/gateway/ThinkingPartnerGateway';
import { TPMessageList } from './TPMessageList';
import { TPInputBar } from './TPInputBar';
import { WorkOutputCard } from './WorkOutputCard';

interface TPChatInterfaceProps {
  basketId: string;
  workspaceId: string;
  className?: string;
}

export function TPChatInterface({ basketId, workspaceId, className }: TPChatInterfaceProps) {
  const gateway = useThinkingPartnerGateway(basketId);
  const [messages, setMessages] = useState<TPMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workUpdates, setWorkUpdates] = useState<WorkTicket[]>([]);

  // Subscribe to work updates
  useEffect(() => {
    if (!gateway) return;

    gateway.subscribeToWorkUpdates((update) => {
      setWorkUpdates(prev => {
        const existing = prev.findIndex(w => w.id === update.new.id);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = update.new;
          return next;
        }
        return [...prev, update.new];
      });
    });
  }, [gateway]);

  const handleSendMessage = async (content: string) => {
    if (!gateway) return;

    // Add user message immediately
    const userMessage: TPMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);
    try {
      // Send to TP
      const response = await gateway.chat(content);

      // Add TP response
      const tpMessage: TPMessage = {
        id: `tp_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        workOutputs: response.work_outputs,
        actionsTaken: response.actions_taken,
      };
      setMessages(prev => [...prev, tpMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <TPMessageList messages={messages} workUpdates={workUpdates} />

      {/* Input */}
      <TPInputBar
        onSend={handleSendMessage}
        isLoading={isLoading}
        placeholder="Ask me to research, create content, or generate reports..."
      />
    </div>
  );
}
```

**NEW: `/components/thinking/TPMessageList.tsx` - Message Display**

```typescript
'use client';

import { TPMessage } from '@/types/thinking-partner';
import { WorkOutputCard } from './WorkOutputCard';
import { AgentDelegationCard } from './AgentDelegationCard';
import { Markdown } from '@/components/ui/Markdown';

interface TPMessageListProps {
  messages: TPMessage[];
  workUpdates: WorkTicket[];
}

export function TPMessageList({ messages, workUpdates }: TPMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'flex gap-3',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <Avatar className="h-8 w-8">
              <AvatarFallback>TP</AvatarFallback>
            </Avatar>
          )}

          <div
            className={cn(
              'rounded-lg px-4 py-3 max-w-2xl',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {/* Message content */}
            <Markdown content={message.content} />

            {/* Work outputs (inline cards) */}
            {message.workOutputs && message.workOutputs.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.workOutputs.map((output) => (
                  <WorkOutputCard
                    key={output.id}
                    output={output}
                    compact
                  />
                ))}
              </div>
            )}

            {/* Actions taken (subtle footer) */}
            {message.actionsTaken && message.actionsTaken.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {message.actionsTaken.join(' • ')}
              </div>
            )}
          </div>

          {message.role === 'user' && (
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}

      {/* Real-time work updates */}
      {workUpdates
        .filter(ticket => ticket.status === 'running')
        .map(ticket => (
          <AgentDelegationCard
            key={ticket.id}
            ticket={ticket}
            status="running"
          />
        ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
```

**NEW: `/components/thinking/WorkOutputCard.tsx` - Inline Work Output Display**

```typescript
'use client';

import { WorkOutput } from '@/types/work';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';

interface WorkOutputCardProps {
  output: WorkOutput;
  compact?: boolean;
  onApprove?: (outputId: string) => void;
  onReject?: (outputId: string) => void;
  onRefine?: (outputId: string) => void;
}

export function WorkOutputCard({
  output,
  compact = false,
  onApprove,
  onReject,
  onRefine,
}: WorkOutputCardProps) {
  if (compact) {
    return (
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{output.title}</span>
            <div className="flex gap-1">
              {onApprove && (
                <Button size="sm" variant="ghost" onClick={() => onApprove(output.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {onReject && (
                <Button size="sm" variant="ghost" onClick={() => onReject(output.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {output.body}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Full view (for specialized pages)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{output.title}</CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>Type: {output.output_type}</span>
          <span>•</span>
          <span>Confidence: {Math.round(output.confidence * 100)}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <Markdown content={output.body} />

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onApprove && (
            <Button onClick={() => onApprove(output.id)}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {onRefine && (
            <Button variant="outline" onClick={() => onRefine(output.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Refine
            </Button>
          )}
          {onReject && (
            <Button variant="destructive" onClick={() => onReject(output.id)}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Phase 3: Page Refactoring (Week 3-4)

#### DELETE or DEPRECATE (Legacy Direct Agent Access)

**Files to DELETE**:
```
❌ /components/CreateWorkRequestModal.tsx (300+ lines)
❌ /components/work/ResearchConfigForm.tsx
❌ /components/work/ContentConfigForm.tsx
❌ /components/work/ReportingConfigForm.tsx
```

**Rationale**: These are replaced by natural language chat interface. Users describe what they want, TP handles agent selection and configuration.

**Migration Path**: Keep as fallback for 1-2 sprints, add deprecation warnings.

#### UPDATE (Projects Pages - Chat-First)

**`/app/projects/[id]/page.tsx` - Project Overview (Refactored)**

```typescript
// BEFORE: Multiple tabs for different features
export default async function ProjectPage({ params }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="agents">Agents</TabsTrigger>
        <TabsTrigger value="work">Work</TabsTrigger>
      </TabsList>
      {/* ... */}
    </Tabs>
  );
}

// AFTER: Chat-first with sidebar context
export default async function ProjectPage({ params }: Props) {
  const project = await getProject(params.id);

  return (
    <div className="flex h-screen">
      {/* Left: Context Panel (20%) */}
      <ProjectContextPanel
        project={project}
        className="w-80 border-r"
      />

      {/* Right: Chat Interface (80%) */}
      <TPChatInterface
        basketId={project.basket_id}
        workspaceId={project.workspace_id}
        className="flex-1"
      />
    </div>
  );
}
```

**NEW: `/components/projects/ProjectContextPanel.tsx` - Context Sidebar**

```typescript
'use client';

export function ProjectContextPanel({ project, className }: Props) {
  return (
    <aside className={cn('flex flex-col', className)}>
      {/* Project info */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">{project.name}</h2>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </div>

      {/* Quick stats */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium mb-2">Active Work</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Running</span>
            <Badge>{project.stats.running}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Pending Review</span>
            <Badge variant="outline">{project.stats.pending_review}</Badge>
          </div>
        </div>
      </div>

      {/* Recent outputs */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium mb-2">Recent Outputs</h3>
        <div className="space-y-2">
          {project.recentOutputs.map(output => (
            <WorkOutputCard
              key={output.id}
              output={output}
              compact
            />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 border-t">
        <Button variant="outline" size="sm" className="w-full">
          View All Work →
        </Button>
      </div>
    </aside>
  );
}
```

#### KEEP (Specialized Agent Pages - Deep Review)

**`/app/projects/[id]/agents/[agentType]/page.tsx` - Keep for Deep Dive**

These pages stay for the 20% use case (deep review, batch operations, analytics):

```typescript
// KEEP: Specialized views for deep work
export default async function AgentDashboardPage({ params }: Props) {
  const { id: projectId, agentType } = params;

  return (
    <div className="space-y-6">
      {/* Agent-specific metrics */}
      <AgentMetricsCards agentType={agentType} projectId={projectId} />

      {/* Work outputs table (batch operations) */}
      <WorkOutputsDataTable
        agentType={agentType}
        projectId={projectId}
        features={{
          batchApprove: true,
          batchReject: true,
          export: true,
          filtering: true,
        }}
      />

      {/* Configuration (advanced) */}
      <AgentConfigurationPanel agentType={agentType} projectId={projectId} />
    </div>
  );
}
```

**Rationale**: Chat is for quick tasks and iterative work. Specialized pages are for:
- Reviewing 50+ work outputs at once
- Advanced agent configuration
- Performance analytics
- Batch approvals/rejections
- Export and reporting

---

### Phase 4: Real-Time Updates (Week 4)

**REPLACE: Polling → Subscriptions**

**Current Pattern** (Polling):
```typescript
// /hooks/useWorkStatus.ts - CURRENT
export function useWorkStatus(workTicketId: string) {
  const [status, setStatus] = useState<WorkTicketStatus>('pending');

  useEffect(() => {
    const interval = setInterval(async () => {
      const ticket = await fetch(`/api/work-tickets/${workTicketId}`).then(r => r.json());
      setStatus(ticket.status);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [workTicketId]);

  return { status };
}
```

**New Pattern** (Supabase Realtime):
```typescript
// /hooks/useWorkStatus.ts - NEW
export function useWorkStatus(workTicketId: string) {
  const [status, setStatus] = useState<WorkTicketStatus>('pending');
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Subscribe to work_tickets changes
    const channel = supabase
      .channel(`work_ticket:${workTicketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_tickets',
          filter: `id=eq.${workTicketId}`,
        },
        (payload) => {
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workTicketId, supabase]);

  return { status };
}
```

**Benefits**:
- ✅ No polling overhead
- ✅ Instant updates (< 100ms latency)
- ✅ Lower server load
- ✅ Better battery life on mobile

---

## Migration Strategy

### Option A: Incremental Migration (RECOMMENDED)

**Timeline**: 4-6 weeks
**Risk**: Low
**Effort**: Medium

**Approach**:
1. **Week 1**: Build gateway infrastructure, keep old UI
2. **Week 2**: Add chat interface to projects page (side-by-side with old UI)
3. **Week 3**: Deprecate old modals, add migration banners
4. **Week 4**: Remove old code, polish new UI
5. **Week 5-6**: Specialized page updates, real-time subscriptions

**User Experience**:
- Users see chat interface prominently
- Old "Create Work Request" button still available but marked deprecated
- Progressive migration, users adapt gradually

### Option B: Hard Cutover (AGGRESSIVE)

**Timeline**: 2-3 weeks
**Risk**: Medium-High
**Effort**: High (long hours)

**Approach**:
1. **Week 1**: Build entire new UI in feature branch
2. **Week 2**: Test, fix bugs, polish
3. **Week 3**: Deploy new UI, DELETE old components immediately

**User Experience**:
- Sudden change (can be jarring)
- Clean break from legacy patterns
- Requires comprehensive user docs

### Option C: Parallel UIs (SAFE but COSTLY)

**Timeline**: 6-8 weeks
**Risk**: Very Low
**Effort**: Very High

**Approach**:
- Build entirely new UI alongside old
- Feature flag to toggle between UIs
- Run both for 1-2 months
- Deprecate old UI after usage drops

**Not Recommended**: Doubles maintenance burden.

---

## Start-From-Scratch Candidates

### Files to DELETE Entirely

**Rationale**: These are so tightly coupled to the old direct-agent pattern that refactoring would cost more than rebuilding.

#### 1. `/components/CreateWorkRequestModal.tsx`
**Current Size**: 300+ lines
**Complexity**: High (3 agent forms, validation, state management)
**Replacement**: Natural language chat (user types request, TP handles it)

**Why Delete**:
- Assumes user knows which agent to use
- Forces user to fill config forms
- Modal pattern interrupts flow
- TP chat is superior UX

#### 2. `/components/work/ResearchConfigForm.tsx`
**Current**: Form with depth, domains, format, etc.
**Replacement**: User says "Deep research on AI agents" → TP infers config

**Why Delete**:
- TP is smart enough to set reasonable defaults
- User can refine via chat: "Make it deeper" → TP adjusts depth
- Form is cognitive load

#### 3. `/components/work/ContentConfigForm.tsx`
**Current**: Platform selection, content type, brand voice dropdown
**Replacement**: "Create a LinkedIn post about X" → TP knows platform

**Why Delete**:
- Platform is obvious from user request
- Content type can be inferred
- Brand voice should be learned, not selected

#### 4. `/components/work/ReportingConfigForm.tsx`
**Current**: Report type, format (PDF, XLSX), requirements
**Replacement**: "Generate Q4 metrics report as Excel" → TP extracts format

**Why Delete**:
- Natural language is clearer than forms
- Format is in the ask ("as Excel")
- TP can ask clarifying questions if needed

### Files to KEEP and Refactor

#### 1. `/components/thinking/YarnnnThinkingPartner.tsx`
**Why Keep**: Already implements TP foundation
**Refactor**: Extract into smaller components (TPMessageList, TPInputBar, etc.)

#### 2. `/lib/api/client.ts`
**Why Keep**: Solid API client foundation
**Refactor**: Add gateway methods, deprecate direct agent calls

#### 3. `/lib/work/enqueueWork.ts`
**Why Keep**: Good work queueing pattern
**Refactor**: Integrate with real-time subscriptions

#### 4. Agent dashboard pages (`/app/projects/[id]/agents/[agentType]/page.tsx`)
**Why Keep**: Needed for deep review (20% use case)
**Refactor**: Simplify, focus on batch operations and analytics

---

## Technical Decisions

### 1. Chat UI Framework

**Options**:
- **Vercel AI SDK** (ui/react) - Pre-built chat components
- **Custom with Radix** - Full control, consistent with existing UI
- **Shadcn Chat** - Community component

**Recommendation**: **Custom with Radix**
- Matches existing design system
- Full control over work output cards
- No extra dependency
- Easy to customize

### 2. Real-Time Strategy

**Options**:
- **Supabase Realtime** (PostgreSQL CDC)
- **WebSockets** (custom server)
- **Server-Sent Events** (SSE)

**Recommendation**: **Supabase Realtime**
- Already using Supabase
- No additional infrastructure
- Automatic reconnection
- Filtered subscriptions (RLS aware)

### 3. Session Management

**Options**:
- **LocalStorage** (persist claude_session_id)
- **Database** (store in agent_sessions table)
- **Hybrid** (LocalStorage + DB sync)

**Recommendation**: **Hybrid**
- LocalStorage for quick resume
- DB for cross-device consistency
- Fallback if LocalStorage cleared

### 4. Message Storage

**Options**:
- **In-Memory** (React state only)
- **Database** (new chat_messages table)
- **Hybrid** (state + lazy load from DB)

**Recommendation**: **Hybrid**
- Keep recent messages in state (fast)
- Persist to DB for history (new table: `tp_chat_messages`)
- Lazy load older messages on scroll

**New Table Schema**:
```sql
CREATE TABLE tp_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  work_output_ids UUID[] DEFAULT '{}',
  actions_taken TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tp_chat_messages_session ON tp_chat_messages(agent_session_id, created_at DESC);
```

---

## Implementation Checklist

### Week 1: Gateway Foundation
- [ ] Create `/lib/gateway/ThinkingPartnerGateway.ts`
- [ ] Create `useThinkingPartnerGateway` hook
- [ ] Add deprecation warnings to direct agent calls
- [ ] Create `tp_chat_messages` table migration
- [ ] Test gateway with existing `/api/tp/chat` endpoint

### Week 2: Chat Interface Components
- [ ] Build `TPChatInterface.tsx` (main container)
- [ ] Build `TPMessageList.tsx` (message display)
- [ ] Build `TPInputBar.tsx` (input + send)
- [ ] Build `WorkOutputCard.tsx` (inline + full views)
- [ ] Build `AgentDelegationCard.tsx` (running work indicator)
- [ ] Add Markdown rendering component

### Week 3: Page Integration
- [ ] Refactor `/app/projects/[id]/page.tsx` (chat-first layout)
- [ ] Create `ProjectContextPanel.tsx` (sidebar)
- [ ] Add deprecation banners to old UI
- [ ] Update navigation to emphasize chat
- [ ] Test chat interface with real TP backend

### Week 4: Real-Time Updates
- [ ] Replace polling with Supabase Realtime subscriptions
- [ ] Update `useWorkStatus` hook
- [ ] Add real-time work ticket updates to chat
- [ ] Add presence indicators (who's online)
- [ ] Test subscription performance

### Week 5: Legacy Cleanup
- [ ] Delete `CreateWorkRequestModal.tsx`
- [ ] Delete agent config forms (Research, Content, Reporting)
- [ ] Remove deprecated routes
- [ ] Update documentation
- [ ] Migration guide for users

### Week 6: Polish & Testing
- [ ] Loading states and skeletons
- [ ] Error handling and retry logic
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Mobile responsive design
- [ ] E2E tests for chat flow
- [ ] Performance testing (message list virtualization)

---

## Success Metrics

### User Experience Metrics
- **Chat Adoption**: 80%+ of work requests via chat (vs old modal)
- **Session Length**: Average 5+ messages per session (conversation depth)
- **Task Completion**: 90%+ of requests successfully handled by TP
- **User Satisfaction**: NPS score for chat interface

### Technical Metrics
- **Response Time**: < 2s for TP chat responses
- **Real-Time Latency**: < 200ms for work ticket updates
- **Error Rate**: < 1% for chat requests
- **Subscription Stability**: > 99% uptime for Realtime channels

### Business Metrics
- **Time to Task**: 50% reduction (chat vs multi-step modal)
- **Support Tickets**: Reduce "how do I..." tickets (TP guides users)
- **Feature Discovery**: Track which TP tools users discover organically

---

## Risk Mitigation

### Risk 1: TP Backend Instability
**Impact**: High
**Probability**: Low (backend MVP tested)
**Mitigation**:
- Keep old UI available via feature flag for 1 month
- Monitoring and alerting on `/api/tp/chat` endpoint
- Fallback UI: "TP temporarily unavailable, use manual agent selection"

### Risk 2: Chat UX Doesn't Resonate
**Impact**: High
**Probability**: Medium
**Mitigation**:
- User testing before full rollout
- A/B test chat vs modal for 2 weeks
- Collect feedback via in-app surveys
- Quick iteration based on user feedback

### Risk 3: Real-Time Subscriptions Scale Issues
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Supabase Realtime is production-grade
- Filter subscriptions (per-basket, not global)
- Monitor connection count
- Fallback to polling if subscription fails

### Risk 4: Session Management Complexity
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Simple session resume logic (claude_session_id)
- Clear session timeout (24 hours)
- User can always start fresh session
- Store session metadata in DB for debugging

---

## Open Questions

1. **Message History Pagination**: How many messages to show initially? (Rec: Last 50)
2. **Work Output Approval Flow**: Inline in chat or redirect to specialized page? (Rec: Inline for simple, redirect for complex)
3. **Multi-User Collaboration**: Can multiple users chat with same TP session? (Rec: Future phase)
4. **Agent Delegation Transparency**: Show when TP delegates to agent? (Rec: Yes, with "Running research..." indicator)
5. **Error Recovery**: If agent fails, does TP auto-retry? (Rec: TP asks user if they want to retry)

---

## Related Documentation

- **Thinking Partner Backend**: [THINKING_PARTNER.md](./THINKING_PARTNER.md)
- **Multi-Agent Orchestration**: [MULTI_AGENT_ORCHESTRATION.md](./MULTI_AGENT_ORCHESTRATION.md)
- **Phase 2e Architecture**: [PHASE_2E_SESSION_ARCHITECTURE.md](../deployment/PHASE_2E_SESSION_ARCHITECTURE.md)
- **Agent Refactoring**: [CONTENT_AGENT_REFACTORING_PLAN.md](./CONTENT_AGENT_REFACTORING_PLAN.md)

---

**Next Steps**: Review with team, prioritize Phase 1 (Gateway Infrastructure), begin implementation.
