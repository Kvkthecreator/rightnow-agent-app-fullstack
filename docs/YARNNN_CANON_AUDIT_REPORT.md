# YARNNN Canon Documentation Audit Report

**Date**: 2025-09-03  
**Purpose**: Ensure all canon documentation presents a singular, cohesive vision of blocks as structured knowledge ingredients

## Executive Summary

The YARNNN documentation currently has inconsistencies regarding the fundamental nature of blocks. While `YARNNN_CANON.md` and `YARNNN_MEMORY_MODEL.md` have been updated to reflect blocks as "structured knowledge ingredients" with goals, constraints, metrics, and entities, many other documents still use legacy terminology like "structured units" or "insights" without specifying the concrete data structure.

## Critical Inconsistencies Found

### 1. YARNNN_INGESTION_CANON.md

**Issue**: References blocks as generic "structured units" without mentioning their structured knowledge nature.

**Line 22**: 
```
Blocks (**context_blocks**) are structured units created during interpretation.
```

**Should be**:
```
Blocks (**context_blocks**) are structured knowledge ingredients extracted from raw_dumps containing goals, constraints, metrics, entities, and relationships with semantic classification and transformation capabilities.
```

### 2. YARNNN_SUBSTRATE_CANON_ALIGNMENT.md

**Issue**: Defines blocks as "structured units from dumps" rather than structured knowledge ingredients.

**Line 8**:
```
- `context_blocks` (structured units from dumps)
```

**Should be**:
```
- `context_blocks` (structured knowledge ingredients with goals, constraints, metrics, entities extracted from dumps)
```

### 3. YARNNN_BACKEND_AGENTSETUP.md

**Issue**: P1 Substrate Agent description doesn't specify what blocks actually contain.

**Lines 59-66**:
```
### 2. P1 Substrate Agent  
**Purpose**: Create structured substrate from raw dumps
**Operations**:
- Block proposal from dump content
- Context item extraction
- Semantic type classification
- Substrate persistence via proper RPCs
```

**Should be**:
```
### 2. P1 Substrate Agent  
**Purpose**: Extract structured knowledge ingredients from raw dumps
**Operations**:
- Extract goals, constraints, metrics, entities, and relationships from dump content
- Create blocks with structured knowledge data and provenance tracking
- Context item extraction with semantic classification
- Substrate persistence via proper RPCs with JSON schema validation
```

### 4. YARNNN_BASKETS_WORKFLOW.md

**Issue**: Agent descriptions don't reflect structured knowledge extraction.

**Line 40**:
```
1. **Block Proposer Agent**: Creates structured insights from content
```

**Should be**:
```
1. **Block Proposer Agent**: Extracts structured knowledge (goals, constraints, metrics, entities) from content
```

### 5. YARNNN_FRONTEND_CANON_v1.3.1.md

**Issue**: While comprehensive about substrate equality, doesn't mention blocks contain structured knowledge.

**Missing**: The document should note that blocks aren't just text content but structured data with specific fields.

### 6. YARNNN_ASYNC_INTELLIGENCE.md

**Issue**: Focuses on processing mechanics without defining what P1 actually extracts.

**Missing**: Should reference that P1 extracts structured knowledge ingredients.

## Recommended Updates

### Core Definition to Propagate

Every document referencing blocks should include this canonical definition:

```
Blocks (context_blocks) are structured knowledge ingredients extracted from raw_dumps by the P1 Substrate Agent. Each block contains:
- **Goals**: Objectives and desired outcomes identified in the content
- **Constraints**: Limitations, requirements, and boundaries
- **Metrics**: Measurable criteria and success indicators  
- **Entities**: Key actors, systems, and components
- **Relationships**: Connections between entities
- **Provenance**: Source text spans for traceability
```

### Implementation Details to Add

Documents describing P1 should mention:
- Uses OpenAI Structured Outputs with JSON Schema enforcement
- Validates provenance with UTF-8 span tracking
- Stores structured data in `metadata.knowledge_ingredients`
- Feature flag: `YARNNN_STRUCTURED_INGREDIENTS`

### Legacy Terminology to Replace

Replace throughout all documents:
- ❌ "structured units" → ✅ "structured knowledge ingredients"
- ❌ "insights from content" → ✅ "goals, constraints, metrics, and entities"
- ❌ "text chunks" → ✅ "data ingredients"
- ❌ "block content" → ✅ "structured knowledge data"

## Frontend Implementation Gap

The frontend currently ignores the structured knowledge completely:
- API route `/api/baskets/[id]/building-blocks/route.ts` doesn't fetch `metadata` field
- Frontend displays `body_md` (legacy text) instead of `metadata.knowledge_ingredients`
- Building blocks page shows text content rather than structured data visualization

This needs to be fixed after documentation alignment.

## Conclusion

The canon documentation needs systematic updates to reflect the "blocks as data ingredients" architecture. The core concept has been implemented in the backend (P1 Substrate Agent v2) but the documentation hasn't caught up, creating confusion between the vision and implementation.

Once documentation is aligned, the frontend implementation can be fixed to actually display and utilize the structured knowledge ingredients that P1 is now extracting.