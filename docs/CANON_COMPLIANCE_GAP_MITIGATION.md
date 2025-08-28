# YARNNN Canon Compliance Gap Mitigation Plan

## Executive Summary

Based on comprehensive test suite results, YARNNN has **21/28 canon compliance failures** across critical architectural boundaries. This plan provides a systematic approach to restore canon adherence while maintaining system functionality.

## Gap Analysis by Priority

### 🚨 **Critical Gaps (Priority 1)**

#### **Pipeline Boundary Violations** (7 failures)
- **P0 Capture**: Writing beyond dumps into interpretation
- **P1 Substrate**: Creating relationships during structured unit creation  
- **P2 Graph**: Modifying content while connecting substrates
- **P3 Reflection**: Computing non-read-only operations
- **P4 Presentation**: Creating substrate instead of consuming
- **Timeline Emission**: Pipelines not emitting required events
- **Write Boundaries**: Enforcement mechanisms missing

#### **Workspace Isolation Breakdown** (5 failures)
- **RLS Policies**: Cross-workspace data leakage detected
- **Workspace Resolution**: Multiple workspaces instead of single authoritative
- **Table Enforcement**: RLS not applied to all workspace-scoped tables
- **Search Boundaries**: Filtering ignores workspace scope
- **Timeline Scoping**: Events not properly workspace-isolated

### ⚠️ **High Impact Gaps (Priority 2)**

#### **Substrate Equality Violations** (3 failures)
- **Document Composition**: Not treating all substrate types as peers
- **Composition Stats**: Substrate types weighted differently
- **API Treatment**: Non-uniform handling of substrate types

#### **Timeline Consistency Issues** (6 failures)
- **Mutation Events**: Not all mutations emit timeline events
- **Append-Only**: Timeline allows modifications
- **Format Consistency**: Events don't follow canonical format
- **Composition Events**: Document operations missing timeline events
- **Indexing**: Timeline events not properly queryable
- **Real-time**: Subscription mechanism broken

## Mitigation Strategy

### **Phase 1: Critical Infrastructure (Week 1)**

#### **Day 1-2: Pipeline Boundary Enforcement**
```typescript
// Implementation: Pipeline Write Guards
class PipelineBoundaryGuard {
  static enforceP0Capture(operation: CaptureOperation) {
    if (operation.includes('interpret', 'analyze', 'process')) {
      throw new PipelineBoundaryViolation('P0_CAPTURE_BOUNDARY');
    }
  }
  
  static enforceP1Substrate(operation: SubstrateOperation) {
    if (operation.type === 'CREATE_RELATIONSHIP') {
      throw new PipelineBoundaryViolation('P1_SUBSTRATE_BOUNDARY');
    }
  }
}
```

**Tasks:**
- [ ] Implement pipeline boundary guards in all API routes
- [ ] Add middleware to enforce P0-P4 write restrictions
- [ ] Create timeline event emission triggers
- [ ] Add pipeline violation logging

#### **Day 3-4: Workspace Isolation Hardening**
```sql
-- Implementation: RLS Policy Audit & Fix
-- Ensure ALL workspace-scoped tables have proper RLS
CREATE POLICY workspace_isolation ON baskets 
  FOR ALL USING (workspace_id = current_workspace_id());

CREATE POLICY workspace_isolation ON raw_dumps 
  FOR ALL USING (workspace_id = current_workspace_id());
```

**Tasks:**
- [ ] Audit all workspace-scoped tables for RLS policies
- [ ] Fix workspace resolution to enforce single workspace
- [ ] Add workspace boundary checks to search/filtering
- [ ] Implement timeline event workspace scoping

#### **Day 5: Timeline System Overhaul**
```typescript
// Implementation: Timeline Event System
class CanonicalTimelineEmitter {
  static emit(event: {
    kind: TimelineEventKind,
    basket_id: string,
    payload: Record<string, any>
  }) {
    // Ensure append-only, canonical format
    return TimelineEvent.create({
      ...event,
      created_at: new Date().toISOString(),
      immutable: true
    });
  }
}
```

**Tasks:**
- [ ] Implement mandatory timeline event emission
- [ ] Fix append-only timeline enforcement
- [ ] Standardize timeline event format
- [ ] Add timeline indexing and real-time subscriptions

### **Phase 2: Substrate Equality (Week 2)**

#### **Day 6-8: Substrate Type Parity**
```typescript
// Implementation: Substrate Equality Engine
class SubstrateEqualityEngine {
  static treatAsPeers(substrates: SubstrateReference[]) {
    return substrates.map(substrate => ({
      ...substrate,
      weight: substrate.weight, // No type-based discrimination
      priority: EQUAL_PRIORITY,
      access: UNIFORM_ACCESS
    }));
  }
}
```

**Tasks:**
- [ ] Audit all substrate type handling for bias
- [ ] Implement uniform substrate treatment in document composition
- [ ] Fix composition stats to weight all types equally
- [ ] Standardize API responses for all substrate types

#### **Day 9-10: Document Composition Fixes**
**Tasks:**
- [ ] Rewrite document composition to treat all substrates as peers
- [ ] Fix substrate reference weighting system
- [ ] Update composition statistics calculation
- [ ] Add substrate equality validation tests

### **Phase 3: System Integration (Week 3)**

#### **Day 11-13: Integration Testing**
**Tasks:**
- [ ] Run canon compliance tests after each fix
- [ ] Validate no regressions in core functionality
- [ ] Test end-to-end workflows with canon compliance
- [ ] Update integration test suite

#### **Day 14-15: Documentation & Monitoring**
**Tasks:**
- [ ] Update canon documentation with enforcement mechanisms
- [ ] Add canon compliance monitoring dashboards
- [ ] Create automated canon violation alerts
- [ ] Document mitigation implementation

## Implementation Checklist

### **Pipeline Boundaries**
- [ ] **P0 Capture Guard**: Prevent interpretation in capture pipeline
- [ ] **P1 Substrate Guard**: Block relationship creation during unit creation
- [ ] **P2 Graph Guard**: Prevent content modification in graph pipeline
- [ ] **P3 Reflection Guard**: Enforce read-only reflection computation
- [ ] **P4 Presentation Guard**: Block substrate creation in presentation
- [ ] **Timeline Emission**: Add mandatory event emission to all pipelines
- [ ] **Write Boundary Enforcement**: Implement cross-pipeline write prevention

### **Workspace Isolation**
- [ ] **RLS Audit**: Verify all workspace tables have RLS policies
- [ ] **Single Workspace**: Fix workspace resolution to single authoritative
- [ ] **Cross-Workspace Prevention**: Block all cross-workspace data access
- [ ] **Search Scoping**: Add workspace boundaries to all search operations
- [ ] **Timeline Scoping**: Ensure timeline events are workspace-isolated

### **Substrate Equality**
- [ ] **Peer Treatment**: Remove all substrate type hierarchies
- [ ] **Composition Parity**: Equal weighting in document composition
- [ ] **API Uniformity**: Standardize responses across substrate types
- [ ] **Stats Equality**: Equal treatment in all composition statistics

### **Timeline Consistency**
- [ ] **Mutation Events**: Emit events for all data mutations
- [ ] **Append-Only**: Prevent timeline modifications
- [ ] **Format Standard**: Enforce canonical timeline event format
- [ ] **Composition Events**: Add events for document operations
- [ ] **Indexing**: Proper timeline event indexing
- [ ] **Real-time**: Fix timeline subscription mechanism

## Success Criteria

### **Phase 1 Complete**
- [ ] All 7 pipeline boundary tests passing
- [ ] All 5 workspace isolation tests passing
- [ ] Zero pipeline write violations in production logs
- [ ] Single workspace resolution confirmed

### **Phase 2 Complete**
- [ ] All 3 substrate equality tests passing
- [ ] All 6 timeline consistency tests passing
- [ ] Document composition treats all substrates as peers
- [ ] Timeline system fully append-only and canonical

### **Phase 3 Complete**
- [ ] **28/28 canon compliance tests passing**
- [ ] All integration tests still passing
- [ ] Canon compliance monitoring active
- [ ] Documentation updated with enforcement mechanisms

## Risk Mitigation

### **Breaking Changes**
- **Risk**: Pipeline boundary enforcement may break existing workflows
- **Mitigation**: Phase implementation with feature flags and gradual rollout

### **Performance Impact**
- **Risk**: RLS policy enforcement may slow queries
- **Mitigation**: Add database indexes and query optimization

### **Data Consistency**
- **Risk**: Timeline system changes may affect existing data
- **Mitigation**: Migration scripts and backward compatibility

## Monitoring & Validation

### **Real-time Monitoring**
```typescript
// Canon Compliance Dashboard Metrics
const CANON_METRICS = {
  pipelineBoundaryViolations: 0,
  workspaceIsolationBreaches: 0,
  substrateEqualityViolations: 0,
  timelineConsistencyErrors: 0,
  overallComplianceScore: '28/28 (100%)'
};
```

### **Automated Alerts**
- Pipeline boundary violations
- Cross-workspace data access attempts
- Substrate equality violations
- Timeline consistency errors

## Implementation Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | Critical Infrastructure | Pipeline boundaries + Workspace isolation |
| Week 2 | Substrate Systems | Substrate equality + Timeline consistency |
| Week 3 | Integration | Testing + Documentation + Monitoring |

## Success Metrics

- **Canon Compliance**: 28/28 tests passing (100%)
- **System Stability**: All integration tests still passing
- **Performance**: No degradation in API response times
- **Monitoring**: Real-time canon compliance dashboard active

---

**Next Step**: Begin Phase 1, Day 1 - Pipeline Boundary Enforcement implementation.