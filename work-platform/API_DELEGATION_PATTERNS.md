# API Delegation Patterns

## Overview

Work-platform uses a **Backend-for-Frontend (BFF)** pattern with a shared PostgreSQL database. This document defines when to implement operations directly vs. delegating to substrate-api.

## Core Principle

```
┌─────────────────────────────────────────────────────┐
│ READ operations  → Query database directly          │
│ WRITE operations → Depends on complexity & risk     │
└─────────────────────────────────────────────────────┘
```

## Decision Matrix

| Operation Type | Implementation | Rationale |
|---------------|----------------|-----------|
| **Read queries** | Direct DB access | Faster, simpler, no cross-service dependency |
| **Simple admin mutations** | Direct DB access | Low risk, admin-only, requires confirmation |
| **Complex mutations** | Delegate to substrate-api | Requires business logic, validation, or batching |
| **Governance-routed work** | Delegate to substrate-api | Uses governance system and work queue |

## Implementation Examples

### ✅ Implement Directly

**Context Retrieval** (`/api/projects/[id]/context`)
```typescript
// READ: Query blocks directly from database
const { data: blocks } = await supabase
  .from('blocks')
  .select('*')
  .eq('basket_id', basketId);
```

**Purge Preview** (`/api/projects/[id]/purge/preview`)
```typescript
// READ: Count blocks and dumps for preview
const { count: blocksCount } = await supabase
  .from('blocks')
  .select('*', { count: 'exact', head: true })
  .eq('basket_id', basketId);
```

**Basket Purge** (`/api/projects/[id]/purge`)
```typescript
// WRITE: Simple admin-only operation with confirmation
// Archives blocks and deletes dumps directly
await supabase
  .from('blocks')
  .update({ state: 'ARCHIVED' }, { count: 'exact' })
  .eq('basket_id', basketId)
  .not('state', 'in', '(REJECTED,SUPERSEDED,ARCHIVED)');

await supabase
  .from('raw_dumps')
  .delete({ count: 'exact' })
  .eq('basket_id', basketId);
```

**Why direct?**
- Admin-only with explicit confirmation (project name match)
- Simple database updates with no complex business logic
- No governance routing needed (destructive operation)
- Faster execution without HTTP roundtrip

**Workspace Purge** (`/api/workspaces/purge`)
```typescript
// WRITE: Comprehensive admin operation via stored procedure
// Uses database function for atomic transaction
await supabase.rpc('purge_workspace_data', {
  target_workspace_id: workspaceId
});
```

**Why RPC?**
- Multi-table deletion requires atomic transaction
- Complex cascade logic handled by database function
- Ensures data consistency across all related tables
- Owner-only with email + text confirmation

### 🔄 Delegate to Substrate-API

**Agent Operations** (Future: P0-P4 pipeline)
```typescript
// Complex multi-step processing with AI agents
POST /substrate-api/api/agents/process
```

**Work Routing** (Governance-controlled mutations)
```typescript
// Operations that require governance review/approval
POST /substrate-api/api/work
```

**Complex Mutations** (Business logic required)
```typescript
// Operations with validation, side effects, or complex state management
POST /substrate-api/api/baskets/[id]/operation
```

## Current API Mappings

### Work-Platform BFF Routes

| Route | Method | Implementation | Notes |
|-------|--------|----------------|-------|
| `/api/projects/[id]/context` | GET | Direct DB | Queries blocks table |
| `/api/projects/[id]/purge/preview` | GET | Direct DB | Counts blocks and dumps |
| `/api/projects/[id]/purge` | POST | Direct DB | Archives blocks, deletes dumps |
| `/api/projects/[id]/work-sessions` | GET | Direct DB | Queries work_sessions table |
| `/api/workspaces/purge` | DELETE | Direct DB (RPC) | Calls `purge_workspace_data()` stored procedure |

### Substrate-API Endpoints (Delegated)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/agents/*` | P0-P4 agent pipeline | Future |
| `/api/work` | Governance-routed mutations | Active |
| `/api/baskets/[id]/operations` | Complex basket operations | Active |

## Guidelines

### When to Implement Directly

1. **Read-only operations** - Always query DB directly
2. **Admin operations with confirmation** - Direct mutations OK if:
   - Requires explicit user confirmation (e.g., typing project name)
   - Admin/owner-only access
   - Simple database updates
   - No complex business logic

3. **Performance-critical paths** - Avoid HTTP roundtrips for simple operations

### When to Delegate

1. **Complex business logic** - Multiple validation steps, side effects
2. **Governance system** - Operations that need review/approval workflow
3. **Multi-step processes** - Requires orchestration across multiple tables
4. **Agent processing** - AI-driven operations (P0-P4 pipeline)

## Environment Configuration

```env
# work-platform/.env.local
NEXT_PUBLIC_API_BASE_URL=https://api.yarnnn.com
SUBSTRATE_API_URL=https://substrate-api.yarnnn.com  # Only for delegated operations

# Shared database (both services)
DATABASE_URL=postgresql://...
```

## Migration Path

When moving from delegated to direct implementation:

1. **Verify ownership & auth** - Maintain security checks
2. **Preserve logging** - Keep operation logs for debugging
3. **Match response format** - Ensure API contracts remain consistent
4. **Add documentation** - Update this file with new patterns

## Notes

- **Database sharing**: Work-platform and substrate-api share the same PostgreSQL database
- **RLS policies**: Both services use Row Level Security for access control
- **Authentication**: Work-platform uses Supabase session tokens
- **Transactions**: Use Supabase transactions for multi-step operations
- **Error handling**: Return consistent error format across all BFF routes

## Last Updated

2025-01-12 - Initial documentation after implementing direct purge operations
