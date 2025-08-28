# Agent Setup Audit - Canon Compliance Review

**Date**: 2025-08-28  
**Purpose**: Validate agent implementations against YARNNN Canon v1.4.0  
**Status**: Phase 1.5 Day 1 - Initial Audit

## 🎯 Canon Requirements Summary

According to YARNNN Canon v1.4.0:

### Sacred Principle #4: Agent Intelligence is Mandatory
- Substrate cannot exist without agent interpretation
- Agent processing is required for substrate creation
- Pure Supabase async intelligence model with queue-based processing

### Pipeline Boundaries (P0-P4)
- **P0 Capture**: Only writes dumps, never interprets
- **P1 Substrate**: Create structured units (blocks, context_items) - never relationships/reflections  
- **P2 Graph**: Connect substrates (relationships) - never modifies substrate content
- **P3 Reflection**: Read-only computation, optionally cached
- **P4 Presentation**: Consumes substrate for narrative - never creates substrate

### Processing Model
- Raw dumps auto-trigger agent queue processing via database triggers
- Queue-based async processing ensures canon compliance at scale
- User experience immediate, intelligence processing asynchronous

## 📋 Current Agent Inventory

### Core Processing
1. **AgentQueueProcessor** (`services/agent_queue_processor.py`)
   - ✅ Implements queue-based async processing
   - ✅ Uses existing DumpInterpreterService
   - ⚠️  Includes basic context/relationship extraction (potential boundary violations)

2. **DumpInterpreterService** (`agents/services/dump_interpreter.py`) 
   - ✅ Core P1 Substrate processing (blocks)
   - ✅ Uses BlockProposalService for proper RPC calls
   - ✅ Workspace-scoped operations

### Infrastructure Agents
3. **InfraBasketAnalyzerAgent** (`agents/runtime/infra_basket_analyzer_agent.py`)
   - 🔍 **NEEDS REVIEW**: Complex basket analysis with pattern recognition
   - ❓ **CANON QUESTION**: Does this violate P1/P2/P3 boundaries?

4. **InfraMemoryAnalyzerAgent** (`agents/runtime/infra_memory_analyzer_agent.py`)
   - 🔍 **NEEDS REVIEW**: Memory analysis functionality  

5. **InfraObserverAgent** (`agents/runtime/infra_observer_agent.py`)
   - 🔍 **NEEDS REVIEW**: System observation functionality

6. **TasksDocumentComposerAgent** (`agents/runtime/tasks_document_composer_agent.py`)
   - ✅ Likely P4 Presentation pipeline
   - 🔍 **NEEDS VALIDATION**: Ensure no substrate creation

### Narrative Agents  
7. **IntelligentGuidanceAgent** (`agents/narrative/intelligent_guidance_agent.py`)
   - ✅ User-facing guidance (P4 Presentation)
   - ✅ Consumes technical substrate, produces human guidance

8. **ProjectUnderstandingAgent** (`agents/narrative/project_understanding_agent.py`)
   - ✅ P3 Reflection or P4 Presentation functionality
   - 🔍 **NEEDS VALIDATION**: Read-only operation confirmation

9. **AIAssistantAgent** (`agents/narrative/ai_assistant_agent.py`)
   - 🔍 **NEEDS REVIEW**: General AI assistant functionality

### Support Services
10. **SubstrateOpsService** (`agents/services/substrate_ops.py`)
    - 🔍 **CRITICAL REVIEW NEEDED**: Substrate operations must respect pipeline boundaries

11. **DocumentCompositionService** (`agents/services/document_composition.py`)
    - ✅ P4 Presentation pipeline
    - 🔍 **NEEDS VALIDATION**: Ensure no substrate creation, only consumption

12. **ContextTagger** (`agents/services/context_tagger.py`)
    - ⚠️  **POTENTIAL P1/P2 BOUNDARY ISSUE**: Context tagging spans substrate/graph operations

## 🚨 Immediate Concerns

### 1. Pipeline Boundary Violations
The `AgentQueueProcessor` includes context item extraction AND relationship mapping in the same service:

```python
# TODO: Add context item extraction  
await self._extract_context_items(dump_id, basket_id, workspace_id)

# TODO: Add relationship mapping
await self._map_relationships(dump_id, basket_id, workspace_id)
```

**Canon Violation**: P1 (Substrate) agent doing P2 (Graph) work in same processing cycle.

### 2. Agent Architecture Confusion
Multiple agents appear to overlap in functionality:
- Infrastructure agents vs Narrative agents unclear separation
- Runtime agents vs Services unclear distinction  
- Some agents may be implementing multiple pipeline responsibilities

### 3. Missing Canon-Compliant Agent Definitions
Agents lack clear pipeline assignments:
- No explicit P0, P1, P2, P3, P4 classifications
- No validation of pipeline boundary enforcement
- Agent prompts/definitions not aligned with canon principles

## 💡 Recommended Actions

### Phase 1.5 Day 2: Canon Compliance Review
1. **Classify all agents by pipeline**: Assign each agent to P0, P1, P2, P3, or P4
2. **Validate boundary enforcement**: Ensure agents don't cross pipeline boundaries
3. **Review agent prompts**: Align with canon principles and pipeline restrictions

### Phase 1.5 Day 3: Optimization & Sunset
1. **Identify redundant agents**: Consolidate overlapping functionality
2. **Sunset unnecessary agents**: Remove agents that violate canon or aren't needed  
3. **Document canonical agent setup**: Clear agent responsibilities and boundaries

### Critical Fixes Needed
1. **Separate P1/P2 processing**: Context extraction (P1) and relationship mapping (P2) must be separate agents
2. **Validate substrate operations**: SubstrateOpsService must respect pipeline boundaries
3. **Clarify agent hierarchy**: Infrastructure vs Runtime vs Narrative agent roles

## 🎯 Success Criteria
- All agents clearly assigned to single pipeline (P0-P4)
- No pipeline boundary violations in agent code
- Agent prompts aligned with canon principles  
- Redundant/non-canon agents sunset
- Clear documentation of optimal agent setup

---

**Next**: Phase 1.5 Day 2 - Deep review of each agent for canon compliance