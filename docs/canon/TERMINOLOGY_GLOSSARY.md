# YARNNN Terminology Glossary

**Version**: 2.0
**Date**: 2025-11-17
**Status**: Canonical
**Purpose**: Prevent terminology confusion across substrate-API and work-platform domains

---

## Recent Updates (2025-11-17)

- **SDK Internalized**: `claude_agent_sdk` → `yarnnn_agents` (work-platform owns orchestration)
- **Tool-Use Pattern**: Agents emit structured outputs via `emit_work_output` tool
- **BFF Pattern Enforced**: work-platform orchestrates, substrate-API owns data
- **Work Supervision** (independent from Substrate Governance): User reviews agent outputs
- **Dual Auth**: Service-to-service + User JWT supported in substrate-API

---

## Critical Distinctions

### Artifacts (AVOID using this word alone)

**Problem**: "Artifact" is overloaded across two domains with different meanings.

| Term | Domain | Table | Meaning |
|------|--------|-------|---------|
| **Substrate Reflections** | substrate-API (P3) | `reflections_artifact` | Pipeline outputs (insights, analysis) from P3 reflection stage |
| **Work Outputs** | work-platform | `work_outputs` | Agent-generated deliverables pending user review |

**ENFORCEMENT (2025-11-16)**:
- ✅ Database table renamed: `work_artifacts` → `work_outputs`
- ✅ Column renamed: `artifact_type` → `output_type`
- ✅ Code must use `work_outputs` (not `work_artifacts`)
- ✅ API responses must use `outputs` (not `artifacts`)
- ❌ NEVER say just "artifacts" without domain qualification

**Recommendation**: Always qualify:
- "reflection artifacts" or "P3 reflections" (substrate-API)
- "work outputs" or "agent deliverables" (work-platform)
- NEVER say just "artifacts" without context

---

## Domain Boundaries

### Substrate-API Domain (Context Layer)

**Purpose**: Persistent shared substrate that grows richer with every agent run

**Core Primitives**:
- **Blocks** (`blocks` table) - Propositional knowledge units with semantic types
- **Reference Assets** (`reference_assets` table) - Non-text substrate (screenshots, PDFs, brand samples)
- **Proposals** (`proposals` table) - Governance workflow for block mutations
- **Reflections** (`reflections_artifact` table) - P3 pipeline analysis outputs
- **Baskets** (`baskets` table) - Context containers (1:1 with projects)

**Key Insight**: Substrate-API owns basket-scoped context provisioning. It knows nothing about work execution or agent orchestration.

---

### Work-Platform Domain (Orchestration Layer)

**Purpose**: Agent work execution, user review, billing/trials

**Core Entities**:
- **Projects** (`projects` table) - User workspace containers (1:1 with baskets)
- **Project Agents** (`project_agents` table) - Agent instances with configs
- **Work Sessions** (`work_sessions` table) - Agent execution tracking
- **Work Outputs** (`work_outputs` table in substrate-API) - Agent deliverables pending review
- **Agent Work Requests** (`agent_work_requests` table) - Trial/billing tracking
- **yarnnn_agents** (internalized SDK) - Agent archetypes, interfaces, integrations

**Key Insight**: Work-platform orchestrates agent execution but writes outputs to substrate-API via BFF pattern. Work outputs table lives in substrate-API for basket-scoped access.

---

## Agent Architecture Terms

### Reference Assets vs Context Blocks

| Concept | Table | Storage | Mutability | Retrieval |
|---------|-------|---------|------------|-----------|
| **Context Blocks** | `blocks` | PostgreSQL text + pgvector | Mutable via governance | Semantic search |
| **Reference Assets** | `reference_assets` | Supabase Storage (blobs) | Immutable (replace only) | Metadata filtering |

**Reference Assets** preserve fidelity (screenshots, PDFs). They are NOT reduced to text blocks.

### Agent Config vs Agent Catalog

| Concept | Table | Scope | Mutability |
|---------|-------|-------|------------|
| **Agent Catalog** | `agent_catalog` | Global (all workspaces) | Admin-managed |
| **Agent Config** | `project_agents.config` | Per-project per-agent | User-managed |

**Catalog** defines what agents exist. **Config** defines how a specific agent behaves for a specific project.

### Execution Modes

| Mode | Trigger | Example |
|------|---------|---------|
| **Manual** | User clicks "Run" | "Research this topic now" |
| **Scheduled** | Cron job | "Run daily at 6am" |
| **Autonomous** | System event | "Run when competitor news detected" |

---

## Pipeline Terminology (Substrate-API)

### P0-P4 Pipeline Stages

| Stage | Name | Purpose | Output |
|-------|------|---------|--------|
| **P0** | Capture | Ingest raw_dumps | `raw_dumps` row |
| **P1** | Extraction | Propose blocks | `proposals` rows |
| **P2** | Governance | Approve/reject proposals | Block state transitions |
| **P3** | Reflection | Analyze patterns | `reflections_artifact` rows |
| **P4** | Composition | Generate documents | `documents` rows |

**Key Insight**: P0-P4 is substrate-internal. Work-platform doesn't participate in this pipeline.

---

## Work Platform Terminology

### Work Session Lifecycle

| State | Meaning |
|-------|---------|
| **pending** | Session created, not started |
| **running** | Agent executing |
| **completed** | Execution finished successfully |
| **completed_with_errors** | Finished but some outputs failed to write |
| **failed** | Execution error |

### Work Output Supervision Status (NEW - 2025-11-17)

| Status | Meaning |
|--------|---------|
| **pending_review** | Awaiting user supervision |
| **approved** | User approved output |
| **rejected** | User rejected output |
| **revision_requested** | User requested changes |
| **archived** | Removed from active review |

### Work Output Types (Current Implementation)

**Via emit_work_output Tool** (Claude tool-use pattern):
| Type | Substrate Impact | Example |
|------|-----------------|---------|
| **finding** | None (pending absorption) | "Competitor X has 45% market share" |
| **recommendation** | None | "Focus on differentiation strategy" |
| **insight** | None | "Pricing trend analysis across competitors" |
| **draft_content** | None | Blog post draft, email template |
| **report_section** | None | Analysis section for reports |
| **data_analysis** | None | Statistical findings |

**Future Consideration**: block_proposal, document_creation types for direct substrate absorption (not yet implemented).

**Key Insight**: Current implementation focuses on work supervision (user review) before substrate absorption. Approved work outputs do NOT automatically become blocks yet (intentionally deferred).

---

## Cross-Domain Concepts

### Thinking Partner (Phase 3)

**Location**: substrate-API database (memory colocated with substrate)

**Tables**:
- `thinking_partner_memory` - Meta-intelligence (patterns, recommendations)
- `thinking_partner_chats` - User conversation history

**Purpose**: Meta-agent for insights, pattern recognition, recursion judgment. NOT the same as work outputs.

### Provenance

**Block Provenance**: `blocks.derived_from_asset_id` → Which reference asset was this block extracted from?

**Work Output Provenance**: `work_artifacts.source_context_ids` → Which blocks did the agent use to generate this output?

**Thinking Partner Provenance**: `thinking_partner_memory.derived_from_sessions` → Which work sessions led to this insight?

---

## Naming Conventions

### Database Tables

| Pattern | Domain | Examples |
|---------|--------|----------|
| `substrate_*` | substrate-API | `substrate_references`, `substrate_relationships` |
| `work_*` | work-platform | `work_sessions`, `work_artifacts`, `work_checkpoints` |
| `agent_*` | work-platform | `agent_catalog`, `agent_work_requests`, `agent_config_history` |
| `project_*` | work-platform | `project_agents`, `projects` |
| `thinking_partner_*` | substrate-API | `thinking_partner_memory`, `thinking_partner_chats` |

### API Endpoints

| Pattern | Service | Examples |
|---------|---------|----------|
| `/api/baskets/*` | substrate-API | `/api/baskets/{id}/blocks`, `/api/baskets/{id}/assets` |
| `/api/agents/*` | work-platform | `/api/agents/run`, `/api/agents/trial-status` |
| `/api/work/*` | work-platform | `/api/work/sessions`, `/api/work/review` |
| `/api/projects/*` | work-platform | `/api/projects/{id}/agents` |

---

## Common Confusions

### "Orchestration"

**Wrong**: Orchestration = approval/governance workflow
**Right**: Orchestration = agent work execution flow (context → agent → outputs)

### "Artifacts"

**Wrong**: All artifacts feed back into substrate
**Right**: Only certain work output types (block_proposal) can become substrate blocks. Insights stay as work outputs.

### "Scheduling"

**Wrong**: Scheduling = cron for P0-P4 pipeline
**Right**: Scheduling = autonomous agent execution (Phase 2: execution modes)

### "Intelligence Layer"

**Wrong**: Intelligence = work outputs analysis
**Right**: Intelligence = Thinking Partner meta-cognition (Phase 3, separate concern)

---

## Document Hierarchy

1. **AGENT_SUBSTRATE_ARCHITECTURE.md** - Current source of truth for agent substrate design
2. **YARNNN_PLATFORM_CANON_V4.md** - Core philosophy and principles (may be outdated on details)
3. **YARNNN_SUBSTRATE_CANON_V3.md** - Substrate-specific canon (P0-P4 pipeline)
4. **ARTIFACT_TYPES_AND_HANDLING.md** - Work output types (rename to WORK_OUTPUT_TYPES.md)
5. **WORK_SESSION_LIFECYCLE.md** - Work session state machine

**When documents conflict**: AGENT_SUBSTRATE_ARCHITECTURE.md takes precedence for Phase 1-3 implementation.

---

## Action Items (Documentation Cleanup)

1. Rename `ARTIFACT_TYPES_AND_HANDLING.md` → `WORK_OUTPUT_TYPES.md`
2. Update all references from "artifact" to "work output" in work-platform docs
3. Consolidate Phase 1-3 status into AGENT_SUBSTRATE_ARCHITECTURE.md
4. Mark outdated sections in YARNNN_PLATFORM_CANON_V4.md

---

**End of Glossary**
