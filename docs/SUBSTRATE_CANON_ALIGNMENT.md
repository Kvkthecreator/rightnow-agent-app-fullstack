# Substrate Canon Alignment Status

## Canon v1.3.1 Requirements

Per YARNNN_CANON.md and YARNNN_MEMORY_MODEL.md:

1. **Documents compose ALL substrate types as peers**:
   - `context_blocks` (structured units from dumps)
   - `raw_dumps` (immutable captures)
   - `context_items` (semantic connectors)
   - `reflections` (computed insights, optionally cached)
   - `timeline_events` (activity references)

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

### Phase 2: Database Schema
- [ ] Create `substrate_references` table
- [ ] Migrate `block_links` data to new table
- [ ] Add RLS policies for substrate references
- [ ] Create attachment functions for all substrate types

### Phase 3: API Route Updates
- [ ] Replace `/documents/[id]/blocks` with `/documents/[id]/references`
- [ ] Update attachment endpoint to handle all substrate types
- [ ] Add filtering by substrate type
- [ ] Emit proper timeline events for all attachments

### Phase 4: UI Updates
- [ ] Update DocumentCompositionView to show all substrate types
- [ ] Create substrate picker/browser component
- [ ] Add tabs/filters for different substrate types
- [ ] Update empty states and loading states

### Phase 5: Migration & Testing
- [ ] Data migration script for existing block_links
- [ ] Update all unit tests
- [ ] E2E tests for multi-substrate composition
- [ ] Performance testing with large substrate sets

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

## Implementation Priority

1. **Contract alignment** ✅ - Foundation for all changes
2. **Database schema** - Enable substrate storage
3. **API routes** - Wire up functionality
4. **UI updates** - User-facing changes
5. **Migration** - Preserve existing data

## Notes

- Backend Python already supports rich composition
- Frontend TypeScript diverged to block-only
- Database has partial support (blocks + context_items)
- Need to unify around generic substrate reference model
- Maintain backward compatibility during migration