# YARNNN Substrate vs Artifact Model

**Version**: 1.0.0  
**Status**: Canonical  
**Last Updated**: 2025-01-04

## Core Distinction

YARNNN distinguishes between **Substrates** (the memory itself) and **Artifacts** (expressions derived from memory).

```
SUBSTRATE LAYER          ARTIFACT LAYER
(The Memory)            (The Expressions)
     │                        │
     ├── raw_dumps           ├── documents
     ├── context_blocks      └── reflections
     ├── context_items            
     └── timeline_events          
```

## Definitions

### Substrates (Memory Layer)

**Substrates** are the foundational memory units that capture and structure human thought:

1. **raw_dumps** - Sacred, immutable capture of user input (text, files)
2. **context_blocks** - Structured knowledge ingredients extracted from raw_dumps (goals, constraints, metrics, entities)
3. **context_items** - Semantic connective tissue that links and tags other substrates
4. **timeline_events** - Immutable activity log of all system events

### Artifacts (Expression Layer)

**Artifacts** are computed or composed expressions derived FROM substrates:

1. **documents** - Deliberate narrative compositions that reference substrate + authored prose
2. **reflections** - Computed insights and observations about substrate patterns

## Key Principles

### 1. Unidirectional Flow
```
Substrate → Artifacts (never the reverse)
```
- Artifacts NEVER become substrate for other artifacts
- Reflections analyze substrate, not other reflections
- Documents compose from substrate, not from other documents

### 2. Substrate Characteristics
- **Immutable**: Once created, substrate is never modified (only evolved through new versions)
- **Atomic**: Each substrate unit has independent meaning
- **Referenceable**: Can be linked, tagged, and composed
- **Workspace-scoped**: All substrate belongs to a workspace

### 3. Artifact Characteristics
- **Derived**: Always computed or composed from substrate
- **Mutable**: Can be edited and revised
- **Non-recursive**: Cannot reference other artifacts as source material
- **Ephemeral**: Can be regenerated from substrate

## Metaphors

### Context Blocks as Ingredients
Context blocks are **knowledge ingredients** - structured units that can be combined:
- Goals: "Reduce costs by 30%"
- Constraints: "Maintain 99.9% uptime"
- Metrics: "Response time < 200ms"
- Entities: "Payment Processing System"

### Context Items as Connective Tissue
Context items are **semantic glue** that creates coherence:
- Tags that span multiple blocks
- Themes that emerge across dumps
- Categories that organize substrates
- Relationships between entities

### Documents as Recipes
Documents **compose** substrate ingredients into narratives:
- Select relevant blocks (ingredients)
- Apply context items (seasoning)
- Add authored prose (cooking method)
- Present coherent output (finished dish)

### Reflections as Observations
Reflections **observe** patterns without modifying:
- Notice connections between substrates
- Identify tensions and conflicts
- Recognize emergent themes
- Surface unanswered questions

## Implementation Rules

### Substrate Operations
1. **Creation**: Only through canonical pipelines (P0-P2)
2. **Evolution**: Through versioning and state transitions
3. **Deletion**: Never (only archival/deprecation)
4. **Reference**: Via substrate_id universally

### Artifact Operations
1. **Creation**: Through composition (documents) or computation (reflections)
2. **Modification**: Direct editing allowed
3. **Deletion**: Permitted (substrate remains)
4. **Reference**: Cannot be source for other artifacts

### Pipeline Responsibilities

| Pipeline | Creates | Consumes | Produces |
|----------|---------|----------|----------|
| P0: Capture | raw_dumps | User input | Immutable dumps |
| P1: Extract | context_blocks | raw_dumps | Knowledge ingredients |
| P2: Connect | context_items, relationships | All substrates | Semantic links |
| P3: Reflect | reflections (artifact) | All substrates | Computed insights |
| P4: Present | documents (artifact) | All substrates | Composed narratives |

## Anti-Patterns to Avoid

### 1. Recursive Artifacts
❌ Creating reflections about reflections
❌ Documents that primarily reference other documents
❌ Any artifact-to-artifact dependency

### 2. Substrate Mutation
❌ Editing raw_dumps after creation
❌ Modifying context_blocks directly
❌ Changing timeline events

### 3. Category Confusion
❌ Treating documents as substrate
❌ Storing reflections in substrate tables
❌ Creating "reflection context_items"

## Migration Path

### Current State Issues
- `substrate_type` enum includes 'reflection'
- Documents sometimes treated as substrate
- Reflection tables mixed with substrate tables

### Target State
- Clear substrate vs artifact separation
- Dedicated artifact storage/retrieval
- Clean pipeline boundaries

## Testing Guidelines

### Substrate Tests
- Verify immutability after creation
- Ensure proper state transitions
- Validate workspace scoping
- Check pipeline boundaries

### Artifact Tests
- Verify substrate dependency
- Ensure no artifact recursion
- Validate computation/composition
- Check regeneration capability

## Future Extensions

### Potential New Substrates
- `media_captures`: Images, audio, video as substrate
- `external_references`: Structured links to external content

### Potential New Artifacts
- `visualizations`: Graph/chart representations
- `summaries`: Condensed substrate views
- `reports`: Formatted substrate analyses
- `workflows`: Process definitions from patterns

## Conclusion

This model creates a clean conceptual separation:
- **Substrates** = What we remember (the memory)
- **Artifacts** = What we express (the understanding)

By maintaining this distinction, YARNNN ensures that memory remains pure and expressions remain flexible.