# YARNNN Substrate Pipeline Clarification

## 🎯 Core Pipeline Flow (P0 → P1)

### P0: Capture Phase
**Purpose**: Capture all user inputs as immutable raw_dumps without interpretation

```
User Input Types:
- Text → raw_dump (body_md)
- PDF → raw_dump (file_url + extracted text in body_md)  
- Image → raw_dump (file_url + OCR/description in body_md)
- Multiple inputs in one session → Multiple raw_dumps (linked by batch_id)

Result: Collection of unstructured raw_dumps
```

### P1: Extract & Structure Phase  
**Purpose**: Agent digests raw_dumps and proposes substrate creation

```
Input: Collection of raw_dumps (may be batched)
↓
Agent Processing:
1. Read all related raw_dumps collectively
2. Extract semantic meaning from the whole
3. Create proposal with operations
↓
Output: Proposal containing operations to create substrate
```

## 📋 Proposal Structure

A proposal is an **unapplied changeset** (like an uncommitted git commit) containing:

```typescript
interface Proposal {
  id: uuid
  ops: Operation[]  // The substrate changes to apply
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED'
  origin: 'agent' | 'human'
  provenance: uuid[]  // Source raw_dump IDs
}
```

### Operation Types

P1 should create operations for BOTH blocks and context_items:

```typescript
// Block creation - for coherent chunks of content
{
  operation_type: "CreateBlock",
  content: "Extracted meaningful content...",
  semantic_type: "insight" | "fact" | "plan" | "reflection",
  title: "Optional title",
  confidence: 0.8
}

// Context item creation - for entities, concepts, themes
{
  operation_type: "CreateContextItem", 
  label: "Project Alpha",
  item_type: "project" | "person" | "concept" | "goal",
  synonyms: ["Alpha Project", "α"],
  confidence: 0.9
}
```

## 🔄 The Approval → Execution Flow

```
1. Proposal Created (status: PROPOSED)
   - Contains operations but NO substrate exists yet
   
2. Approval Decision
   - Agent proposals: Should auto-approve if high confidence?
   - Human review: Manual approval required?
   
3. Execution (status: APPROVED → EXECUTED)
   - Operations applied atomically
   - Blocks created in blocks table
   - Context items created in context_items table
   - Timeline events emitted
   
4. Substrate Now Exists
   - P2 can create relationships
   - P3 can create reflections
```

## ❌ Current Issues

1. **P1 Agent Problems**:
   - Not reading actual dump content (using hardcoded data)
   - Creating malformed operations (wrong schema)
   - Low quality extractions

2. **Pipeline Confusion**:
   - Canon says P1 creates "blocks only", P2 creates "context_items"
   - But logically P1 should extract BOTH from raw content
   - P2 should create relationships between existing items

3. **Execution Gap**:
   - Proposals created but stuck in PROPOSED state
   - No automatic approval for agent proposals
   - Operations never executed → No substrate created

## ✅ Correct P1 Behavior

Given raw dumps containing:
```
"This is a test dump for substrate scaffolding. It contains multiple 
concepts: project management, strategic planning, team collaboration."
```

P1 should create a proposal with:
```json
{
  "ops": [
    {
      "operation_type": "CreateBlock",
      "content": "This is a test dump for substrate scaffolding...",
      "semantic_type": "description",
      "confidence": 0.8
    },
    {
      "operation_type": "CreateContextItem",
      "label": "substrate scaffolding",
      "item_type": "concept",
      "confidence": 0.9
    },
    {
      "operation_type": "CreateContextItem", 
      "label": "project management",
      "item_type": "domain",
      "confidence": 0.85
    }
  ]
}
```

## 📝 Canon Updates Needed

1. Clarify that P1 creates BOTH blocks and context_items
2. Specify when agent proposals should auto-approve
3. Document the execution mechanism for approved proposals
4. Clarify P2's role as creating relationships, not context_items