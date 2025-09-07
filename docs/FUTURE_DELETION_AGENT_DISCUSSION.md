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