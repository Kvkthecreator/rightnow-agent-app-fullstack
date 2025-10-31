# Artifact Types and Handling

**Complete Catalog of Work Artifacts and Processing Rules**

**Version**: 4.0
**Date**: 2025-10-31
**Status**: ✅ Canonical
**Layer**: 2 (Work Orchestration)
**Category**: Feature Specification

---

## 🎯 Overview

Work artifacts are agent-generated outputs awaiting user approval. This document catalogs all artifact types, their structure, validation rules, and how they're processed after approval.

**Key Concepts**:
- Artifacts represent agent work before it impacts substrate
- Each artifact type has specific content schema and substrate mapping
- Risk assessment varies by artifact type
- Approved artifacts → substrate entities (blocks, documents, etc.)

---

## 📦 Artifact Types

### Type Catalog

```typescript
type ArtifactType =
  | 'block_proposal'              // New block for substrate
  | 'block_update_proposal'       // Update/supersede existing block
  | 'block_lock_proposal'         // Lock block (finalize)
  | 'document_creation'           // New composed document
  | 'document_update'             // Update existing document
  | 'insight'                     // Analysis/observation (no substrate impact)
  | 'external_deliverable'        // Output for external use (no substrate impact)
  | 'relationship_proposal'       // New relationship between blocks
  | 'entity_extraction'           // Extracted entities for tagging
```

---

## 1️⃣ Block Proposal

### Purpose
Propose a new block to be added to substrate after approval.

### Content Schema

```typescript
interface BlockProposalContent {
  block_content: {
    text: string                  // Main content
    entities?: string[]           // Extracted entities
    tags?: string[]               // User-defined tags
    metadata?: Record<string, any>
  }
  block_type: string              // note | research_finding | preference | etc.

  // Optional: Relationships to existing blocks
  related_blocks?: Array<{
    target_block_id: UUID
    relationship_type: string     // causal | temporal | semantic | etc.
    confidence: number
  }>
}
```

### Example

```json
{
  "artifact_type": "block_proposal",
  "content": {
    "block_content": {
      "text": "Mem (YC W22) charges $8/month for individuals, $15/month for teams. Approximately 50K users as of Q2 2024.",
      "entities": ["Mem", "YC W22", "pricing"],
      "tags": ["competitor", "pricing"],
      "metadata": {
        "source_url": "https://mem.ai/pricing",
        "verified_date": "2025-01-15"
      }
    },
    "block_type": "research_finding"
  },
  "agent_confidence": 0.95,
  "agent_reasoning": "Pricing verified from official website. User count from Crunchbase.",
  "source_context_ids": []
}
```

### Approval Processing

```python
async def apply_block_proposal(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Create block in substrate (ACCEPTED state)
    """

    # 1. Create block
    block_id = await db.blocks.create(
        workspace_id=session.workspace_id,
        basket_id=session.basket_id,
        content=artifact.content['block_content'],
        block_type=artifact.content.get('block_type', 'note'),
        state='ACCEPTED',  # Direct to ACCEPTED (work already reviewed)
        metadata={
            'work_session_id': str(session.id),
            'work_artifact_id': str(artifact.id),
            'agent_confidence': artifact.agent_confidence,
            'created_by_agent': session.executed_by_agent_id,
            'approved_by_user': str(user_id)
        },
        created_by=user_id,
        created_at=datetime.utcnow()
    )

    # 2. Generate embedding for semantic search
    embedding = await embedding_service.embed_text(
        artifact.content['block_content']['text']
    )
    await db.blocks.update(block_id, embedding=embedding)

    # 3. Create relationships (if specified)
    if 'related_blocks' in artifact.content:
        for rel in artifact.content['related_blocks']:
            await db.substrate_relationships.create(
                source_block_id=block_id,
                target_block_id=rel['target_block_id'],
                relationship_type=rel['relationship_type'],
                confidence=rel['confidence']
            )

    # 4. Link artifact → block
    await db.work_artifacts.update(
        artifact.id,
        becomes_block_id=block_id,
        status='applied_to_substrate'
    )

    return block_id
```

### Risk Assessment

**Base Risk**: Medium (adding new knowledge)

**Risk Modifiers**:
- High confidence (>0.9) → Decrease risk by 1
- Novel topic (no similar blocks) → Increase risk by 1
- Many relationships (>5) → Increase risk by 1

---

## 2️⃣ Block Update Proposal

### Purpose
Propose updating/superseding an existing block with new information.

### Content Schema

```typescript
interface BlockUpdateProposalContent {
  supersedes_block_id: UUID       // Existing block to replace
  new_content: {
    text: string
    entities?: string[]
    tags?: string[]
    metadata?: Record<string, any>
  }
  supersession_reason: string     // Why update is needed
  changes_summary: string         // Human-readable summary of changes
}
```

### Example

```json
{
  "artifact_type": "block_update_proposal",
  "content": {
    "supersedes_block_id": "block-uuid-123",
    "new_content": {
      "text": "Mem now charges $10/month for individuals (increased from $8), $20/month for teams. Approximately 75K users as of Q4 2024.",
      "entities": ["Mem", "pricing"],
      "tags": ["competitor", "pricing"]
    },
    "supersession_reason": "Pricing changed as of 2025-01",
    "changes_summary": "Updated pricing: individuals $8→$10, teams $15→$20. Updated user count: 50K→75K."
  },
  "agent_confidence": 0.92,
  "agent_reasoning": "New pricing confirmed on official website and Twitter announcement.",
  "source_context_ids": ["block-uuid-123"]
}
```

### Approval Processing

```python
async def apply_block_update_proposal(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Supersede existing block with new version
    """

    old_block_id = artifact.content['supersedes_block_id']

    # 1. Create new block (supersedes old one)
    new_block_id = await db.blocks.supersede(
        old_block_id=old_block_id,
        new_content=artifact.content['new_content'],
        supersession_reason=artifact.content['supersession_reason'],
        created_by=user_id,
        metadata={
            'work_session_id': str(session.id),
            'work_artifact_id': str(artifact.id),
            'changes_summary': artifact.content['changes_summary']
        }
    )

    # 2. Old block state → SUPERSEDED
    await db.blocks.update(
        old_block_id,
        state='SUPERSEDED',
        superseded_by=new_block_id,
        superseded_at=datetime.utcnow()
    )

    # 3. Generate new embedding
    embedding = await embedding_service.embed_text(
        artifact.content['new_content']['text']
    )
    await db.blocks.update(new_block_id, embedding=embedding)

    # 4. Link artifact → new block
    await db.work_artifacts.update(
        artifact.id,
        becomes_block_id=new_block_id,
        supersedes_block_id=old_block_id,
        status='applied_to_substrate'
    )

    return new_block_id
```

### Risk Assessment

**Base Risk**: High (replacing existing knowledge)

**Risk Modifiers**:
- Contradicts existing content → Increase risk by 2
- Extends/updates existing content → No change
- High confidence (>0.9) → Decrease risk by 1

---

## 3️⃣ Block Lock Proposal

### Purpose
Propose locking a block (marking as finalized/canonical).

### Content Schema

```typescript
interface BlockLockProposalContent {
  block_id: UUID
  lock_reason: string             // Why this block should be locked
  lock_type: 'canonical' | 'deprecated' | 'archived'
}
```

### Example

```json
{
  "artifact_type": "block_lock_proposal",
  "content": {
    "block_id": "block-uuid-456",
    "lock_reason": "Company strategy finalized in Q4 planning, should not change",
    "lock_type": "canonical"
  },
  "agent_confidence": 0.85,
  "agent_reasoning": "Referenced in 5+ other documents, appears to be foundational decision",
  "source_context_ids": ["block-uuid-456"]
}
```

### Approval Processing

```python
async def apply_block_lock_proposal(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Lock block (prevent further modifications)
    """

    block_id = artifact.content['block_id']

    # 1. Update block state
    await db.blocks.update(
        block_id,
        locked=True,
        locked_at=datetime.utcnow(),
        locked_by=user_id,
        lock_reason=artifact.content['lock_reason'],
        lock_type=artifact.content['lock_type']
    )

    # 2. Link artifact
    await db.work_artifacts.update(
        artifact.id,
        becomes_block_id=block_id,
        status='applied_to_substrate'
    )

    return block_id
```

### Risk Assessment

**Base Risk**: High (restricting future changes)

---

## 4️⃣ Document Creation

### Purpose
Propose creating a new document (composition of blocks/inline content).

### Content Schema

```typescript
interface DocumentCreationContent {
  title: string
  document_type: string           // composition | research_report | meeting_notes | etc.
  content_blocks: Array<{
    type: 'block_reference' | 'inline_content' | 'heading' | 'divider'

    // For block_reference
    block_id?: UUID

    // For inline_content
    inline_content?: {
      text: string
      format?: 'markdown' | 'plain'
    }

    // For heading
    heading_text?: string
    heading_level?: number        // 1-6

    sequence_order: number
  }>
  metadata?: Record<string, any>
}
```

### Example

```json
{
  "artifact_type": "document_creation",
  "content": {
    "title": "AI Memory Space Competitive Analysis",
    "document_type": "research_report",
    "content_blocks": [
      {
        "type": "heading",
        "heading_text": "Competitive Landscape",
        "heading_level": 1,
        "sequence_order": 1
      },
      {
        "type": "inline_content",
        "inline_content": {
          "text": "The AI memory space has 5 key competitors as of Q4 2024:",
          "format": "markdown"
        },
        "sequence_order": 2
      },
      {
        "type": "block_reference",
        "block_id": "block-uuid-mem",
        "sequence_order": 3
      },
      {
        "type": "block_reference",
        "block_id": "block-uuid-rewind",
        "sequence_order": 4
      }
    ],
    "metadata": {
      "research_date": "2025-01-15",
      "agent_analysis": true
    }
  },
  "agent_confidence": 0.88,
  "agent_reasoning": "Synthesized from individual competitor research findings",
  "source_context_ids": ["block-uuid-mem", "block-uuid-rewind"]
}
```

### Approval Processing

```python
async def apply_document_creation(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Create document with blocks/inline content
    """

    # 1. Create document record
    doc_id = await db.documents.create(
        workspace_id=session.workspace_id,
        basket_id=session.basket_id,
        title=artifact.content['title'],
        document_type=artifact.content['document_type'],
        metadata={
            'work_session_id': str(session.id),
            'work_artifact_id': str(artifact.id),
            **artifact.content.get('metadata', {})
        },
        created_by=user_id
    )

    # 2. Process content blocks
    for block_spec in artifact.content['content_blocks']:
        if block_spec['type'] == 'block_reference':
            # Link existing block
            await db.document_blocks.create(
                document_id=doc_id,
                block_id=block_spec['block_id'],
                sequence_order=block_spec['sequence_order']
            )
        elif block_spec['type'] == 'inline_content':
            # Create inline block
            inline_block_id = await db.blocks.create(
                workspace_id=session.workspace_id,
                basket_id=session.basket_id,
                content=block_spec['inline_content'],
                block_type='inline',
                state='ACCEPTED',
                created_by=user_id
            )
            await db.document_blocks.create(
                document_id=doc_id,
                block_id=inline_block_id,
                sequence_order=block_spec['sequence_order']
            )
        elif block_spec['type'] == 'heading':
            # Create heading block
            heading_block_id = await db.blocks.create(
                workspace_id=session.workspace_id,
                basket_id=session.basket_id,
                content={
                    'text': block_spec['heading_text'],
                    'level': block_spec['heading_level']
                },
                block_type='heading',
                state='ACCEPTED',
                created_by=user_id
            )
            await db.document_blocks.create(
                document_id=doc_id,
                block_id=heading_block_id,
                sequence_order=block_spec['sequence_order']
            )

    # 3. Link artifact → document
    await db.work_artifacts.update(
        artifact.id,
        creates_document_id=doc_id,
        status='applied_to_substrate'
    )

    return doc_id
```

### Risk Assessment

**Base Risk**: Low (composition, no new facts)

---

## 5️⃣ Document Update

### Purpose
Propose updating an existing document (add/remove/reorder blocks).

### Content Schema

```typescript
interface DocumentUpdateContent {
  document_id: UUID
  update_type: 'add_blocks' | 'remove_blocks' | 'reorder_blocks' | 'update_metadata'

  // For add_blocks
  blocks_to_add?: Array<{
    block_id?: UUID
    inline_content?: { text: string }
    sequence_order: number
  }>

  // For remove_blocks
  blocks_to_remove?: UUID[]

  // For reorder_blocks
  new_sequence?: Record<UUID, number>  // block_id → new order

  // For update_metadata
  metadata_updates?: Record<string, any>

  update_reason: string
}
```

### Risk Assessment

**Base Risk**: Medium (modifying existing composition)

---

## 6️⃣ Insight

### Purpose
Agent observation/analysis that doesn't create substrate entities (informational only).

### Content Schema

```typescript
interface InsightContent {
  insight_type: string            // observation | analysis | recommendation | warning
  title: string
  description: string
  supporting_evidence?: Array<{
    block_id: UUID
    relevance: string
  }>
  actionable_items?: string[]
}
```

### Example

```json
{
  "artifact_type": "insight",
  "content": {
    "insight_type": "observation",
    "title": "Pricing Trend Analysis",
    "description": "All 3 major competitors increased pricing by 15-25% in Q4 2024. This suggests market maturation and willingness to pay.",
    "supporting_evidence": [
      {
        "block_id": "block-uuid-mem",
        "relevance": "Mem increased $8→$10 (25%)"
      },
      {
        "block_id": "block-uuid-rewind",
        "relevance": "Rewind increased $20→$25 (25%)"
      }
    ],
    "actionable_items": [
      "Consider similar pricing adjustment",
      "Monitor competitor churn rates"
    ]
  },
  "agent_confidence": 0.90,
  "agent_reasoning": "Clear trend across multiple competitors in same time period",
  "source_context_ids": ["block-uuid-mem", "block-uuid-rewind"]
}
```

### Approval Processing

```python
async def apply_insight(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Insight approved but no substrate impact
    """

    # Simply mark as approved (no substrate mutation)
    await db.work_artifacts.update(
        artifact.id,
        status='approved'  # NOT applied_to_substrate
    )

    # User may choose to create block from insight later
    return artifact.id
```

### Risk Assessment

**Base Risk**: Low (no substrate impact)

---

## 7️⃣ External Deliverable

### Purpose
Output intended for external use (email, report, presentation, etc.).

### Content Schema

```typescript
interface ExternalDeliverableContent {
  deliverable_type: string        // email | report | presentation | social_post | etc.
  format: string                  // markdown | html | pdf | plaintext
  content: string
  intended_recipient?: string
  metadata?: Record<string, any>
}
```

### Example

```json
{
  "artifact_type": "external_deliverable",
  "content": {
    "deliverable_type": "email",
    "format": "markdown",
    "content": "Hi [Name],\n\nBased on our competitive analysis...",
    "intended_recipient": "sales@example.com",
    "metadata": {
      "subject": "Competitive Intelligence Update",
      "cc": ["team@example.com"]
    }
  },
  "agent_confidence": 0.87,
  "agent_reasoning": "Synthesized from approved research findings",
  "source_context_ids": ["doc-uuid-research-report"]
}
```

### Approval Processing

```python
async def apply_external_deliverable(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    External deliverable approved but no substrate impact
    """

    # Mark as approved (no substrate mutation)
    await db.work_artifacts.update(
        artifact.id,
        status='approved'
    )

    # User downloads/sends deliverable externally
    return artifact.id
```

### Risk Assessment

**Base Risk**: Low (no substrate impact, but external visibility)

---

## 8️⃣ Relationship Proposal

### Purpose
Propose new relationship between existing blocks.

### Content Schema

```typescript
interface RelationshipProposalContent {
  source_block_id: UUID
  target_block_id: UUID
  relationship_type: string       // causal | temporal | semantic | contradiction | etc.
  confidence: number              // 0-1
  reasoning: string
  bidirectional?: boolean
}
```

### Example

```json
{
  "artifact_type": "relationship_proposal",
  "content": {
    "source_block_id": "block-uuid-strategy",
    "target_block_id": "block-uuid-pricing",
    "relationship_type": "causal",
    "confidence": 0.88,
    "reasoning": "Strategy decision directly led to pricing change",
    "bidirectional": false
  },
  "agent_confidence": 0.88,
  "agent_reasoning": "Clear temporal and causal link between events",
  "source_context_ids": ["block-uuid-strategy", "block-uuid-pricing"]
}
```

### Approval Processing

```python
async def apply_relationship_proposal(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Create relationship between blocks
    """

    content = artifact.content

    # 1. Create relationship
    rel_id = await db.substrate_relationships.create(
        source_block_id=content['source_block_id'],
        target_block_id=content['target_block_id'],
        relationship_type=content['relationship_type'],
        confidence=content['confidence'],
        metadata={
            'work_artifact_id': str(artifact.id),
            'reasoning': content['reasoning']
        },
        created_by=user_id
    )

    # 2. Create reverse relationship (if bidirectional)
    if content.get('bidirectional'):
        await db.substrate_relationships.create(
            source_block_id=content['target_block_id'],
            target_block_id=content['source_block_id'],
            relationship_type=content['relationship_type'],
            confidence=content['confidence'],
            created_by=user_id
        )

    # 3. Link artifact
    await db.work_artifacts.update(
        artifact.id,
        status='applied_to_substrate'
    )

    return rel_id
```

### Risk Assessment

**Base Risk**: Low (enhancing existing knowledge graph)

---

## 9️⃣ Entity Extraction

### Purpose
Propose entity tags for existing blocks.

### Content Schema

```typescript
interface EntityExtractionContent {
  block_id: UUID
  entities: Array<{
    entity_text: string
    entity_type: string           // person | organization | location | concept | etc.
    confidence: number
  }>
  extraction_method: string       // llm | rule_based | hybrid
}
```

### Approval Processing

```python
async def apply_entity_extraction(
    artifact: WorkArtifact,
    session: WorkSession,
    user_id: UUID
) -> UUID:
    """
    Add entities to block metadata
    """

    block_id = artifact.content['block_id']
    entities = artifact.content['entities']

    # 1. Update block with entities
    await db.blocks.update(
        block_id,
        metadata={
            **await db.blocks.get_metadata(block_id),
            'entities': [e['entity_text'] for e in entities],
            'entity_details': entities
        }
    )

    # 2. Link artifact
    await db.work_artifacts.update(
        artifact.id,
        becomes_block_id=block_id,
        status='applied_to_substrate'
    )

    return block_id
```

### Risk Assessment

**Base Risk**: Low (metadata enhancement)

---

## 📋 Common Artifact Fields

All artifacts share these base fields:

```typescript
interface WorkArtifact {
  // Identity
  id: UUID
  work_session_id: UUID

  // Type and content
  artifact_type: ArtifactType
  content: Record<string, any>    // Type-specific schema

  // Agent metadata
  agent_confidence?: number       // 0-1
  agent_reasoning?: string
  source_context_ids: UUID[]      // Blocks used for reasoning

  // Governance
  status: ArtifactStatus
  risk_level?: RiskLevel

  // Substrate linkage (after approval)
  becomes_block_id?: UUID
  supersedes_block_id?: UUID
  creates_document_id?: UUID

  // Timestamps
  created_at: ISO8601
}

type ArtifactStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'applied_to_substrate'
  | 'cancelled'
```

---

## ✅ Validation Rules

### Content Validation

Each artifact type has specific validation rules:

```python
class ArtifactValidator:
    async def validate_artifact(
        self,
        artifact_type: ArtifactType,
        content: dict
    ) -> ValidationResult:
        """
        Validate artifact content against schema
        """

        if artifact_type == 'block_proposal':
            return await self._validate_block_proposal(content)
        elif artifact_type == 'block_update_proposal':
            return await self._validate_block_update_proposal(content)
        # ... etc

    async def _validate_block_proposal(self, content: dict) -> ValidationResult:
        errors = []

        # Required fields
        if 'block_content' not in content:
            errors.append("Missing required field: block_content")
        elif 'text' not in content['block_content']:
            errors.append("Missing required field: block_content.text")

        # Text length
        if len(content['block_content'].get('text', '')) < 10:
            errors.append("block_content.text must be at least 10 characters")

        # Block type
        if 'block_type' in content:
            valid_types = ['note', 'research_finding', 'preference', 'decision', 'task']
            if content['block_type'] not in valid_types:
                errors.append(f"Invalid block_type: {content['block_type']}")

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors
        )
```

---

## 🔄 Artifact Processing Pipeline

### Complete Flow

```
1. Agent creates artifact (status: draft)
   ↓
2. Risk assessment calculated
   ↓
3. Artifact status → pending_review
   ↓
4. User reviews work session
   ↓
5. User makes per-artifact decision:
   - apply_to_substrate → Process artifact → Substrate entity
   - approve_only → Mark approved (no substrate impact)
   - reject → Mark rejected
   - defer → Review later
   ↓
6. Artifact status → applied_to_substrate | approved | rejected
   ↓
7. Link artifact → substrate entity (provenance)
```

### Batch Processing

```python
async def process_approved_artifacts(
    session: WorkSession,
    artifacts: List[WorkArtifact],
    artifact_decisions: Dict[UUID, ArtifactDecision],
    user_id: UUID
) -> SubstrateChangesSummary:
    """
    Process multiple artifacts in transaction
    """

    substrate_changes = SubstrateChangesSummary(
        blocksCreated=[],
        blocksUpdated=[],
        documentsCreated=[]
    )

    async with db.transaction():
        for artifact in artifacts:
            decision = artifact_decisions.get(artifact.id, 'defer')

            if decision == 'apply_to_substrate':
                if artifact.artifact_type == 'block_proposal':
                    block_id = await apply_block_proposal(artifact, session, user_id)
                    substrate_changes.blocksCreated.append(block_id)

                elif artifact.artifact_type == 'block_update_proposal':
                    block_id = await apply_block_update_proposal(artifact, session, user_id)
                    substrate_changes.blocksUpdated.append(block_id)

                elif artifact.artifact_type == 'document_creation':
                    doc_id = await apply_document_creation(artifact, session, user_id)
                    substrate_changes.documentsCreated.append(doc_id)

                # Record mutation in audit trail
                await db.work_context_mutations.create(
                    work_session_id=session.id,
                    work_artifact_id=artifact.id,
                    mutation_type=f"{artifact.artifact_type}_applied",
                    applied_by=user_id
                )

            elif decision == 'approve_only':
                await db.work_artifacts.update(artifact.id, status='approved')

            elif decision == 'reject':
                await db.work_artifacts.update(artifact.id, status='rejected')

    return substrate_changes
```

---

## 📊 Metrics

### Artifact Metrics by Type

```typescript
interface ArtifactTypeMetrics {
  artifactType: ArtifactType
  totalCreated: number
  approvalRate: number
  avgConfidence: number
  avgRiskLevel: number

  // Substrate impact
  totalAppliedToSubstrate: number
  avgProcessingTimeSeconds: number
}
```

---

## 📎 See Also

- [WORK_SESSION_LIFECYCLE.md](./WORK_SESSION_LIFECYCLE.md) - Session states
- [RISK_ASSESSMENT.md](../governance/RISK_ASSESSMENT.md) - Risk calculation
- [YARNNN_UNIFIED_GOVERNANCE.md](../../architecture/YARNNN_UNIFIED_GOVERNANCE.md) - Governance layer
- [YARNNN_DATA_FLOW_V4.md](../../architecture/YARNNN_DATA_FLOW_V4.md) - End-to-end flows

---

**9 artifact types. Each with schema, validation, processing. From agent output to substrate entity.**
