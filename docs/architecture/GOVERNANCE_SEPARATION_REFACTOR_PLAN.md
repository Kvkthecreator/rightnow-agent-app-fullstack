# Governance Separation Refactoring Plan

**Purpose**: Separate substrate governance (substrate-api) from work-platform governance
**Status**: ⚠️ DRAFT - Ready for Review
**Date**: 2025-11-05
**Priority**: HIGH - Architectural clarity

---

## 🔍 Executive Summary

The codebase currently has **TWO CONFLICTING GOVERNANCE MODELS** that need to be cleanly separated:

1. **Substrate Governance (P0-P4 in substrate-api)** - Memory integrity, deduplication, block lifecycle
2. **Work-Platform Governance (work-platform)** - Agent work quality, task completion, deliverable approval

**Root Cause**: Architecture evolved from v3.1 (substrate-only) to v4.0 (unified work+substrate) but both systems remain partially implemented, creating confusion and overlapping concerns.

**Solution**: Harden the separation - each governance system operates independently with clear boundaries.

---

## 📊 Current State Assessment

### SUBSTRATE GOVERNANCE (substrate-api) ✅ MOSTLY CORRECT

**Location**: `substrate-api/api/src/app/agents/pipeline/governance_processor.py`

**Tables**:
```sql
proposals (
  id, basket_id, workspace_id,
  proposal_kind ('Extraction', 'Edit', 'Merge', ...),
  ops jsonb,  -- substrate operations
  status ('PROPOSED', 'APPROVED', 'REJECTED'),
  provenance jsonb,  -- raw_dump ids
  validator_report jsonb
)

blocks (
  id, basket_id, workspace_id,
  content, block_type,
  state ('PROVISIONAL', 'PROPOSED', 'ACTIVE', 'DEPRECATED'),
  proposal_id  -- Links to proposal that created it
)

context_items (
  id, basket_id,
  state ('PROVISIONAL', 'PROPOSED', 'ACTIVE', 'DEPRECATED'),
  proposal_id  -- Links to proposal that created it
)
```

**Purpose**:
- P1 agent extracts substrate from raw_dumps
- Creates proposals with block/context_item operations
- User/system approves proposals
- Approved ops create substrate in ACTIVE state

**Scope**: Memory integrity decisions
- Is this a duplicate block?
- Should these blocks be merged?
- Is this block high quality?
- Should this block be elevated to workspace scope?

**Governance Questions**:
- ✅ "Is this extracted substrate correct?"
- ✅ "Should we merge these duplicate blocks?"
- ✅ "Is this block quality good enough?"

---

### WORK-PLATFORM GOVERNANCE (work-platform) ⚠️ PARTIALLY IMPLEMENTED

**Location**: `work-platform/api/src/app/governance/unified_approval.py`

**Tables**:
```sql
work_sessions (
  id, workspace_id, basket_id,
  task_intent, task_type,
  executed_by_agent_id,
  status ('initialized', 'in_progress', 'awaiting_final_approval', 'approved', 'rejected'),
  approval_strategy ('checkpoint_required', 'final_only', 'auto_approve_low_risk'),
  artifacts_count, substrate_mutations_count
)

work_artifacts (
  id, work_session_id,
  artifact_type ('block_proposal', 'block_update', 'document_creation', 'insight', 'external_deliverable'),
  content jsonb,
  becomes_block_id,  -- ⚠️ DIRECT LINK TO BLOCKS (bypasses proposals?)
  creates_document_id,
  agent_confidence, agent_reasoning,
  status ('draft', 'pending_review', 'approved', 'applied_to_substrate'),
  risk_level ('low', 'medium', 'high')
)

work_checkpoints (
  id, work_session_id,
  checkpoint_type ('plan_approval', 'mid_work_review', 'final_approval'),
  status ('pending', 'approved', 'rejected')
)

work_context_mutations (
  id, work_session_id, work_artifact_id,
  mutation_type ('block_created', 'block_updated', 'document_created'),
  substrate_type, substrate_id
)
```

**Purpose**:
- Track agent work session lifecycle
- Create work artifacts (agent outputs)
- Multi-checkpoint approval workflow
- Apply approved artifacts to substrate

**Scope**: Work quality decisions
- Is the agent's work good?
- Did the agent complete the task correctly?
- Are these insights valuable?
- Should I provide feedback for refinement?

**Governance Questions**:
- ✅ "Did the agent complete the task well?"
- ✅ "Are these deliverables valuable?"
- ⚠️ "Should this update the knowledge base?" (OVERLAPS with substrate governance!)

---

## 🚨 CRITICAL CONFLICTS IDENTIFIED

### Conflict 1: Dual Substrate Creation Paths

**Problem**: TWO ways to create blocks exist simultaneously:

```python
# Path A: Substrate governance (substrate-api)
raw_dump → P1 agent → proposal → approval → blocks (state: ACTIVE)

# Path B: Work governance (work-platform)
work_session → work_artifact → unified approval → blocks (state: ACCEPTED?)
```

**Evidence**:
- `work_artifacts.becomes_block_id` directly references `blocks.id`
- `unified_approval.py` appears to create blocks WITHOUT going through proposals
- Canon v3.1 says "ALL substrate mutations via proposals"
- Governance Philosophy v4 says "Work artifacts → substrate (bypassing proposals)"

**Impact**:
- ❌ Inconsistent block creation (some via proposals, some direct)
- ❌ Unclear which governance system owns substrate integrity
- ❌ Potential duplicate blocks (no semantic dedup in work path?)

---

### Conflict 2: Overlapping Governance Questions

**Problem**: Both systems ask about substrate quality

```yaml
Substrate Governance asks:
  - "Is this extracted block high quality?" ✅ CORRECT
  - "Is this a duplicate?" ✅ CORRECT

Work Governance asks:
  - "Is this good agent work?" ✅ CORRECT
  - "Should this become substrate?" ⚠️ OVERLAPS WITH SUBSTRATE GOVERNANCE
```

**The Issue**: "Should artifact become substrate?" is BOTH:
- A work quality question (did agent do good work?)
- A substrate integrity question (is this block a duplicate? high quality?)

**Current v4 unified approach**: User answers once → both handled
**Problem**: Loses substrate-specific validation (P1 semantic dedup, quality checks)

---

### Conflict 3: Documentation Contradicts Itself

**YARNNN_CANON.md v3.1** (Line 31-48):
```markdown
**GOVERNED (Substrate Layer - Memory):**
- `blocks` mutations (P1 - via proposals, all semantic_types)

**INDEPENDENT (Artifact Layer - Expression):**
- **P3 Insights** - Direct regeneration from substrate state
- **P4 Documents** - Direct composition from P3 + substrate

**P3/P4 Governance Boundary**:
- Regeneration is **DIRECT** (not governed proposals)
```

**YARNNN_GOVERNANCE_PHILOSOPHY_V4.md** (Line 13-19):
```markdown
**Governance in YARNNN v4.0 spans TWO concerns in a SINGLE approval**:

1. **Work Quality** - Is the agent's work good?
2. **Context Integrity** - Should this update the knowledge base?

**The Key Insight**: These are not separate questions.
```

**YARNNN_UNIFIED_GOVERNANCE.md** (Line 342):
```python
# CRITICAL: Work already reviewed → Block goes to ACCEPTED state directly
# v3.1: Block proposal → PROPOSED → User reviews proposal → ACCEPTED
# v4.0: Artifact reviewed → Block created in ACCEPTED state
```

**Contradiction**:
- Canon v3.1: Substrate mutations via proposals ONLY
- Governance v4: Work approval creates blocks DIRECTLY (bypassing proposals)

---

## ✅ RECOMMENDED SEPARATION ARCHITECTURE

### Principle: Two Independent Governance Layers

```
┌─────────────────────────────────────────────────────────┐
│ WORK-PLATFORM GOVERNANCE (Layer 3)                      │
│ Concern: Work quality, task completion, deliverables    │
│                                                          │
│ Question: "Did the agent do good work?"                 │
│                                                          │
│ Input: work_session + work_artifacts                    │
│ Output: Approved artifacts (NOT substrate yet)          │
│ Decision: approve/reject/iterate work                   │
└─────────────────────────────────────────────────────────┘
                         ↓ (approved artifacts)
                         ↓
┌─────────────────────────────────────────────────────────┐
│ SUBSTRATE GOVERNANCE (P1 in substrate-api)              │
│ Concern: Memory integrity, deduplication, quality       │
│                                                          │
│ Question: "Should this become substrate?"               │
│                                                          │
│ Input: approved artifacts (as provenance)               │
│ Output: proposals → blocks/context_items                │
│ Decision: create/merge/reject based on semantic dedup   │
└─────────────────────────────────────────────────────────┘
```

### Bridge Layer: Work Artifacts → Substrate Proposals

**New component**: `WorkToSubstrateBridge` (in work-platform)

```python
class WorkToSubstrateBridge:
    """
    Converts approved work artifacts into substrate proposals.

    This is the ONLY connection point between work governance
    and substrate governance.
    """

    async def submit_approved_artifacts_to_substrate(
        self,
        work_session: WorkSession,
        approved_artifacts: List[WorkArtifact]
    ) -> List[UUID]:  # Returns proposal IDs
        """
        After work governance approves artifacts,
        submit them to substrate governance as proposals.

        Flow:
        1. Work-platform: User approves work artifacts
        2. Bridge: Convert artifacts → substrate proposals
        3. Substrate-api: P1 governance evaluates proposals
           - Semantic dedup check
           - Quality validation
           - Merge detection
        4. Substrate-api: Creates blocks (or merges with existing)
        5. Bridge: Update work_context_mutations with results
        """

        proposal_ids = []

        for artifact in approved_artifacts:
            if artifact.artifact_type == 'block_proposal':
                # Create substrate proposal (NOT direct block)
                proposal_id = await self.substrate_client.create_proposal(
                    basket_id=work_session.basket_id,
                    workspace_id=work_session.workspace_id,
                    ops=[{
                        'type': 'CreateBlock',
                        'content': artifact.content,
                        'confidence': artifact.agent_confidence
                    }],
                    provenance=[artifact.id],  # Link back to work artifact
                    origin='agent',
                    metadata={
                        'source': 'work_artifact',
                        'work_session_id': str(work_session.id),
                        'work_artifact_id': str(artifact.id)
                    }
                )

                proposal_ids.append(proposal_id)

        # Substrate governance takes over from here
        # P1 will run semantic dedup, quality checks, etc.

        return proposal_ids
```

---

## 📋 REFACTORING PLAN

### Phase 1: Harden Substrate Governance (No Changes) ✅

**Goal**: Confirm substrate governance is working as intended

**Actions**:
- ✅ Document current P1 proposal flow
- ✅ Confirm semantic dedup is working
- ✅ Validate blocks can only be created via proposals
- ✅ Ensure RLS policies prevent direct block mutations

**Success Criteria**:
- All blocks created via `proposals` table
- P1 governance validates every substrate mutation
- No direct block creation outside proposals

---

### Phase 2: Refactor Work Governance (Remove Direct Substrate Access) 🔄

**Goal**: Work governance ONLY manages work quality, not substrate

**Changes Needed**:

#### 2.1: Remove Direct Block Creation from work_artifacts

**Current (WRONG)**:
```sql
work_artifacts (
  becomes_block_id uuid REFERENCES blocks(id),  -- ❌ DIRECT LINK
  creates_document_id uuid REFERENCES documents(id)  -- ❌ DIRECT LINK
)
```

**Fixed**:
```sql
work_artifacts (
  -- Remove direct substrate links
  -- becomes_block_id  -- REMOVED
  -- creates_document_id  -- REMOVED

  -- Add proposal tracking instead
  substrate_proposal_id uuid REFERENCES proposals(id),  -- ✅ Links to proposal
  proposal_status text  -- Track: 'submitted', 'approved', 'rejected'
)
```

#### 2.2: Update UnifiedApprovalOrchestrator

**Current (WRONG)**:
```python
async def _handle_approval(artifacts):
    # Creates blocks DIRECTLY ❌
    block_id = await self.db.blocks.create(
        content=artifact.content,
        state='ACCEPTED'  # Bypasses proposal governance!
    )
```

**Fixed**:
```python
async def _handle_approval(artifacts):
    # Submit to substrate governance instead ✅
    proposal_ids = await self.substrate_bridge.submit_approved_artifacts(
        work_session, approved_artifacts
    )

    # Wait for substrate governance to process proposals
    # (Can be async with notifications)
    return proposal_ids
```

#### 2.3: Create WorkToSubstrateBridge

**New file**: `work-platform/api/src/app/integrations/substrate_bridge.py`

```python
class WorkToSubstrateBridge:
    """
    Converts work artifacts → substrate proposals.

    This is the ONLY integration point between work governance
    and substrate governance.
    """

    def __init__(self, substrate_client: SubstrateAPIClient):
        self.substrate = substrate_client

    async def submit_approved_artifacts(
        self,
        work_session: WorkSession,
        artifacts: List[WorkArtifact]
    ) -> Dict[UUID, UUID]:  # artifact_id → proposal_id
        """
        Convert approved work artifacts into substrate proposals.

        Returns mapping of artifact_id → proposal_id for tracking.
        """

        mapping = {}

        for artifact in artifacts:
            proposal_id = await self._create_proposal_for_artifact(
                artifact, work_session
            )

            # Update artifact with proposal link
            await self.db.work_artifacts.update(
                artifact.id,
                substrate_proposal_id=proposal_id,
                proposal_status='submitted'
            )

            mapping[artifact.id] = proposal_id

        return mapping

    async def check_proposal_status(
        self,
        artifact_id: UUID
    ) -> ProposalStatus:
        """
        Check if substrate proposal was approved/rejected.

        Used to update work_context_mutations after
        substrate governance completes.
        """
        artifact = await self.db.work_artifacts.get(artifact_id)
        proposal = await self.substrate.get_proposal(
            artifact.substrate_proposal_id
        )

        if proposal.status == 'APPROVED':
            # Find which block was created
            block_id = await self._find_created_block(proposal)

            # Record substrate mutation
            await self.db.work_context_mutations.create(
                work_session_id=artifact.work_session_id,
                work_artifact_id=artifact.id,
                mutation_type='block_created',
                substrate_id=block_id
            )

            return ProposalStatus.APPROVED

        elif proposal.status == 'REJECTED':
            # Artifact was good work, but substrate governance rejected
            # (e.g., duplicate detected, low quality)
            return ProposalStatus.REJECTED

        else:
            return ProposalStatus.PENDING
```

---

### Phase 3: Update Documentation (Resolve Contradictions) 📝

**Goal**: Canon documents reflect separated governance

#### 3.1: Update YARNNN_CANON.md v3.2

**Add section**:
```markdown
## 🔗 Work-Platform Integration (v4.0)

**Work governance is SEPARATE from substrate governance.**

### Work → Substrate Flow

1. **Work-Platform**: Agent completes work → creates work_artifacts
2. **Work Governance**: User reviews work quality → approves artifacts
3. **Bridge**: Approved artifacts → submitted as substrate proposals
4. **Substrate Governance**: P1 evaluates proposals (semantic dedup, quality)
5. **Substrate**: Approved proposals → blocks created (or merged with existing)
6. **Notification**: Work-platform notified of substrate mutations

### Key Separation

**Work Governance asks**: "Is this good agent work?"
**Substrate Governance asks**: "Should this become substrate?"

These are DIFFERENT questions requiring DIFFERENT validation:
- Work governance: Task completion, deliverable quality, agent reasoning
- Substrate governance: Memory integrity, deduplication, semantic quality

**Both are required. Work approval does NOT guarantee substrate creation.**

Example: Agent research is excellent (work approved) but findings duplicate
existing blocks (substrate governance merges instead of creating new).
```

#### 3.2: Update YARNNN_GOVERNANCE_PHILOSOPHY_V4.md

**Revise misleading section** (Line 13-19):
```markdown
**Governance in YARNNN v4.0 has TWO LAYERS**:

1. **Work Quality Governance** (work-platform) - Is the agent's work good?
2. **Substrate Integrity Governance** (substrate-api) - Should this become memory?

**The Key Insight**: These are SEPARATE questions requiring different validation.

**Work approval enables substrate submission, but substrate governance
independently validates memory integrity (dedup, quality, merge detection).**
```

**Add clarity to "Unified" meaning**:
```markdown
## "Unified" Refers to User Experience, Not Architecture

**User Experience**: One approval action → Multiple downstream effects

**Under the Hood**: Two independent governance systems
- Work governance validates task completion
- Substrate governance validates memory integrity
- Both must pass for substrate creation

**Benefit**: User doesn't manage proposals manually, but rigorous
validation still occurs at both layers automatically.
```

---

### Phase 4: Schema Changes 🗄️

**Migration**: `20251106_separate_work_substrate_governance.sql`

```sql
-- Step 1: Add proposal tracking to work_artifacts
ALTER TABLE work_artifacts
ADD COLUMN substrate_proposal_id uuid REFERENCES proposals(id),
ADD COLUMN proposal_status text CHECK (proposal_status IN ('not_submitted', 'submitted', 'approved', 'rejected', 'merged'));

-- Step 2: Backfill existing work_artifacts with proposal links (if any exist)
-- (Manual review needed to map existing becomes_block_id to proposals)

-- Step 3: Remove direct substrate links (after migration)
-- ALTER TABLE work_artifacts DROP COLUMN becomes_block_id;
-- ALTER TABLE work_artifacts DROP COLUMN creates_document_id;
-- (Keep for now as read-only legacy tracking)

-- Step 4: Update work_context_mutations to link via proposals
ALTER TABLE work_context_mutations
ADD COLUMN substrate_proposal_id uuid REFERENCES proposals(id);

-- Step 5: Add provenance tracking in proposals for work artifacts
-- (Already exists via provenance jsonb column, just document usage)

COMMENT ON COLUMN work_artifacts.substrate_proposal_id IS
'Links to substrate proposal created from this artifact. Substrate governance independently validates.';

COMMENT ON COLUMN work_artifacts.proposal_status IS
'Status of substrate proposal: not_submitted (work not approved yet), submitted (awaiting substrate governance), approved (block created), rejected (substrate governance rejected), merged (duplicatemerged with existing)';
```

---

### Phase 5: API Changes 🔌

#### 5.1: Work-Platform API

**Remove direct substrate creation**:
```python
# REMOVE: Direct block creation
# POST /api/work/artifacts/{id}/apply-to-substrate  ❌

# ADD: Substrate proposal submission
POST /api/work/sessions/{id}/submit-to-substrate  ✅
```

**New endpoint**:
```python
@router.post("/{session_id}/submit-to-substrate")
async def submit_approved_work_to_substrate(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user)
):
    """
    Submit approved work artifacts to substrate governance.

    This creates substrate proposals that will be independently
    evaluated by P1 governance (semantic dedup, quality checks).

    Returns:
        proposal_ids: List of created proposal IDs
        status: 'submitted' (substrate governance processing)
    """

    session = await get_work_session(session_id)

    if session.status != 'approved':
        raise HTTPException(
            status_code=400,
            detail="Work must be approved before substrate submission"
        )

    # Get approved artifacts
    artifacts = await get_approved_artifacts(session_id)

    # Submit to substrate via bridge
    proposal_ids = await substrate_bridge.submit_approved_artifacts(
        session, artifacts
    )

    return {
        "proposal_ids": proposal_ids,
        "status": "submitted",
        "message": f"Created {len(proposal_ids)} substrate proposals. "
                   f"Substrate governance will validate and create blocks."
    }
```

#### 5.2: Substrate-API Enhancement

**Add work artifact provenance**:
```python
@router.post("/proposals")
async def create_proposal(
    proposal: ProposalCreate,
    metadata: Optional[Dict] = None
):
    """
    Create substrate proposal.

    Can be from:
    - P1 agent (raw_dump extraction)
    - Work-platform (approved work artifacts)
    - User manual edit

    All go through same governance validation.
    """

    # Standard P1 governance applies
    # - Semantic dedup
    # - Quality validation
    # - Merge detection

    # If from work artifact, link for provenance
    if metadata and metadata.get('source') == 'work_artifact':
        proposal.metadata['work_session_id'] = metadata['work_session_id']
        proposal.metadata['work_artifact_id'] = metadata['work_artifact_id']

    return await governance_processor.create_proposal(proposal)
```

---

## 🎯 SUCCESS CRITERIA

### After Refactoring, These Must Be True:

1. ✅ **Clear Separation**: Work governance and substrate governance have zero overlapping concerns
2. ✅ **Single Path**: ALL blocks created via `proposals` table (no exceptions)
3. ✅ **Provenance**: Every block traces to either:
   - P1 proposal (from raw_dump extraction), OR
   - P1 proposal (from approved work artifact)
4. ✅ **Semantic Dedup**: Even work artifacts go through P1 semantic duplicate detection
5. ✅ **Independent Validation**: Work can be approved but substrate governance can still reject/merge
6. ✅ **Documentation Clarity**: No contradictions between canon documents
7. ✅ **Bridge Layer Only**: work-platform→substrate-api integration via ONE bridge component
8. ✅ **RLS Enforcement**: Database policies prevent direct block creation outside proposals

---

## 📊 MIGRATION STRATEGY

### Rollout Phases

**Week 1: Non-Breaking Additions**
- ✅ Add `substrate_proposal_id` to `work_artifacts` (nullable)
- ✅ Create `WorkToSubstrateBridge` component
- ✅ Add `/submit-to-substrate` endpoint
- ✅ Update documentation

**Week 2: Dual-Mode Operation**
- ⚠️ Support BOTH paths temporarily:
  - Old: work artifacts → direct blocks (deprecated)
  - New: work artifacts → proposals → blocks (preferred)
- ✅ Log all operations to identify usage patterns
- ✅ Test bridge with real work sessions

**Week 3: Migration**
- 🔄 Migrate existing `work_artifacts.becomes_block_id` to proposals
- 🔄 Backfill `work_context_mutations` with proposal links
- 🔄 Update all work governance routes to use bridge

**Week 4: Deprecation**
- ❌ Remove direct block creation from work-platform
- ❌ Drop `work_artifacts.becomes_block_id` column (after safety period)
- ✅ Update RLS to enforce proposal-only path

---

## 🚦 RISK ASSESSMENT

### Low Risk ✅
- Adding new columns/tables
- Creating bridge component
- Documentation updates
- New API endpoints

### Medium Risk ⚠️
- Changing work approval flow (existing sessions affected)
- Removing direct block creation (need migration)
- Schema changes to work_artifacts

### High Risk 🚨
- Dropping becomes_block_id column (need provenance preserved)
- Changing RLS policies (could break existing features)
- Modifying substrate governance (currently working)

### Mitigation
- Feature flags for dual-mode operation
- Comprehensive testing of bridge
- Rollback plan for schema changes
- Monitoring for broken workflows

---

## 📎 FILES TO CHANGE

### Substrate-API (Minimal Changes)
- ✅ `src/app/agents/pipeline/governance_processor.py` - Add work artifact provenance tracking
- ✅ `src/app/routes/proposals.py` - Accept work artifacts as source

### Work-Platform (Major Changes)
- 🔄 `src/app/governance/unified_approval.py` - Remove direct block creation, use bridge
- 🔄 `src/app/work/models/work_artifact.py` - Add proposal tracking fields
- ✅ `src/app/integrations/substrate_bridge.py` - NEW: Bridge component
- 🔄 `src/app/routes/work_review.py` - Update approval flow
- ✅ `src/app/routes/work_substrate.py` - NEW: Substrate submission endpoint

### Database
- ✅ `supabase/migrations/20251106_separate_work_substrate_governance.sql` - NEW

### Documentation
- 🔄 `docs/YARNNN_CANON.md` - Add work-platform integration section
- 🔄 `docs/canon/YARNNN_GOVERNANCE_PHILOSOPHY_V4.md` - Clarify "unified" meaning
- 🔄 `docs/architecture/YARNNN_UNIFIED_GOVERNANCE.md` - Update to reflect separation
- ✅ `docs/architecture/WORK_SUBSTRATE_BRIDGE.md` - NEW: Bridge architecture

---

## 💬 OPEN QUESTIONS FOR DISCUSSION

1. **Auto-Approval**: Should approved work artifacts auto-create proposals, or require explicit submission?
   - Option A: Approval → automatic proposal submission (seamless)
   - Option B: Approval → manual "submit to substrate" step (explicit)

2. **Feedback Loop**: If substrate governance rejects a work artifact (e.g., duplicate detected), how does user know?
   - Notification to user?
   - Update work session status?
   - Show in work review UI?

3. **Timeline Events**: Should substrate mutations from work show as:
   - "Block created from work session X", OR
   - "Proposal approved" (standard substrate event)?

4. **Performance**: Bridge adds latency (work approval → proposal → substrate). Acceptable?
   - Can be async with notifications
   - Or synchronous with progress indicator

5. **Legacy Data**: How to handle existing work_artifacts with becomes_block_id?
   - Backfill proposals retroactively?
   - Mark as "legacy" and preserve read-only?

---

## ✅ RECOMMENDATION

**Proceed with refactoring in 4-week phased rollout.**

**Priority**: HIGH - Current architecture is confusing and creates maintenance burden

**Benefit**:
- Clear separation of concerns
- Maintains semantic dedup for ALL substrate creation
- Preserves substrate integrity guarantees
- Removes documentation contradictions
- Enables independent scaling of governance layers

**Cost**:
- ~2-3 weeks engineering time
- Migration complexity (medium)
- Risk of breaking existing work sessions (mitigated by dual-mode)

**User Impact**:
- Minimal (mostly backend refactoring)
- Slightly more transparent (can see substrate proposals from work)
- Better feedback when substrate governance detects duplicates

---

**Status**: ⚠️ Ready for review and approval
**Next Step**: Discuss open questions, then begin Phase 1

