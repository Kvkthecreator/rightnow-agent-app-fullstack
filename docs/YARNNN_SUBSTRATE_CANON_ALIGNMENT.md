# Substrate Canon Alignment Status

## Canon v2.0 Requirements

Per YARNNN_CANON.md and YARNNN_SUBSTRATE_ARTIFACT_MODEL.md:

1. **Documents reference pure substrates only**:
   - `block` (context_blocks - structured knowledge ingredients)
   - `dump` (raw_dumps - immutable captures)
   - `context_item` (semantic connectors)
   - `timeline_event` (activity references)

2. **Reflections are artifacts**, not substrates:
   - Stored in `reflections_artifact` table
   - Target substrate state OR document versions
   - No recursive artifact references

2. **No substrate hierarchy** - all are equal peers
3. **Composition model**: Documents = substrate references + narrative
4. **Sacred write path**: POST /api/dumps/new (one dump per call)

## Current Implementation Gaps

### ❌ Frontend (Major Divergence)
- **Contracts**: Block-only composition (`BlockLinkDTO`)
- **API Routes**: `/documents/[id]/blocks` (block-only)
- **UI**: Only shows block references
- **Missing**: Generic substrate reference system

### ✅ Backend (Partially Aligned)
- **Database**: Has `fn_document_attach_context_item` 
- **Python schemas**: Rich `document_composition_schema.py` supports multi-substrate
- **Tables**: `block_links` + potential for `document_context_items`
- **Missing**: Generic substrate_references table

### ⚠️ Database (Needs Extension)
- **Has**: `block_links` table (documents ↔ blocks)
- **Has**: Functions for context_items attachment
- **Missing**: Generic substrate reference table
- **Missing**: Functions for dumps, reflections, timeline_events

## Re-alignment Tasks

### Phase 1: Contract Re-alignment ✅
- [x] Create `substrate_references.ts` with generic reference system
- [x] Update `documents.ts` to export substrate types
- [x] Mark `BlockLinkDTO` as deprecated

### Phase 2: Database Schema ✅
- [x] Create `substrate_references` table with generic substrate support
- [x] Create migration script for existing `block_links` data
- [x] Add RLS policies for workspace-scoped substrate access
- [x] Create attachment/detachment functions for all substrate types
- [x] Add composition stats view for efficient querying

### Phase 3: API Route Updates ✅
- [x] Create `/documents/[id]/composition` endpoint for full substrate composition
- [x] Create `/documents/[id]/references` with CRUD operations for all substrate types
- [x] Add filtering by substrate type, role, and pagination
- [x] Emit proper timeline events for all substrate attachments/detachments
- [x] Support weight, role, snippets, and metadata for all references

### Phase 4: UI Updates ✅
- [x] Update DocumentCompositionView to show all substrate types as peers
- [x] Create substrate reference cards with type-specific icons and colors
- [x] Add composition overview with stats for each substrate type
- [x] Add filtering by substrate type in the UI
- [x] Update empty states and loading states for multi-substrate system
- [x] Support reference detachment with optimistic updates

### Phase 5: Migration & Testing ✅
- [x] Create comprehensive unit tests for substrate reference contracts
- [x] Create UI component tests for multi-substrate composition
- [x] Create E2E tests covering full substrate composition workflow
- [x] Test substrate canon compliance (peer equality, no hierarchy)
- [x] Test error handling and edge cases

## Substrate Reference Patterns

### Blocks (context_blocks)
- Role: "primary", "supporting", "example"
- Weight: Relevance score
- Snippets: Quoted sections

### Dumps (raw_dumps)
- Role: "source", "reference", "inspiration"
- Weight: Coverage percentage
- Snippets: Relevant excerpts

### Context Items
- Role: "theme", "audience", "goal", "constraint"
- Weight: Importance score
- Metadata: Context type, validation status

### Reflections
- Role: "insight", "pattern", "tension", "question"
- Weight: Confidence score
- Metadata: Computation timestamp, window

### Timeline Events
- Role: "milestone", "reference", "annotation"
- Weight: Relevance to document
- Metadata: Event kind, actor, timestamp

## Implementation Priority ✅ COMPLETED

1. **Contract alignment** ✅ - Foundation for all changes
2. **Database schema** ✅ - Enable substrate storage
3. **API routes** ✅ - Wire up functionality
4. **UI updates** ✅ - User-facing changes
5. **Migration** ✅ - Preserve existing data
6. **Testing** ✅ - Comprehensive test coverage
7. **Sub-page scaffolds** ✅ - Blocks and Graph views

## Notes

- Backend Python already supports rich composition
- Frontend TypeScript diverged to block-only
- Database has partial support (blocks + context_items)
- Need to unify around generic substrate reference model
- Maintain backward compatibility during migration