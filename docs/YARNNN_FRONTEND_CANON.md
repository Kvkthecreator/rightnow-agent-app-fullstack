# YARNNN Frontend Canon v2.0: Unified Frontend Architecture

## Overview

This document provides comprehensive documentation for the Frontend Canon v2.0 implementation with pure substrate composition and separate artifact handling. Documents compose only substrate types (block, dump, context_item, timeline_event) while reflections are handled as artifacts.

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

1. **Pure Substrate Equality**: Substrate types are peers - block, dump, context_item, timeline_event (reflections now artifacts)
2. **Contracts-First**: All data flows through Zod-validated contracts in `shared/contracts/*`
3. **Workspace Scoping**: All operations respect workspace boundaries via RLS
4. **Governance Integration**: All substrate mutations flow through workspace governance policies
5. **Timeline Consistency**: All mutations emit canonical timeline events
6. **Component Composition**: UI atoms compose into dashboard experiences
7. **Document Mode Separation**: Documents have distinct View and Edit modes that respect Sacred Principle #3

### Document Mode Architecture

Per Sacred Principle #3: "Narrative is Deliberate" - Documents compose substrate references plus authored prose.

#### View Mode (Default - Read Interface)
- **Purpose**: Display composed narrative (substrate + prose layered cohesively)
- **Routing**: `/baskets/[id]/documents/[docId]` (default)
- **Function**: P4 Presentation - render final composition
- **Content**: 
  - Authored prose sections
  - Referenced substrate embedded contextually
  - Navigation between sections
- **Actions**: Edit, Export, Share
- **Canon Compliance**: Pure P4 - no substrate creation

#### Edit Mode (Composition Interface)
- **Purpose**: Compose narrative from existing substrate + authored prose
- **Routing**: `/baskets/[id]/documents/[docId]/edit`
- **Function**: P4 Composition - arrange substrate + prose
- **Content**:
  - Prose editor for authored sections
  - Substrate attachment panel (existing substrate only)
  - Role/weight management for references
- **Actions**: Save composition, Preview, Cancel
- **Canon Compliance**: Pure P4 - consumes substrate, never creates

#### Critical Separation
- **Capture** (P1): Memory page `/baskets/[id]/memory` - creates raw_dumps → substrate
- **Composition** (P4): Document edit mode - references existing substrate + authored prose
- **Presentation** (P4): Document view mode - displays composed narrative

**Anti-Pattern**: Document pages that capture new content violate Sacred Principle #3

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
  "timeline_event"   // timeline_events
]);

// Artifacts (not substrate)
export const ArtifactTypeSchema = z.enum([
  "reflection",      // reflections_artifact
  "document"         // documents
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

## 🏛️ Governance UI Integration

### Governance-Aware User Interface

The frontend provides comprehensive governance integration across all substrate operations:

#### Workspace Governance Controls
- **Settings Panel**: `/baskets/[id]/governance/settings` - Configure workspace execution policies
- **Review Mode Selection**: Users choose between 'Review Everything' (proposal) or 'Smart Review' (hybrid)
- **Validator Configuration**: Toggle mandatory validation for substrate changes
- **Scope Controls**: Set default blast radius (Local vs Scoped)

#### Proposal Workflow UI
- **Proposal Queue**: `/baskets/[id]/governance` - Review pending substrate changes
- **Proposal Details**: Show operation breakdown, confidence scores, impact analysis
- **Auto-Approval Indicators**: Visual feedback when proposals auto-execute via governance
- **Approval Actions**: Approve, reject, or request modifications for proposals

#### Governance Status Indicators
- **Work Status Integration**: Real-time governance decision visibility in work queue
- **Confidence Badges**: Display AI confidence scores for substrate operations
- **Routing Indicators**: Show whether operations went direct, proposal, or auto-approved
- **Timeline Integration**: Governance events visible in timeline with full audit trail

#### Component Examples

```typescript
// Governance Settings Component
export function GovernanceSettingsPanel({ workspaceId }: { workspaceId: string }) {
  const { settings, updateSettings } = useGovernanceSettings(workspaceId);
  
  return (
    <div className="governance-panel">
      <GovernanceToggle 
        enabled={settings.governance_enabled}
        onChange={(enabled) => updateSettings({ governance_enabled: enabled })}
      />
      <ReviewModeSelector
        mode={settings.review_mode}
        onChange={(mode) => updateSettings({ review_mode: mode })}
      />
      <ValidatorRequiredToggle
        required={settings.validator_required}
        onChange={(required) => updateSettings({ validator_required: required })}
      />
    </div>
  );
}

// Proposal Review Component
export function ProposalReviewCard({ proposal }: { proposal: Proposal }) {
  const { approveProposal, rejectProposal } = useProposalActions();
  
  return (
    <Card className="proposal-card">
      <ProposalHeader proposal={proposal} />
      <OperationsList operations={proposal.ops} />
      <ConfidenceBadge score={proposal.validator_report.confidence} />
      <ImpactAnalysis analysis={proposal.validator_report.impact_summary} />
      
      <div className="proposal-actions">
        <Button 
          onClick={() => approveProposal(proposal.id)}
          variant="success"
        >
          Approve
        </Button>
        <Button 
          onClick={() => rejectProposal(proposal.id)}
          variant="danger"
        >
          Reject
        </Button>
      </div>
    </Card>
  );
}

// Work Status with Governance
export function WorkStatusIndicator({ workId }: { workId: string }) {
  const { work } = useWorkStatus(workId);
  
  return (
    <div className="work-status">
      <StatusBadge status={work.status} />
      {work.governance_mode && (
        <GovernanceBadge mode={work.governance_mode} />
      )}
      {work.confidence_score && (
        <ConfidenceBadge score={work.confidence_score} />
      )}
    </div>
  );
}
```

### Governance State Management

```typescript
// Governance hooks for state management
export function useGovernanceSettings(workspaceId: string) {
  const [settings, setSettings] = useState<GovernanceSettings>();
  
  const updateSettings = async (updates: Partial<GovernanceSettings>) => {
    const response = await apiClient.updateGovernanceSettings(workspaceId, updates);
    setSettings(response.data);
    // Emit timeline event for governance changes
    notificationService.governanceSettingsChanged('Settings Updated', 'Governance policies updated');
  };
  
  return { settings, updateSettings };
}

export function useProposalActions() {
  const approveProposal = async (proposalId: string) => {
    await apiClient.approveProposal(proposalId);
    notificationService.proposalApproved('Proposal Approved', 'Substrate changes committed');
  };
  
  const rejectProposal = async (proposalId: string, reason?: string) => {
    await apiClient.rejectProposal(proposalId, reason);
    notificationService.proposalRejected('Proposal Rejected', 'Changes not applied');
  };
  
  return { approveProposal, rejectProposal };
}
```

### Governance-First UI Patterns

1. **No Direct Substrate Writes**: UI never bypasses governance for substrate operations
2. **Policy Visibility**: Users always see current governance configuration
3. **Confidence Integration**: AI confidence scores visible in all substrate operations
4. **Audit Trail**: Complete governance decision history in timeline
5. **Progressive Disclosure**: Governance complexity hidden until needed

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
  'timeline_event'   -- timeline_events
);

-- Artifacts are separate from substrate
-- reflections_artifact table stores reflections as artifacts
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
    const validTypes = ['block', 'dump', 'context_item', 'timeline_event'];
    validTypes.forEach(type => {
      const result = SubstrateTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it('enforces substrate canon equality', () => {
    // All substrate types should have equal status
    const substrateTypes = SubstrateTypeSchema.options;
    expect(substrateTypes.length).toBe(4);
    // No type should have special precedence
  });

  it('separates artifacts from substrate', () => {
    const artifactTypes = ArtifactTypeSchema.options;
    expect(artifactTypes).toContain('reflection');
    expect(artifactTypes).toContain('document');
    // Artifacts are not substrate
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

This Frontend Canon v1.4.0 implementation provides a complete, substrate-aware scaffolding system that treats all substrate types as equal peers. The architecture supports future extensions while maintaining strict canon compliance, comprehensive testing, and performance optimization.

The system is ready for production deployment and provides a solid foundation for continued development aligned with substrate canon principles.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Canon Version**: v1.4.0  
**Implementation Status**: ✅ Complete

---

## 🏗️ Frontend-Service Architecture Mapping

### Core Architectural Principle

**Frontend = Pure View Layer of Canonical Services**

The frontend must be a pure rendering layer that mirrors durable server state, with zero client-side intelligence synthesis. All cognitive processing happens in the canonical agent pipeline (P0→P1→P2→P3).

### The Canonical Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANONICAL SERVICE ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│  P0: Capture    │ P1: Substrate  │ P2: Graph     │ P3: Reflection│
│  Agent          │ Agent          │ Agent         │ Agent         │
│  ============   │ ============   │ ============  │ ============  │
│  • raw_dumps    │ • blocks       │ • context     │ • reflections │
│                 │ • context_items│   _relationships│   (artifacts)  │
│                 │                │               │               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   SUPABASE DB     │
                          │   (Context Graph  │
                          │    Service)       │
                          └─────────┬─────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND VIEW LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  Timeline View  │ Reflections   │ Blocks View   │ Memory View   │
│  =============  │ View          │ ============  │ ============  │
│  • Event stream │ ============  │ • Block list  │ • Projection  │
│  • Agent traces │ • P3 insights │ • Confidence  │ • Composition │
│                 │ • Metadata    │ • Semantic    │               │
│                 │               │   types       │               │
└─────────────────────────────────────────────────────────────────┘
```

### Governance Integration Architecture

The frontend integrates with the canonical governance framework through standardized patterns:

- **Workspace-Scoped Operations**: All UI operations respect workspace boundaries via RLS
- **User-Controlled Execution**: Frontend surfaces workspace governance policy controls
- **Confidence-Informed UI**: Display AI confidence scores and routing decisions
- **Proposal Workflow**: Frontend handles governance proposal creation and approval flows

### Frontend-Service Mapping Table

| Frontend Page | Service Pipeline | Data Source | Operations Allowed |
|---------------|------------------|-------------|-------------------|
| `/memory` | P0 Capture | `raw_dumps` | Create dumps only |
| `/building-blocks` | P1 Substrate | `context_blocks`, `context_items` | View substrate, governance proposals |
| `/graph` | P2 Graph | `context_relationships` | View connections only |
| `/reflections` | P3 Reflection | `reflections_artifact` | View insights only |
| `/documents` | P4 Presentation | `documents`, `substrate_references` | Compose from substrate |
| `/timeline` | All Pipelines | `timeline_events` | View processing events |
| `/governance` | Universal | `proposals`, `governance_settings` | Manage proposals, configure policies |

### Service Communication Patterns

**Read Operations (Frontend → Service)**:
- Direct Supabase queries with RLS enforcement
- No client-side data synthesis or transformation
- Real-time subscriptions for live updates

**Write Operations (Frontend → Service)**:
- All mutations flow through Universal Work API (`/api/work`)
- Governance-mediated execution based on workspace policies
- Timeline event emission for all operations

---

## 🎯 Adapter Layer Strategy: Swappable Presentation Lenses

### Strategic Vision: "Stable Core, Swappable Lenses"

Build presentation adapters on top of the hardened canonical service architecture, enabling multiple user experiences (B2C consumer vs B2B enterprise) while maintaining a single, battle-tested backend.

### Backend as Context Graph Service

The Supabase backend serves as a **Context Graph Service** - a durable, agent-processed substrate that different presentation layers can adapt for their specific user needs.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION ADAPTERS                        │
├─────────────────────────────────────────────────────────────────┤
│  B2C Consumer   │ B2B Enterprise  │ API/SDK       │ Future       │
│  Lens           │ Lens            │ Lens          │ Lens         │
│  =============  │ =============== │ ============  │ ============ │
│  • Personal     │ • Team collab   │ • Developer   │ • Mobile     │
│    memory       │ • Admin panels  │   tools       │ • Voice      │
│  • Simple UI    │ • Analytics     │ • Webhooks    │ • AR/VR      │
│  • Consumer     │ • Compliance    │ • Bulk ops    │ • IoT        │
│    workflows    │ • Enterprise    │               │              │
│                 │   workflows     │               │              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   ADAPTER LAYER   │
                          │   (Translation &  │
                          │   Orchestration)  │
                          └─────────┬─────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                 CANONICAL SERVICE CORE                          │
├─────────────────────────────────────────────────────────────────┤
│                    Context Graph Service                        │
│                    ==================                          │
│ P0 Agent        │ P1 Agent       │ P2 Agent      │ P3 Agent      │
│ ========        │ ========       │ ========      │ ========      │  
│ • raw_dumps     │ • blocks       │ • context     │ • document     │
│   (immutable)   │ • context_items│   _relations  │   versions     │
│                 │                │               │ • reflections  │
└─────────────────────────────────────────────────────────────────┘
```

### Adapter Implementation Patterns

**Consumer Lens (Current Implementation)**:
- Single-user workspace model
- Simplified navigation and terminology
- Personal memory management focus
- Minimal governance complexity

**Enterprise Lens (Future)**:
- Multi-user workspace collaboration
- Admin dashboards and analytics
- Compliance and audit trails
- Advanced governance controls

**API/SDK Lens (Future)**:
- Developer-focused interfaces
- Bulk operations and automation
- Webhook integrations
- Programmatic access patterns

### Adapter Layer Architecture

**Translation Layer**:
- Maps presentation concepts to canonical service operations
- Handles lens-specific terminology and workflows
- Maintains lens-specific state and preferences

**Orchestration Layer**:
- Coordinates multi-service operations for complex workflows
- Manages lens-specific business logic
- Handles lens-specific error handling and recovery

**Configuration Layer**:
- Lens-specific UI themes and layouts
- Feature flag management per lens
- Lens-specific default settings and behaviors

### Benefits of Adapter Strategy

1. **Single Backend Maintenance**: One canonical service architecture supports all experiences
2. **Rapid Feature Development**: New lenses can be built quickly on proven infrastructure
3. **Consistent Data Model**: All lenses operate on the same substrate/artifact model
4. **Battle-Tested Core**: Service layer hardened through production use across lenses
5. **Future-Proof Architecture**: New interaction paradigms (voice, AR/VR) easily supported

---

## 📊 Frontend Architecture Consolidation Summary

This unified Frontend Canon consolidates:

1. **Core Interface Architecture**: Substrate/artifact composition patterns and component hierarchy
2. **Service Integration**: Frontend-service mapping and communication patterns  
3. **Adapter Strategy**: Multi-lens presentation architecture for different user experiences

The result is a comprehensive frontend architecture that maintains canonical compliance while supporting flexible presentation layers and future extensibility.