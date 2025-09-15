# Future Consideration: Deletion Agent for Substrate Lifecycle

## Commentary for Future Implementation

**IMPORTANT**: The implementation of a deletion agent is intentionally deferred until we have sufficient real-world data and usage statistics to understand substrate lifecycle patterns. We need empirical evidence about:

1. **Substrate Obsolescence Patterns**: How and when substrate becomes outdated or irrelevant
2. **Usage Metrics**: Which substrates are actively referenced vs. dormant
3. **Evolution Patterns**: How often substrates are updated vs. replaced
4. **User Behavior**: How users naturally prune or archive their knowledge

Without this data, premature implementation of deletion logic could result in:
- Overly aggressive pruning that removes valuable historical context
- Overly conservative retention that clutters the substrate space
- Misaligned deletion criteria that don't match real user needs

## Proposed Deletion Agent Conceptual Framework

### Understanding the Need

A deletion agent would handle the natural lifecycle conclusion of substrate elements when they:
- Become factually obsolete (e.g., outdated project status)
- Are fully superseded by newer substrate (complete replacement, not evolution)
- Represent temporary or transient information that has expired
- Contain contradicted or invalidated information
- Have been explicitly marked for removal by users

### Proposed Approach: Soft Deletion with Governance

```typescript
interface DeletionOperation {
  type: "ArchiveBlock" | "ArchiveContextItem" | "ExpireSubstrate"
  reason: "obsolete" | "superseded" | "expired" | "contradicted" | "user_requested"
  target_id: string
  evidence?: {
    superseding_id?: string      // What replaced it
    contradiction_id?: string    // What contradicts it
    expiry_date?: string        // When it expired
    last_referenced?: string    // When last used
  }
  confidence: number  // How sure we are this should be deleted
}
```

### Key Design Principles

1. **Archival Over Deletion**: Never hard delete - move to archived state
   - Preserves audit trail and historical context
   - Allows recovery if deletion was premature
   - Maintains referential integrity

2. **Evidence-Based Decisions**: Deletion must be justified
   - Clear reason codes
   - Supporting evidence (what superseded it, what contradicts it)
   - Confidence scoring

3. **Governance Integration**: All deletions through proposals
   - High-stakes operations require human review
   - Batch related deletions for comprehensive review
   - Clear impact assessment

4. **Lifecycle States for Deletion**:
   ```
   ACTIVE → DEPRECATED → ARCHIVED → PURGED (after retention period)
   ```

### Deletion Triggers and Patterns

1. **Temporal Expiry**:
   - Meeting notes after meeting concludes
   - Sprint planning blocks after sprint ends
   - Deadline reminders after deadline passes

2. **Supersession Chains**:
   - "Q3 Budget: $100k" → "Q3 Budget: $120k (revised)" 
   - Old version becomes DEPRECATED when new version created

3. **Contradiction Resolution**:
   - "Project launches in June" vs "Project delayed to August"
   - Earlier assertion marked as contradicted

4. **Orphaned Substrate**:
   - Context items with no remaining references
   - Blocks disconnected from any active context

### Implementation Considerations

1. **Metrics to Collect Before Implementation**:
   - Average substrate lifespan by type
   - Update frequency patterns
   - Reference/access patterns
   - User-initiated deletion requests
   - Natural obsolescence rates

2. **Safety Mechanisms**:
   - Minimum age before deletion eligibility
   - Protection for highly-referenced substrate
   - Cascade impact analysis
   - Recovery window before permanent purge

3. **User Control**:
   - Explicit "keep forever" marking
   - Deletion preferences per basket
   - Bulk operations with preview

### Why This Matters

As baskets mature and accumulate substrate over months/years, the signal-to-noise ratio will degrade without intelligent lifecycle management. A deletion agent would:

- Maintain substrate quality by removing outdated information
- Reduce cognitive load by archiving irrelevant content  
- Improve performance by managing substrate volume
- Preserve important history while pruning noise

### Next Steps (When Ready)

1. Implement substrate access tracking to gather usage data
2. Add "deprecated" and "archived" states to substrate schema
3. Collect 3-6 months of lifecycle data
4. Design deletion heuristics based on observed patterns
5. Implement as P5 agent (or extend P1) with careful governance

---

**Note**: This is a conceptual proposal for discussion purposes. Actual implementation should be data-driven based on real usage patterns observed over time.

---

## Canon‑Pure Substrate Deletion: Decisions, Flows, and Plan

This section formalizes a canon‑aligned approach to deletion. It reconciles substrate permanence with practical needs for archiving, redaction, and—in exceptional cases—physical deletion. All destructive actions are governance‑first with cascade previews and auditable events.

### 1) Canon Decisions (Final)

- S1 Substrate Immutability: No in‑place edits. Substrates evolve via governance: `ACTIVE → ARCHIVED | REDACTED → PHYSICALLY_DELETED`.
- S2 Artifacts Free To Delete: Documents/reflections are artifacts; delete is allowed without substrate mutation (P4/P3 scope).
- S3 Event Truth: `timeline_events` is append‑only. Redactions are logged as events; no silent deletion.
- S4 No Ghost Deletion: No background deletion without an approved proposal. Every destructive action has a cascade preview and emits events.
- S5 Physical Delete Is Exceptional: Only when workspace policy explicitly allows and retention + health checks pass.
- S6 Workspace‑Scoped Governance: Routing is policy‑driven; confidence informs routing only if policy mode permits (hybrid/confidence).

#### Minimum Tombstone Fields (for ARCHIVED/REDACTED)
- identity: `id`, `substrate_type`, `workspace_id`, `basket_id`
- lifecycle: `created_at`, `archived_or_redacted_at`, `proposed_by`, `approved_by`, `proposal_id`
- mode: `deletion_mode` ('archived'|'redacted'), `redaction_scope` ('full'|'partial'), `redaction_reason`, `legal_hold` (bool)
- cascade_snapshot: `refs_detached_count`, `relationships_pruned_count`, `affected_documents_count`
- retention: `retention_policy_id` (nullable), `earliest_physical_delete_at` (nullable)
- audit: `event_ids` (list of timeline events emitted during the operation)
- privacy: `content_fingerprint` (optional non‑reversible hash)
> Tombstones never include original content; physical delete removes the row when eligible.

#### Default Retention Policy (No Hard Numbers)
- No global defaults; physical delete only under an explicit workspace policy OR a specific “Delete” proposal.
- Archive is the recommended first step; Redact is the privacy fast‑path; Physical Delete is opt‑in and policy‑bound.
- Never auto‑archive or auto‑delete without governance approval.

#### Basket Purge Preconditions (Simple, Git‑like)
- Danger‑zone “Delete All” requires: cascade preview, typed confirmation, Global blast radius in proposal.
- Optional doc version snapshots (recommended), no built‑in export step.

### 2) Operation Taxonomy (Governance Ops)

- Substrate (P1 lifecycle): `ArchiveBlock`, `DeprecateContextItem`, `RedactDump`, `DeleteBlock`, `DeleteContextItem`, `DeleteDump`.
- Artifacts (P3/P4): `DeleteDocument`, `DeleteReflection`.
- Cascade Maintenance (auto‑generated): `DetachReference`, `PruneRelationships`, `VersionDocument` (pre‑detach snapshot).
- Basket‑level: `PurgeBasket { mode: 'archive_all'|'redact_sensitive'|'purge' }`.

### 3) Governance Flow (All Paths)

Selection (user/agent) → Health Check & Cascade Preview → Proposal → Approval → Execution

Execution order:
1. Optional document version snapshots (artifact layer)
2. Detach document references
3. Prune relationships
4. Apply substrate state change (archive/redact/delete)
5. Emit events

Events emitted: `reference.detached`, `rel.pruned`, `doc.versioned` (if used), `substrate.archived|redacted|deleted`, `basket.purged`.

### 4) UI Flows

- Building Blocks: Select → “Archive / Redact / Delete” → preview → governance. Archive is default; Delete requires policy + double confirmation.
- Graph: Node/multi‑select → preview (edges + docs) → governance.
- Basket Settings → Danger Zone: “Delete All” with typed confirmation + cascade preview (no export).

### 5) Retention & Vacuum

- Archive/Redact: immediate on approval; tombstones persisted.
- Physical delete: by explicit proposal OR scheduled vacuum only when a workspace retention policy exists and `earliest_physical_delete_at` has passed, and no hard references remain; emits `substrate.physically_deleted`.
- Compliance fast‑path: Redact now; physical delete later per policy.

### 6) Risks & Mitigations

- Ghost deletion: disallowed (governance + events required).
- Orphaned artifacts: references detach + doc version snapshots before substrate ops.
- Provenance loss: Archive/Redact default; physical delete only with explicit policy/proposal; tombstones preserve provenance.

### 7) Incremental Plan (Refined)

- Phase 0 — Spec Finalization (this doc)
  - Decisions, ops, events, UI flows, retention stance. No numeric defaults in canon.
- Phase 1 — Archive/Redact + Cascade Preview
  - Op schemas; cascade preview generator; FE flows (Blocks/Graph); events; exclude archived/redacted from P2/P3/UI defaults; tombstones persisted.
  - Acceptance: ArchiveBlock/RedactDump proposals run end‑to‑end; correct event emission; hidden from intelligence and default views; tombstones present.
- Phase 2 — Retention & Vacuum
  - Workspace retention toggles; `earliest_physical_delete_at`; vacuum job; compliance fast‑path.
  - Acceptance: Physical delete only by policy or explicit Delete proposal; vacuum respects eligibility; emits `substrate.physically_deleted`.
- Phase 3 — Agent‑Assisted Cleanup
  - P1 Maintenance Agent proposes archive/redact/delete for stale/duplicate/low‑quality items; governance‑first.
- Phase 4 — Basket Purge
  - Danger‑zone flow; typed confirmation; Global blast; optional snapshots; event emission.

### 8) Acceptance (Global)

- Governance‑first: All destructive actions via proposals.
- Immutable audit: Events emitted for each step; tombstones for non‑physical deletes.
- Substrate/artifact separation preserved.
- Cascade preview always shown; execution order prevents orphans.
- Workspace policies are sole authority for routing, validation, and retention.
