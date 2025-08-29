# Adapter Layer Strategy v1.4.0: Stable Core, Swappable Lenses

**Version**: 1.4.0  
**Status**: Strategic Architecture Document  
**Purpose**: Define the adapter layer approach for sustainable dual GTM strategy while preserving the canonical service core

---

## 🎯 Strategic Vision

**"Stable Core, Swappable Lenses"**

Build presentation adapters on top of the hardened canonical service architecture, enabling multiple user experiences (B2C consumer vs B2B enterprise) while maintaining a single, battle-tested backend.

## 🧠 The Adapter Layer Philosophy

### Core Principle: Backend as Context Graph Service

The Supabase backend serves as a **Context Graph Service** - a durable, agent-processed substrate that different presentation layers can adapt for their specific user needs.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION ADAPTERS                        │
├─────────────────────────────────────────────────────────────────┤
│  B2C Consumer   │ B2B Enterprise  │ API/SDK       │ Future       │
│  Lens           │ Lens            │ Lens          │ Lens         │
│  =============  │ =============== │ ============  │ ============ │
│  • Personal     │ • Team collab   │ • Developer   │ • Mobile     │
│    memory       │ • Admin panels  │   tools       │ • Voice      │
│  • Simple UI    │ • Analytics     │ • Webhooks    │ • AR/VR      │
│  • Consumer     │ • Compliance    │ • Bulk ops    │ • IoT        │
│    workflows    │ • Enterprise    │               │              │
│                 │   workflows     │               │              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   ADAPTER LAYER   │
                          │   (Translation &  │
                          │   Orchestration)  │
                          └─────────┬─────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                 CANONICAL SERVICE CORE                          │
├─────────────────────────────────────────────────────────────────┤
│                    Context Graph Service                        │
│                    ==================                          │
│  P0: Capture    │ P1: Substrate  │ P2: Graph     │ P3: Reflection│
│  Agent          │ Agent          │ Agent         │ Agent         │
│  • raw_dumps    │ • blocks       │ • context     │ • reflections │
│                 │ • context_items│   _relationships│              │
│                 │                │               │               │
│             SUPABASE DATABASE + RPC LAYER                      │
│           (Single source of truth for all adapters)            │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ Architectural Layers

### Layer 1: Canonical Service Core (Immutable)

**Purpose**: Durable context graph with agent intelligence
**Technology**: Supabase + Pure Agent Architecture 
**Responsibilities**:
- Memory capture (P0 Agent)
- Substrate creation (P1 Agent) 
- Relationship mapping (P2 Agent)
- Insight computation (P3 Agent)
- Workspace isolation
- Data durability

**Immutability Guarantee**: This layer NEVER changes based on presentation needs. It serves canonical truth.

### Layer 2: Adapter Layer (Translating & Orchestrating)

**Purpose**: Bridge canonical services to presentation needs
**Technology**: Service-specific APIs + Business Logic
**Responsibilities**:
- Data transformation for different user models
- Workflow orchestration for different user journeys
- Access control adaptation for different security models
- Performance optimization for different scale needs
- Integration patterns for different technical requirements

### Layer 3: Presentation Lenses (Swappable)

**Purpose**: User-specific experiences on canonical foundation
**Technology**: Framework-agnostic (React, mobile, CLI, etc.)
**Responsibilities**:
- User interface design for specific audiences
- User experience patterns for specific workflows
- Branding and visual identity per market
- Device-specific optimizations
- Channel-specific integrations

## 🔄 The Adapter Pattern

### 1. B2C Consumer Lens Adapter

**Target User**: Individual knowledge workers
**Use Cases**: Personal memory, research, writing, learning
**Adapter Responsibilities**:

```typescript
// B2C Consumer Adapter
class ConsumerMemoryAdapter {
  constructor(private contextGraph: ContextGraphService) {}
  
  // Simplified memory interface for consumers
  async getPersonalInsights(userId: string): Promise<ConsumerInsight[]> {
    const reflections = await this.contextGraph.getReflections(userId);
    
    // Transform P3 agent insights into consumer-friendly format
    return reflections.map(r => ({
      title: r.reflection_text.split('.')[0], // Simple title extraction
      description: r.reflection_text,
      tags: this.extractSimpleTags(r.metadata),
      readingTime: this.estimateReadingTime(r.reflection_text),
      personalRelevance: r.confidence_score,
    }));
  }
  
  // Consumer-optimized workflows
  async captureThought(thought: string): Promise<void> {
    // Use canonical write path but optimize UX for consumers
    await this.contextGraph.captureMemory({
      content: thought,
      type: 'personal_note',
      privacy: 'private'
    });
  }
}
```

### 2. B2B Enterprise Lens Adapter  

**Target User**: Teams, organizations, compliance-driven environments
**Use Cases**: Team knowledge, compliance, audit trails, analytics
**Adapter Responsibilities**:

```typescript
// B2B Enterprise Adapter
class EnterpriseMemoryAdapter {
  constructor(private contextGraph: ContextGraphService) {}
  
  // Enterprise-focused memory interface
  async getTeamKnowledgeGraph(workspaceId: string): Promise<EnterpriseGraph> {
    const [blocks, relationships, timeline] = await Promise.all([
      this.contextGraph.getBlocks(workspaceId),
      this.contextGraph.getRelationships(workspaceId), 
      this.contextGraph.getTimeline(workspaceId)
    ]);
    
    // Transform canonical data for enterprise needs
    return {
      knowledgeAssets: blocks.map(b => ({
        id: b.id,
        content: b.body_md,
        semanticType: b.semantic_type,
        confidence: b.confidence_score,
        creator: b.created_by,
        auditTrail: this.buildAuditTrail(b, timeline),
        complianceMetadata: this.extractComplianceData(b.metadata)
      })),
      relationships: relationships.map(r => ({
        source: r.from_id,
        target: r.to_id,
        strength: r.strength,
        type: r.relationship_type,
        discoveredBy: r.processing_agent,
        discoveredAt: r.created_at
      })),
      teamAnalytics: this.computeTeamAnalytics(blocks, relationships, timeline)
    };
  }
  
  // Enterprise workflows with compliance
  async captureTeamKnowledge(content: TeamContent): Promise<AuditedResult> {
    const result = await this.contextGraph.captureMemory({
      content: content.text,
      type: 'team_knowledge',
      workspace_id: content.workspaceId,
      metadata: {
        compliance_level: content.complianceLevel,
        retention_policy: content.retentionPolicy,
        access_controls: content.accessControls
      }
    });
    
    // Return with enterprise audit metadata
    return {
      captureId: result.id,
      auditId: this.generateAuditId(),
      complianceStatus: 'pending_review',
      retentionDate: this.calculateRetentionDate(content.retentionPolicy),
      accessLog: []
    };
  }
}
```

### 3. API/SDK Lens Adapter

**Target User**: Developers, integrations, third-party tools
**Use Cases**: Custom applications, data export, automation
**Adapter Responsibilities**:

```typescript
// Developer API Adapter
class APIAdapter {
  constructor(private contextGraph: ContextGraphService) {}
  
  // RESTful API interface
  async GET_memories(params: APIQueryParams): Promise<APIResponse<Memory[]>> {
    const canonicalData = await this.contextGraph.getProjection(
      params.workspace_id,
      {
        limit: params.limit || 50,
        cursor: params.cursor,
        filters: params.filters
      }
    );
    
    // Transform to standardized API format
    return {
      data: canonicalData.memories.map(m => ({
        id: m.id,
        type: m.substrate_type,
        content: m.content,
        created_at: m.created_at,
        confidence: m.confidence_score,
        relationships: m.relationships?.map(r => r.id) || [],
        metadata: this.sanitizeMetadata(m.metadata)
      })),
      pagination: {
        next_cursor: canonicalData.next_cursor,
        has_more: canonicalData.has_more,
        total_count: canonicalData.total_count
      },
      meta: {
        request_id: params.request_id,
        processing_time_ms: canonicalData.processing_time_ms,
        api_version: '1.4.0'
      }
    };
  }
  
  // Webhook integration patterns
  async setupWebhook(config: WebhookConfig): Promise<WebhookSetup> {
    // Register webhook for canonical timeline events
    return await this.contextGraph.registerEventCallback({
      workspace_id: config.workspace_id,
      event_types: config.event_types,
      callback_url: config.callback_url,
      secret: config.secret,
      delivery_options: {
        retry_count: config.max_retries || 3,
        timeout_ms: config.timeout_ms || 30000
      }
    });
  }
}
```

## 🎯 Why Backend Must Be Context Graph Service

### 1. Prevents Execution Drift

**Problem**: Different presentation needs lead to divergent backend implementations
**Solution**: Single canonical service ensures consistent agent processing

```typescript
// ❌ DRIFT PATTERN - Different backends for different users
class B2CBackend {
  async captureThought(thought: string) {
    // Simple capture logic for consumers
    return this.simpleStorage.store(thought);
  }
}

class B2BBackend {  
  async captureKnowledge(knowledge: TeamKnowledge) {
    // Complex enterprise logic
    return this.enterpriseProcessor.process(knowledge);
  }
}

// ✅ CANONICAL PATTERN - Single backend, adapter presentation
class ContextGraphService {
  async captureMemory(memory: CanonicalMemory) {
    // Same P0→P1→P2→P3 processing for all users
    return this.canonicalAgentPipeline.process(memory);
  }
}
```

### 2. Ensures Data Consistency

**Single Source of Truth**: All adapters read from same canonical substrate
**Agent Processing**: All users benefit from same intelligent processing
**Schema Stability**: Presentation changes don't affect data model

### 3. Enables Cross-Lens Features

**Seamless Migration**: Users can switch lenses without data loss
**Collaboration**: B2C and B2B users can share workspaces
**Analytics**: Unified metrics across all user types

## 🚧 Implementation Strategy

### Phase 2: Adapter Layer Implementation (Current Goal)

**Step 1: Extract Current Frontend Logic**
```typescript
// Current: Tightly coupled presentation
async function getTimelineEvents(basketId: string) {
  const events = await fetch(`/api/baskets/${basketId}/timeline`);
  return events; // Direct API usage
}

// Target: Adapter-mediated presentation  
class ConsumerTimelineAdapter {
  async getPersonalTimeline(basketId: string): Promise<ConsumerEvent[]> {
    const canonicalEvents = await this.contextGraph.getTimeline(basketId);
    
    // Transform for consumer presentation
    return canonicalEvents.map(e => ({
      title: e.description || this.generateSimpleTitle(e.event_type),
      time: this.formatRelativeTime(e.created_at),
      icon: this.getConsumerIcon(e.event_type),
      category: this.mapToConsumerCategory(e.event_type),
      agentAttribution: e.processing_agent ? `by ${e.processing_agent}` : null
    }));
  }
}
```

**Step 2: Build Adapter Infrastructure**
- Create adapter base classes
- Implement common transformation utilities
- Build adapter registration system
- Create adapter testing patterns

**Step 3: Implement B2C Consumer Adapter**
- Personal memory interface
- Simplified workflows  
- Consumer-friendly terminology
- Mobile-optimized patterns

**Step 4: Plan B2B Enterprise Adapter**  
- Team collaboration features
- Enterprise security controls
- Compliance audit trails
- Advanced analytics

### Phase 3: Multi-Lens Deployment

**Step 1: Parallel Lens Development**
- B2C consumer experience
- B2B enterprise dashboard
- Developer API layer
- Mobile applications

**Step 2: Adapter Optimization**
- Performance profiling per lens
- Caching strategies per user type
- Load balancing across adapters
- Monitoring per presentation layer

## 📋 Future Scaffolding Guidelines

### For New Presentation Lenses

**Always Start With**:
1. **Canonical Service Analysis**: What canonical data do you need?
2. **User Journey Mapping**: How does this lens serve users differently?
3. **Adapter Design**: What transformations are needed?
4. **Presentation Layer**: How should this data appear to users?
5. **Canon Compliance**: Does this preserve agent intelligence?

**Never Do**:
- ❌ Modify canonical service for presentation needs
- ❌ Create presentation-specific data models
- ❌ Bypass agent processing for speed
- ❌ Add client-side intelligence
- ❌ Break workspace isolation

### Adapter Development Patterns

```typescript
// Standard Adapter Interface
interface LensAdapter<TPresentation, TCanonical> {
  // Transform canonical data for presentation
  transform(canonical: TCanonical): TPresentation;
  
  // Handle presentation-specific workflows
  orchestrate(workflow: WorkflowDefinition): Promise<WorkflowResult>;
  
  // Map user actions to canonical operations
  mapUserAction(action: UserAction): CanonicalOperation[];
  
  // Handle presentation-specific error states
  handleError(error: CanonicalError): PresentationError;
}

// Example Implementation
class MobileLensAdapter implements LensAdapter<MobileMemory, CanonicalMemory> {
  transform(canonical: CanonicalMemory): MobileMemory {
    return {
      id: canonical.id,
      summary: this.createMobileSummary(canonical),
      swipeActions: this.createSwipeActions(canonical),
      voiceMetadata: this.extractVoiceMetadata(canonical),
      offlineCapability: this.assessOfflineCapability(canonical)
    };
  }
  
  orchestrate(workflow: WorkflowDefinition): Promise<WorkflowResult> {
    // Mobile-specific orchestration (offline queueing, push notifications, etc.)
    return this.mobileWorkflowEngine.execute(workflow);
  }
}
```

## ⚠️ Anti-Patterns & Violations

### ❌ Backend Modification for Presentation (Major Violation)

```typescript
// ❌ NEVER DO THIS - modifying canonical service for UI needs
class CanonicalService {
  async getBlocks(basketId: string, uiMode: 'consumer' | 'enterprise') {
    if (uiMode === 'consumer') {
      return this.getSimplifiedBlocks(basketId); // UI-driven logic
    }
    return this.getFullBlocks(basketId);
  }
}

// ✅ CORRECT - adapter handles presentation needs
class CanonicalService {
  async getBlocks(basketId: string): Promise<CanonicalBlock[]> {
    return this.canonicalBlockService.getBlocks(basketId); // Same for all
  }
}

class ConsumerAdapter {
  async getBlocks(basketId: string): Promise<ConsumerBlock[]> {
    const canonical = await this.service.getBlocks(basketId);
    return canonical.map(b => this.transformForConsumer(b)); // Adapter transforms
  }
}
```

### ❌ Presentation-Specific Data Models (Schema Violation)

```typescript
// ❌ NEVER DO THIS - different schemas per presentation
CREATE TABLE consumer_memories (...);  -- UI-specific tables
CREATE TABLE enterprise_memories (...);

// ✅ CORRECT - single canonical schema, adapter transforms
CREATE TABLE memories (...);  -- Single canonical table

class ConsumerAdapter {
  transformMemory(canonical: CanonicalMemory): ConsumerMemory {
    // Transform in adapter layer
  }
}
```

## 📊 Success Metrics

### Architectural Health

- **Schema Stability**: Zero canonical schema changes for presentation needs
- **Code Reuse**: High percentage of shared canonical service code
- **Deployment Independence**: Adapters deploy without affecting core
- **Performance Isolation**: Adapter issues don't affect canonical processing

### Business Flexibility

- **Time to Market**: New lenses launch faster due to stable core
- **User Migration**: Seamless movement between lenses without data loss
- **Feature Parity**: All lenses benefit from canonical agent improvements
- **Market Adaptation**: Quick pivots between B2C/B2B focus

### Development Velocity

- **Core Stability**: Canonical service changes rarely
- **Parallel Development**: Multiple lens teams work independently  
- **Testing Efficiency**: Core tests stable, adapter tests isolated
- **Bug Isolation**: Presentation bugs don't affect data integrity

## 🎬 Conclusion: The Strategic Advantage

The **"Stable Core, Swappable Lenses"** architecture provides:

1. **Technical Sustainability**: Canonical service evolves independently of presentation needs
2. **Business Flexibility**: Rapid adaptation to different market opportunities  
3. **Development Efficiency**: Multiple presentation teams work in parallel
4. **User Experience**: Each lens optimized for specific user needs
5. **Data Integrity**: Single source of truth with agent intelligence

**Most Importantly**: This approach prevents **execution drift** where different user needs fragment the backend into inconsistent, hard-to-maintain systems. The Context Graph Service remains canonical, durable, and intelligent regardless of how many different ways users want to interact with their memories.

---

**Future scaffolds must follow this adapter pattern to ensure sustainable development aligned with Canon v1.4.0 principles.**