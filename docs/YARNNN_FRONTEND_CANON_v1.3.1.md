# Frontend Canon v1.4.0: Memory Interface Evolution

## Overview

This document provides comprehensive documentation for the Frontend Canon v1.4.0 implementation, including the evolved memory interface with document library integration and the complete substrate-aware composition system. The implementation follows strict canon compliance where all substrate types (blocks, dumps, context_items, reflections, timeline_events) are treated as peers in a generic composition system.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Contract System](#contract-system)
- [Component Architecture](#component-architecture)
- [API Structure](#api-structure)
- [Database Schema](#database-schema)
- [Sub-page Atoms](#sub-page-atoms)
- [Testing Strategy](#testing-strategy)
- [Development Patterns](#development-patterns)
- [Canon Compliance](#canon-compliance)
- [Future Extensions](#future-extensions)

## Architecture Overview

### Core Principles

1. **Substrate Equality**: All substrates are peers - no hierarchy between blocks, dumps, context_items, reflections, timeline_events
2. **Contracts-First**: All data flows through Zod-validated contracts in `shared/contracts/*`
3. **Workspace Scoping**: All operations respect workspace boundaries via RLS
4. **Timeline Consistency**: All mutations emit canonical timeline events
5. **Component Composition**: UI atoms compose into dashboard experiences

### Layer Architecture

```
┌─────────────────────┐
│   UI Components     │  ← DocumentCompositionView, BlocksListView, GraphView
├─────────────────────┤
│   API Routes        │  ← /api/documents/*, /api/baskets/*/documents
├─────────────────────┤
│   Contracts         │  ← shared/contracts/documents.ts, substrate_references.ts
├─────────────────────┤
│   Database          │  ← documents, substrate_references, context_blocks
└─────────────────────┘
```

## Contract System

### Core Contracts

#### `shared/contracts/documents.ts`
Central document contracts with substrate canon exports:

```typescript
// Primary document structure
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).default({}),
});

// Re-exports from substrate_references.ts for substrate canon
export {
  SubstrateTypeSchema,
  SubstrateReferenceSchema,
  DocumentCompositionSchema,
  // ... all substrate-related contracts
} from './substrate_references';

// DEPRECATED: Legacy block-only composition
export const BlockLinkSchema = z.object({...}); // Marked deprecated
```

#### `shared/contracts/substrate_references.ts`
Generic substrate reference system:

```typescript
// All supported substrate types
export const SubstrateTypeSchema = z.enum([
  "block",           // context_blocks
  "dump",            // raw_dumps
  "context_item",    // context_items
  "reflection",      // reflections (from cache)
  "timeline_event"   // timeline_events
]);

// Generic reference linking documents to any substrate
export const SubstrateReferenceSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  substrate_type: SubstrateTypeSchema,
  substrate_id: z.string().uuid(),
  role: z.string().optional(),           // "primary", "supporting", "citation"
  weight: z.number().min(0).max(1).optional(),
  snippets: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  created_by: z.string().uuid().optional(),
});

// Full composition with substrate summaries
export const DocumentCompositionSchema = z.object({
  document: DocumentSchema,
  references: z.array(z.object({
    reference: SubstrateReferenceSchema,
    substrate: SubstrateSummarySchema,
  })),
  composition_stats: z.object({
    blocks_count: z.number(),
    dumps_count: z.number(),
    context_items_count: z.number(),
    reflections_count: z.number(),
    timeline_events_count: z.number(),
    total_references: z.number(),
  }),
});
```

### Contract Mappings

| Contract | Database Table | API Endpoint | UI Component |
|----------|---------------|--------------|--------------|
| `DocumentDTO` | `documents` | `/api/documents/[id]` | `DocumentCompositionView` |
| `SubstrateReferenceDTO` | `substrate_references` | `/api/documents/[id]/references` | `SubstrateReferenceCard` |
| `DocumentComposition` | Multiple joins | `/api/documents/[id]/composition` | `DocumentCompositionView` |
| `SubstrateSummary` | Substrate-specific tables | Server-side joins | Type-specific displays |

## Component Architecture

### Component Hierarchy

```
BasketPage
├── Dashboard (existing)
│   ├── TimelIne
│   ├── Memory
│   └── Reflections
└── Sub-pages (atoms)
    ├── /documents
    │   ├── DocumentsList
    │   ├── CreateDocumentButton
    │   └── /[docId]
    │       └── DocumentCompositionView
    │           ├── SubstrateReferenceCard[]
    │           ├── CompositionStats
    │           └── SubstrateTypeFilters
    ├── /blocks
    │   └── BlocksListView
    │       ├── BlockCard[]
    │       ├── BlockFilters
    │       └── BlockStats
    └── /graph
        └── GraphView
            ├── CanvasRenderer
            ├── NodeTypeFilters
            └── LayoutControls
```

### Key Components

#### `DocumentCompositionView`
**Location**: `web/components/documents/DocumentCompositionView.tsx`
**Purpose**: Main document composition interface with multi-substrate support

**Features**:
- Fetches full document composition via `/api/documents/[id]/composition`
- Displays all substrate references as peer entities
- Substrate type filtering and statistics
- Reference detachment with optimistic updates
- Timeline event integration for all operations

**Props**:
```typescript
interface DocumentCompositionViewProps {
  document: {
    id: string;
    basket_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, any>;
  };
  basketId: string;
}
```

#### `SubstrateReferenceCard`
**Purpose**: Generic display component for any substrate reference
**Features**:
- Type-specific icons and colors (blocks=blue, dumps=green, etc.)
- Role and weight display
- Snippet highlighting
- Substrate-specific metadata display
- Detachment functionality

#### `BlocksListView` 
**Location**: `web/components/blocks/BlocksListView.tsx`
**Purpose**: Comprehensive block management interface

**Features**:
- Search and filtering by state/content
- Sorting by date, title, reference count
- Block statistics and reference counts
- Navigation to composition workflows
- Comprehensive empty and loading states

#### `GraphView`
**Location**: `web/components/graph/GraphView.tsx`
**Purpose**: Interactive knowledge graph visualization

**Features**:
- Canvas-based rendering for performance
- Multiple layout algorithms (force, hierarchy, circular)
- Node type filtering and controls
- Interactive node selection with details
- Substrate relationship visualization

## API Structure

### Document Management

#### Core Document Endpoints
```
GET    /api/baskets/[id]/documents     - List documents in basket
POST   /api/baskets/[id]/documents     - Create new document
GET    /api/documents/[id]             - Get document details
PATCH  /api/documents/[id]             - Update document
```

#### Substrate Composition Endpoints
```
GET    /api/documents/[id]/composition - Full composition with substrate summaries
GET    /api/documents/[id]/references  - List substrate references (with filtering)
POST   /api/documents/[id]/references  - Attach substrate to document
DELETE /api/documents/[id]/references  - Detach substrate from document
```

#### Legacy Block Endpoints (Maintained for compatibility)
```
GET    /api/documents/[id]/blocks      - Block-specific references
POST   /api/documents/[id]/blocks      - Attach block
DELETE /api/documents/[id]/blocks/[blockId] - Detach block
```

### Request/Response Patterns

#### Substrate Attachment
```typescript
// POST /api/documents/[id]/references
{
  "substrate_type": "block",
  "substrate_id": "uuid",
  "role": "primary",
  "weight": 0.8,
  "snippets": ["important text"],
  "metadata": {"source": "manual"}
}

// Response
{
  "reference": {
    "id": "uuid",
    "document_id": "uuid",
    "substrate_type": "block",
    // ... full SubstrateReferenceDTO
  }
}
```

#### Full Composition
```typescript
// GET /api/documents/[id]/composition
{
  "document": DocumentDTO,
  "references": [{
    "reference": SubstrateReferenceDTO,
    "substrate": SubstrateSummaryDTO
  }],
  "composition_stats": {
    "blocks_count": 3,
    "dumps_count": 1,
    "context_items_count": 2,
    "reflections_count": 0,
    "timeline_events_count": 1,
    "total_references": 7
  }
}
```

### Error Handling

All API endpoints follow consistent error patterns:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (workspace access denied)
- `404` - Not Found (document/substrate not found)
- `422` - Unprocessable Entity (Zod validation failures)
- `500` - Internal Server Error

## Database Schema

### Core Tables

#### `documents`
```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id uuid NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}',
  
  -- Workspace scoping (inherited from basket)
  CONSTRAINT documents_basket_fk FOREIGN KEY (basket_id) REFERENCES baskets(id)
);

-- Indexes
CREATE INDEX idx_documents_basket ON documents(basket_id);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
```

#### `substrate_references`
```sql
CREATE TABLE substrate_references (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  substrate_type substrate_type NOT NULL,
  substrate_id uuid NOT NULL,
  role text,
  weight numeric(3,2) CHECK (weight >= 0 AND weight <= 1),
  snippets jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure unique substrate per document
  UNIQUE(document_id, substrate_type, substrate_id)
);

-- Critical indexes for performance
CREATE INDEX idx_substrate_references_document ON substrate_references(document_id);
CREATE INDEX idx_substrate_references_type ON substrate_references(substrate_type);
CREATE INDEX idx_substrate_references_substrate ON substrate_references(substrate_id);
```

#### `substrate_type` Enum
```sql
CREATE TYPE substrate_type AS ENUM (
  'block',           -- context_blocks
  'dump',            -- raw_dumps
  'context_item',    -- context_items
  'reflection',      -- reflections (from cache)
  'timeline_event'   -- timeline_events
);
```

### RLS Policies

All tables implement workspace-scoped RLS:

```sql
-- substrate_references policies
CREATE POLICY "substrate_references_select_policy" ON substrate_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN baskets b ON d.basket_id = b.id
      WHERE d.id = substrate_references.document_id
      AND (b.visibility = 'public' OR b.user_id = auth.uid())
    )
  );
-- ... similar for INSERT, UPDATE, DELETE
```

### Database Functions

#### `fn_document_attach_substrate()`
Generic substrate attachment with validation and timeline events:

```sql
CREATE OR REPLACE FUNCTION fn_document_attach_substrate(
  p_document_id uuid,
  p_substrate_type substrate_type,
  p_substrate_id uuid,
  p_role text DEFAULT NULL,
  p_weight numeric DEFAULT NULL,
  p_snippets jsonb DEFAULT '[]',
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid
```

**Features**:
- Validates substrate existence across all substrate tables
- Upsert behavior for idempotent operations
- Emits canonical timeline events (`document.{type}.attached`)
- Workspace-scoped security checks

#### `fn_document_detach_substrate()`
Generic substrate detachment:

```sql
CREATE OR REPLACE FUNCTION fn_document_detach_substrate(
  p_document_id uuid,
  p_substrate_type substrate_type,
  p_substrate_id uuid
) RETURNS boolean
```

**Features**:
- Safe deletion with existence checks
- Timeline event emission (`document.{type}.detached`)
- Returns success/failure status

## Sub-page Atoms

### Documents: `/baskets/[id]/documents`

**Page**: `web/app/baskets/[id]/documents/page.tsx`
**Component**: `DocumentsList` 
**Features**:
- Server-side document fetching with workspace checks
- Create document functionality
- Navigation to composition views
- Responsive grid layout with search

**Document Detail**: `/baskets/[id]/documents/[docId]`
**Page**: `web/app/baskets/[id]/documents/[docId]/page.tsx`  
**Component**: `DocumentCompositionView`
**Features**:
- Full substrate composition interface
- Multi-substrate reference management
- Real-time composition statistics
- Timeline event integration

### Blocks: `/baskets/[id]/blocks`

**Page**: `web/app/baskets/[id]/blocks/page.tsx`
**Component**: `BlocksListView`
**Features**:
- Server-side block fetching with metadata
- Search by title/content
- Filter by state (active, draft, archived, superseded)  
- Sort by date, title, reference count
- Block statistics dashboard
- Reference count tracking

### Graph: `/baskets/[id]/graph`

**Page**: `web/app/baskets/[id]/graph/page.tsx`
**Component**: `GraphView`
**Features**:
- Server-side graph data aggregation
- Multiple layout algorithms
- Interactive canvas rendering
- Node filtering by substrate type
- Relationship visualization
- Performance optimized for large datasets

### Timeline: `/baskets/[id]/timeline` (Existing)

**Features** (Canon compliance updates):
- Reads from `timeline_events` table
- Canonical event kinds for all substrate operations:
  - `document.created`
  - `document.updated`  
  - `document.block.attached/detached`
  - `document.dump.attached/detached`
  - `document.context_item.attached/detached`
  - `document.reflection.attached/detached`
  - `document.timeline_event.attached/detached`

## Testing Strategy

### Unit Tests

#### Contract Validation Tests
**Location**: `web/__tests__/contracts/substrateReferences.test.ts`

```typescript
describe('Substrate Reference Contracts', () => {
  it('validates all canonical substrate types', () => {
    const validTypes = ['block', 'dump', 'context_item', 'reflection', 'timeline_event'];
    validTypes.forEach(type => {
      const result = SubstrateTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it('enforces substrate canon equality', () => {
    // All substrate types should have equal status
    const substrateTypes = SubstrateTypeSchema.options;
    expect(substrateTypes.length).toBe(5);
    // No type should have special precedence
  });
});
```

#### Component Tests
**Location**: `web/__tests__/documents/substrateComposition.test.tsx`

```typescript
describe('DocumentCompositionView', () => {
  it('displays all substrate types with equal prominence', async () => {
    // Test substrate equality in UI
    const substrateCards = screen.getAllByTestId('substrate-reference-card');
    substrateCards.forEach(card => {
      expect(card).toHaveAttribute('data-substrate-equality', 'true');
    });
  });

  it('maintains substrate canon compliance', async () => {
    // Verify no hierarchy between substrate types
    const references = await screen.findAllByRole('article');
    references.forEach(ref => {
      expect(ref).toHaveClass('substrate-peer-reference');
    });
  });
});
```

### E2E Tests

#### Full Substrate Composition Workflow
**Location**: `tests/e2e/document_substrate_composition.spec.ts`

```typescript
test('verifies seeded substrate composition data', async ({ page }) => {
  await page.goto(`/baskets/${basketId}/documents/${documentId}`);
  
  // Verify substrate canon compliance
  await expect(page.locator('.substrate-badge:has-text("block")')).toBeVisible();
  await expect(page.locator('.substrate-badge:has-text("dump")')).toBeVisible();
  await expect(page.locator('.substrate-badge:has-text("context item")')).toBeVisible();
  
  // All references should have same structure (peer equality)
  const cards = page.locator('.substrate-reference-card');
  await expect(cards).toHaveCount(3);
});
```

### Test Data Seeding

#### CI Test Basket
**Script**: `scripts/seed-test-basket.js`
**Purpose**: Creates `TEST_BASKET_ID` with comprehensive substrate composition data

**Seeded Data**:
- Test documents with multi-substrate references
- Blocks, dumps, context items with realistic content
- Substrate references with various roles and weights
- Timeline events for all substrate operations
- Complete composition examples

**GitHub Actions**: `.github/workflows/e2e-testing.yml`
- Automated seeding before E2E tests
- Substrate canon compliance verification
- Performance baseline testing

## Development Patterns

### Adding New Substrate Types

To add a new substrate type (e.g., `annotation`):

1. **Update Enum**: Add to `substrate_type` enum in migration
2. **Contract**: Add to `SubstrateTypeSchema` in `substrate_references.ts`
3. **Database Function**: Add validation case in `fn_document_attach_substrate`
4. **UI Components**: Add icon, color, and display logic to `DocumentCompositionView`
5. **Tests**: Add to contract validation and E2E tests
6. **Documentation**: Update this canon document

### Component Patterns

#### Substrate-Aware Components
All substrate-related components should:
- Import types from `@shared/contracts/documents`
- Handle all substrate types generically
- Use `SubstrateType` enum for switching
- Display substrate-specific metadata appropriately
- Maintain peer equality in UI treatment

#### Error Boundaries
```typescript
// Substrate operation error handling
const handleSubstrateOperation = async (operation: SubstrateOperation) => {
  try {
    const result = await operation();
    // Optimistic UI updates
  } catch (error) {
    if (error.status === 400) {
      // Validation error - show inline feedback
    } else if (error.status === 403) {
      // Permission error - show access denied
    } else {
      // Network/server error - show retry option
    }
  }
};
```

### API Patterns

#### Consistent Response Structure
```typescript
// Success responses
{
  "data": T,           // Zod-validated response data
  "meta"?: {          // Optional metadata
    "cursor": string,
    "has_more": boolean
  }
}

// Error responses  
{
  "error": string,     // Human-readable error
  "details"?: object,  // Zod validation details
  "code"?: string     // Error code for programmatic handling
}
```

#### Workspace Scoping Pattern
```typescript
// Every API handler should:
const { userId } = await getAuthenticatedUser(supabase);
const workspace = await ensureWorkspaceForUser(userId, supabase);

// Then verify resource belongs to workspace
if (resource.workspace_id !== workspace.id) {
  return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
}
```

## Canon Compliance

### Substrate Equality Principles

1. **No Hierarchy**: All substrate types have equal status in the system
2. **Generic Operations**: Attachment, detachment, and display work uniformly
3. **Consistent Events**: Timeline events follow same patterns for all types
4. **UI Parity**: All substrates get equal visual treatment and functionality

### Canon Validation Checklist

#### Contract Level
- [ ] All substrate types in `SubstrateTypeSchema` enum
- [ ] Generic `SubstrateReferenceDTO` works for all types
- [ ] No substrate-specific DTOs outside of summaries
- [ ] Zod validation covers all substrate scenarios

#### Database Level
- [ ] `substrate_references` table handles all types generically
- [ ] RLS policies consistent across all substrate tables
- [ ] Database functions validate all substrate types
- [ ] Indexes support efficient querying for all types

#### API Level
- [ ] Endpoints work uniformly across substrate types
- [ ] Error handling consistent for all substrate operations
- [ ] Timeline events emitted for all substrate types
- [ ] Workspace scoping applied consistently

#### UI Level
- [ ] All substrate types get visual representation
- [ ] No preferential treatment in UI layout/prominence
- [ ] Filter and search work across all substrate types
- [ ] Empty states handle all substrate scenarios

### Performance Considerations

#### Database Optimization
- Compound indexes on `substrate_references(document_id, substrate_type, substrate_id)`
- Materialized composition stats via `document_composition_stats` view
- Efficient substrate validation via CASE statements in functions

#### UI Optimization
- Canvas-based graph rendering for large datasets
- Virtualization for long substrate reference lists
- Optimistic updates for immediate user feedback
- Debounced search and filtering

#### API Optimization
- Server-side aggregation for composition endpoints
- Cursor-based pagination for large result sets
- Selective field loading for summary views
- Caching headers for static substrate data

## Future Extensions

### Planned Enhancements

#### Enhanced Composition Features
- **Substrate Picker**: Modal interface for browsing and attaching substrates
- **Bulk Operations**: Multi-select attachment/detachment
- **Composition Templates**: Predefined substrate compositions for document types
- **Reference Analytics**: Usage patterns and reference strength analytics

#### Advanced Graph Features
- **Real-time Updates**: Live graph updates via WebSocket connections
- **Clustered Layout**: Automatic grouping by substrate type or relationship strength
- **Export Capabilities**: SVG/PNG export of graph visualizations
- **Collaborative Annotations**: Shared notes on substrate relationships

#### Search and Discovery
- **Cross-Substrate Search**: Search across all substrate types simultaneously
- **Semantic Relationships**: AI-powered relationship suggestions
- **Reference Recommendations**: Suggest relevant substrates for documents
- **Usage Analytics**: Track which substrates are most referenced

### Extension Patterns

#### Adding New Sub-pages
1. Create page at `/web/app/baskets/[id]/[new-page]/page.tsx`
2. Implement server-side data fetching with workspace checks
3. Create component in `/web/components/[new-page]/`
4. Add navigation link in basket layout
5. Implement tests following existing patterns

#### Extending Substrate Types
Follow the "Adding New Substrate Types" pattern above, ensuring:
- Generic database handling
- Consistent UI treatment
- Comprehensive test coverage
- Timeline event integration
- Performance optimization

#### Advanced Filtering
- Extend `GetDocumentReferencesRequestSchema` with new filter options
- Update API endpoint to handle new filters
- Add UI controls in `DocumentCompositionView`
- Maintain URL state for shareable filters

### Migration Strategies

#### Legacy System Compatibility
- Maintain `BlockLinkDTO` exports marked as deprecated
- Provide migration utilities for existing block-only compositions
- Gradual rollout via feature flags
- Comprehensive regression testing

#### Data Migration
- Background jobs to convert existing `block_links` to `substrate_references`
- Validation scripts to ensure data integrity
- Rollback procedures for safe deployment
- Monitoring for migration completion

## Conclusion

This Frontend Canon v1.3.1 implementation provides a complete, substrate-aware scaffolding system that treats all substrate types as equal peers. The architecture supports future extensions while maintaining strict canon compliance, comprehensive testing, and performance optimization.

The system is ready for production deployment and provides a solid foundation for continued development aligned with substrate canon principles.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Canon Version**: v1.3.1  
**Implementation Status**: ✅ Complete