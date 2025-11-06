# Frontend Audit & Refactoring Plan - Phase 1 Work Platform

**Date**: 2025-11-06
**Status**: 🔍 Audit Complete - Ready for Refactoring
**Framework**: Next.js 13+ App Router (RSC)
**UI Library**: shadcn/ui (New York style) + Tailwind CSS

---

## Table of Contents

1. [Current State Audit](#current-state-audit)
2. [Terminology Mapping](#terminology-mapping)
3. [Component Reusability Assessment](#component-reusability-assessment)
4. [Refactoring Strategy](#refactoring-strategy)
5. [Implementation Plan](#implementation-plan)
6. [Design Principles](#design-principles)

---

## Current State Audit

### Technology Stack ✅

**Framework & Architecture**:
- Next.js 13+ with App Router (React Server Components)
- TypeScript
- Server-side rendering with async components
- Dynamic imports for client components

**UI/Styling**:
- **shadcn/ui** (New York style) - Component library
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Icon library
- Consistent design tokens via CSS variables

**State & Data**:
- Supabase for authentication & database
- Server Components for data fetching
- Client Components for interactivity
- Context API for global state (e.g., SupabaseProvider)

**Architecture Patterns**:
- Server/Client component separation
- Dynamic imports with loading states
- RequestBoundary for error handling
- Server-side authentication with `createServerComponentClient`

---

### Current Routing Structure

#### Dashboard Level

| Current Route | Status | Purpose |
|--------------|--------|---------|
| `/` | ✅ Keep | Landing page |
| `/login` | ✅ Keep | Authentication |
| `/auth/callback` | ✅ Keep | OAuth callback |
| `/dashboard` | ✅ Keep | Control tower |
| `/dashboard/settings` | ⏸️ Defer | Workspace settings |
| `/dashboard/integrations` | ❌ Delete | Legacy integrations (sunset) |
| `/baskets` | 🔄 Rename | **→ `/projects`** |
| `/workspace/change-requests` | 🔄 Rename | **→ `/work-requests`** (multi-project) |

#### Basket/Project Level (Current: `/baskets/[id]/*`)

| Current Route | Status | New Route |
|--------------|--------|-----------|
| `/baskets/[id]` | 🔄 Redirect | **→ `/projects/[id]`** (redirect to overview) |
| `/baskets/[id]/overview` | ✅ Rename | **→ `/projects/[id]/overview`** |
| `/baskets/[id]/dashboard` | 🔄 Merge | **→ Merge into `/projects/[id]/overview`** |
| `/baskets/[id]/building-blocks` | 🔄 Rename | **→ `/projects/[id]/context`** |
| `/baskets/[id]/change-requests` | 🔄 Rename | **→ `/projects/[id]/work-review`** |
| `/baskets/[id]/documents` | 🔄 Rename | **→ `/projects/[id]/reports`** |
| `/baskets/[id]/documents/[docId]` | 🔄 Rename | **→ `/projects/[id]/reports/[docId]`** |
| `/baskets/[id]/timeline` | 🔄 Rename | **→ `/projects/[id]/history`** (⏸️ Defer Phase 2) |
| `/baskets/[id]/insights` | ❌ Delete | Legacy (Canon v3.1 removed) |
| `/baskets/[id]/graph` | ❌ Delete | Visual map (sunset) |
| `/baskets/[id]/settings` | ⏸️ Defer | Project settings (Phase 2) |
| `/baskets/[id]/maintenance` | ⏸️ Keep | Admin/debug page |
| `/baskets/[id]/setup-wizard` | 🔄 Review | Onboarding flow |
| `/baskets/[id]/upload-wizard` | 🔄 Merge | Merge into context addition |

---

### Current Components Inventory

#### Reusable UI Components (shadcn/ui)

**Core UI** (in `components/ui/`):
- ✅ `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Label`
- ✅ `Dialog`, `AlertDialog`, `DropdownMenu`, `Popover`, `Select`
- ✅ `Spinner`, `Skeleton`, `EmptyState`, `ErrorMessage`
- ✅ `ProgressStepper` - Multi-step workflows
- ✅ `LoadingOverlay` - Async operation feedback

**Custom Components**:
- ✅ `OrganicSpinner` - Branded loading animation
- ✅ `ConnectionStatus` - Real-time connection indicator
- ✅ `IntelligenceIndicators` - AI processing status
- ✅ `StandardizedCard` - Consistent card styling

#### Domain-Specific Components

**Basket/Project Components** (in `components/basket/` and `components/baskets/`):
- ✅ `BasketWrapper` - Layout wrapper with navigation
- ✅ `SubpageHeader` - Consistent page headers
- ✅ `BasketCard` - Card for list view
- 🔄 Need project-specific variants

**Building Blocks/Context** (in `components/building-blocks/` and `components/blocks/`):
- ✅ `BuildingBlocksClientV2` - Block list with knowledge/meaning tabs
- ✅ `BlockCard` - Individual block display
- ✅ `EmptyBlockState` - Empty state for blocks
- ✅ Can reuse for context management

**Documents/Reports** (in `components/documents/`):
- ✅ `DocumentCard`, `DocumentList` - List/grid views
- ✅ `DocumentDetailView` - Full document viewer
- ✅ Can be rebranded as "Reports"

**Change Requests/Work Review** (in `components/detailed-view/`):
- ✅ `BasketChangeRequestsClient` - Change request list
- ✅ `ReviewRow` - Review action UI
- ✅ Need work-platform specific variants

**Dashboard Components** (in `components/dashboard/`):
- ✅ `AlertAnnouncer` - System alerts
- ✅ `CreateBasketCallout` - CTA for new baskets
- ✅ `CreateProjectButton` - Project creation (already exists!)
- 🔄 Need project-focused dashboard components

**Dialogs/Modals**:
- ✅ `CreateBasketDialog` - Basket creation modal
- ✅ `CreateProjectDialog` - **Already exists!** Phase 6 implementation
- ✅ `DumpModal` - Context addition modal (can reuse)
- ✅ `NewOnboardingDialog` - Onboarding flow

#### Missing Components (Need to Create)

**Work Platform Specific**:
- ❌ `ProjectCard` - Project list card (adapt from BasketCard)
- ❌ `WorkRequestCard` - Work request display
- ❌ `WorkSessionList` - Session management UI
- ❌ `ArtifactCard` - Artifact display with review controls
- ❌ `CheckpointCard` - Checkpoint resolution UI
- ❌ `AgentStatusBadge` - Agent execution status indicator
- ❌ `WorkKanban` - Kanban-style work dashboard (optional)

**Navigation**:
- ❌ `ProjectNavigation` - Project-level nav (adapt from BasketWrapper)
- ❌ `WorkRequestsAggregateView` - Multi-project work requests

---

## Terminology Mapping

### Code-to-User-Facing Terminology

| Backend/Code Term | User-Facing Term | Rationale |
|-------------------|------------------|-----------|
| **projects** | **Projects** | ✅ Already user-friendly |
| **work_sessions** | **Work Requests** | More intuitive than "sessions" |
| **work_artifacts** | **Reports** or **Results** | "Artifacts" too technical; depends on type |
| **work_checkpoints** | **Review Points** or **Checkpoints** | Either works; "Review Points" more descriptive |
| **task_type** | **Work Type** | research → Research, content_creation → Content Creation |
| **task_parameters** | **Request Details** | Technical term hidden from users |
| **baskets** | **Context** (when referring to substrate) | "Basket" → "Context Container" or just "Context" |
| **building-blocks** | **Context** or **Knowledge Base** | More intuitive |
| **change-requests** (substrate) | **Change Requests** (if kept separate) | Or merge into work review |
| **documents** | **Reports** or **Documents** | Reports emphasizes work output |

### Specific Artifact Type Terminology

| Artifact Type | User-Facing Name | Icon/Indicator |
|---------------|------------------|----------------|
| `research_plan` | Research Plan | 🔍 Search icon |
| `web_findings` | Web Research | 🌐 Globe icon |
| `analysis` | Analysis | 📊 Chart icon |
| `content_draft` | Content Draft | ✏️ Edit icon |
| `document_creation` | Document | 📄 File icon |
| `external_deliverable` | Deliverable | 📦 Package icon |

### Status Terminology

| Backend Status | User-Facing Status | Color/Badge |
|----------------|-------------------|-------------|
| `pending` | Pending | Gray |
| `running` | In Progress | Blue (animated) |
| `paused` | Paused | Yellow |
| `completed` | Completed | Green |
| `failed` | Failed | Red |
| `approved` | Approved | Green |
| `rejected` | Rejected | Red |

---

## Component Reusability Assessment

### ✅ High Reusability (Minimal Changes)

**UI Primitives** (shadcn/ui):
- All base components can be reused as-is
- Consistent styling tokens already established

**Layout Components**:
- `RequestBoundary` - Error boundaries
- `SubpageHeader` - Page headers (just update props)
- `EmptyState` - Empty states (update copy)
- `LoadingOverlay` - Loading states

**Data Display**:
- Card components (adapt styling)
- List/grid layouts (reuse structure)
- Badge/Status indicators (update color scheme if needed)

### 🔄 Medium Reusability (Moderate Changes)

**Domain Components**:
- `BasketWrapper` → `ProjectWrapper` (rename, update nav)
- `BasketCard` → `ProjectCard` (update data structure)
- `BuildingBlocksClientV2` → Reuse for context management
- `DocumentList` → `ReportsList` (rebrand)

**Dialogs**:
- `CreateBasketDialog` → Reference for project creation (already have `CreateProjectDialog`)
- `DumpModal` → Reuse for context addition
- `NewOnboardingDialog` → Adapt for project onboarding

### ❌ Low Reusability (New Components Needed)

**Work Platform Specific**:
- Work request creation flow (NEW)
- Work session management (NEW)
- Artifact review interface (NEW)
- Checkpoint resolution UI (NEW)
- Multi-project work request aggregation (NEW)

---

## Refactoring Strategy

### Phase 1A: Core Rename & Redirect (1-2 days)

**Goal**: Rename `/baskets` → `/projects` with minimal functionality changes

**Tasks**:
1. Create `/projects` route structure (copy from `/baskets`)
2. Set up redirects from old routes to new routes
3. Update navigation links
4. Rename components in place (BasketCard → ProjectCard)
5. Test all existing functionality still works

**Deliverables**:
- `/projects` route functional
- All links updated
- Redirects working
- No broken functionality

### Phase 1B: Work Requests UI (3-4 days)

**Goal**: Build work request creation and management UI

**Tasks**:
1. **Create Work Request Flow**:
   - Project selection (if multi-project view)
   - Task type selection (research, content_creation, analysis)
   - Task intent input (textarea with examples)
   - Task parameters form (dynamic based on task_type)
   - Submit → Creates work_session

2. **Work Request List View**:
   - List work sessions per project
   - Status badges (pending, running, completed, failed)
   - Filter by status, task type
   - Quick actions (start, view details)

3. **Work Request Detail Modal/Page**:
   - Session metadata
   - Task parameters
   - Execution timeline
   - Associated artifacts
   - Associated checkpoints

**Components to Build**:
- `WorkRequestForm` - Creation form
- `WorkRequestCard` - List item
- `WorkRequestDetailModal` - Detail view
- `TaskParametersForm` - Dynamic parameter form
- `TaskTypeSelector` - Type selection UI

### Phase 1C: Reports (Was Documents) (2-3 days)

**Goal**: Rebrand documents as reports, integrate with work sessions

**Tasks**:
1. Rename `/documents` → `/reports`
2. Update terminology throughout UI
3. Link reports to work sessions (if artifact)
4. Update document detail view with work session context
5. Add "Source: Work Request #123" metadata

**Components to Adapt**:
- `DocumentList` → `ReportsList`
- `DocumentCard` → `ReportCard`
- `DocumentDetailView` → `ReportDetailView`

### Phase 1D: Context (Was Building Blocks) (2 days)

**Goal**: Rebrand building blocks as context, simplify UX

**Tasks**:
1. Rename `/building-blocks` → `/context`
2. Update "Add Context" button/modal
3. Simplify terminology (Knowledge → Context, Meaning Blocks → Insights)
4. Ensure substrate API integration working

**Components to Adapt**:
- `BuildingBlocksClientV2` → `ContextClient`
- Update modal: "Add Context" instead of "Add Memory"

### Phase 1E: Work Review (Was Change Requests) (3-4 days)

**Goal**: Create work artifact review interface

**Tasks**:
1. **Artifact Review Flow**:
   - List artifacts per work session
   - Show artifact content preview
   - Approve/Reject buttons
   - Feedback textarea
   - Confidence score display

2. **Checkpoint Resolution Flow**:
   - List checkpoints per work session
   - Checkpoint reason display
   - User decision buttons (continue, reject, modify)
   - Feedback input

**Components to Build**:
- `ArtifactReviewCard` - Artifact with review controls
- `ArtifactDetailModal` - Full artifact view
- `CheckpointCard` - Checkpoint display
- `CheckpointResolveDialog` - Resolution modal
- `ReviewActionButtons` - Approve/Reject UI

### Phase 1F: Project Overview Dashboard (2-3 days)

**Goal**: Create unified project overview with stats and navigation

**Tasks**:
1. Project header (editable name, metadata)
2. Key metrics cards:
   - Total context items
   - Active work requests
   - Completed work
   - Pending reviews
3. Quick actions:
   - Create work request
   - Add context
   - View reports
4. Recent activity feed (optional)
5. Context basket summary (reuse existing component)

**Components to Build/Adapt**:
- `ProjectOverviewDashboard` - Main dashboard
- `ProjectMetricsCards` - Stats display
- `ProjectQuickActions` - CTA buttons
- `ContextBasketSummary` - Existing basket overview component

---

## Implementation Plan

### Priority 1: Core Foundation (Phase 1A + 1B) - 4-6 days

**Why First**: Establishes new mental model and core work request functionality

**Sequence**:
1. Day 1-2: Route rename and redirects (Phase 1A)
2. Day 3-4: Work request creation flow (Phase 1B.1)
3. Day 5-6: Work request list and detail view (Phase 1B.2-3)

**Success Criteria**:
- Users can navigate to `/projects`
- Users can create work requests
- Users can view work request status

### Priority 2: Context & Reports (Phase 1C + 1D) - 4-5 days

**Why Second**: Establishes input (context) and output (reports) of work

**Sequence**:
1. Day 7-8: Rebrand documents → reports (Phase 1C)
2. Day 9-10: Rebrand building-blocks → context (Phase 1D)
3. Day 11: Integration testing

**Success Criteria**:
- Users can add context
- Users can view reports
- Terminology consistent

### Priority 3: Work Review (Phase 1E) - 3-4 days

**Why Third**: Enables artifact approval workflow

**Sequence**:
1. Day 12-13: Artifact review interface (Phase 1E.1)
2. Day 14-15: Checkpoint resolution interface (Phase 1E.2)

**Success Criteria**:
- Users can approve/reject artifacts
- Users can resolve checkpoints
- Feedback captured

### Priority 4: Project Overview (Phase 1F) - 2-3 days

**Why Last**: Brings everything together in unified dashboard

**Sequence**:
1. Day 16-17: Build overview dashboard
2. Day 18: Polish and E2E testing

**Success Criteria**:
- Unified project view
- All metrics accurate
- Navigation intuitive

### Phase 2: Deferred Features (After Core Stabilization)

**Deferred to Later**:
- `/projects/[id]/history` (Timeline) - Requires event schema refactor
- `/projects/[id]/settings` - Project management features
- `/dashboard/settings` - Workspace settings
- `/work-requests` (dashboard-level aggregate) - Multi-project view
- Advanced work session features (iterations, resume, etc.)
- Kanban-style work dashboard

---

## Design Principles

### 1. List + Modal Pattern (Not Full Redirects)

**When to Use Modal**:
- Work request detail view (unless very complex)
- Artifact review (show artifact in modal)
- Checkpoint resolution (quick decision)
- Context item details

**When to Use Full Page**:
- Report/document detail view (rich content)
- Project overview (complex dashboard)
- Work request creation (multi-step form)

**Example**:
```
/projects → List of projects (with ProjectCard)
  Click → /projects/[id]/overview (full page)

/projects/[id]/work-requests → List of work requests
  Click → Modal shows work request details (not /projects/[id]/work-requests/[sessionId])

/projects/[id]/reports → List of reports
  Click → /projects/[id]/reports/[id] (full page for rich content)
```

### 2. Consistent Design System

**Color Scheme** (maintain existing):
- Primary: Current brand colors
- Status colors: Gray (pending), Blue (running), Green (success), Red (error), Yellow (warning)
- Semantic colors from Tailwind

**Typography** (maintain existing):
- Headers: Existing font stack
- Body: System fonts
- Monospace: For IDs, technical details

**Spacing** (maintain existing):
- Use Tailwind spacing scale
- Container max-widths: `max-w-6xl` for content, `max-w-4xl` for forms

**Component Variants**:
- Cards: Maintain consistent padding, shadows, borders
- Buttons: Primary, Secondary, Destructive, Ghost
- Badges: Status-specific colors

### 3. Laymen-Friendly Terminology

**Avoid**:
- "Substrate" (use "Context" when referring to stored knowledge)
- "Artifacts" (use "Reports" or specific type names)
- "Basket" (use "Project" or "Context Container")
- "Proposals" (use "Change Requests" if kept, or merge into work review)

**Use**:
- "Projects" over "Baskets"
- "Work Requests" over "Work Sessions"
- "Reports" or "Results" over "Artifacts"
- "Context" or "Knowledge" over "Building Blocks"
- "Review" over "Governance" (in user-facing UI)

### 4. Progressive Disclosure

**Show First**:
- Essential information (name, status, type)
- Key metrics (counts, progress)
- Primary actions (create, view, approve)

**Show on Expand/Click**:
- Detailed metadata
- Technical details (IDs, timestamps)
- Advanced actions (edit, delete, archive)
- Execution logs, parameters

**Example Work Request Card**:
```
[Compact View]
---
Research Request: "Market Analysis Q4"
Status: In Progress (3/5 steps)
Started: 2 hours ago
[View Details] [Pause]

[Expanded/Modal View]
---
Work Request Details
Type: Research
Status: In Progress
Created: 2025-11-06 10:30 AM
Started: 2025-11-06 11:00 AM
Estimated completion: 20 minutes

Task Description:
"Analyze Q4 market trends in healthcare AI..."

Parameters:
- Scope: Comprehensive
- Depth: Detailed analysis
- Sources: Web + internal docs

Execution Timeline:
✓ 1. Planning (completed)
✓ 2. Research (completed)
→ 3. Analysis (in progress)
  4. Report generation (pending)
  5. Review (pending)

Artifacts Generated: 2
- Research Plan (approved)
- Web Findings (pending review)
```

### 5. Feedback & Status Transparency

**Always Show**:
- Current status with color coding
- Progress indication for running work
- Last updated timestamp
- Error messages with actionable next steps

**Loading States**:
- Use `OrganicSpinner` for brand consistency
- Show skeleton loaders for list views
- Loading overlay for async actions

**Success/Error States**:
- Toast notifications for actions
- Inline error messages on forms
- Success confirmations with next steps

---

## Key Recommendations

### 1. Agent Creation Decision: Auto-Create ✅ RECOMMENDED

**Recommendation**: Auto-create agents when project is created

**Rationale**:
- Simpler user mental model (project has all capabilities by default)
- Reduces onboarding friction (no extra step)
- System can handle agent scaffolding reliably
- UX focuses on work requests, not agent management

**Implementation**:
- When project created → scaffold default agents (research, content, analysis)
- Show agent status on project overview ("Available Agents")
- Work request creation shows available agent types based on scaffolded agents
- Future: Allow users to enable/disable agent types in settings

**Alternative** (NOT recommended for Phase 1):
- User explicitly creates agents → More complex UX
- Adds friction to work request creation
- Requires agent management UI

### 2. Start Fresh vs. Rename Existing

**Recommendation**: **Rename Existing Routes** (with strategic component rewrites)

**Rationale**:
- Faster time to market
- Preserves working functionality
- Design system already consistent
- Many components are reusable

**Strategy**:
1. Rename routes (physical file moves)
2. Add redirects for backward compatibility
3. Update imports and references
4. Refactor components incrementally (by priority)
5. New components for work-platform specific features

**What to Rewrite**:
- Work request management (NEW functionality)
- Artifact/checkpoint review (NEW functionality)
- Project overview dashboard (NEW data model)

**What to Adapt**:
- Navigation (update labels/links)
- List views (update card structure)
- Detail modals (update data structure)

### 3. Terminology Alignment

**Before Implementation**: Create terminology glossary and share with user

**Document**:
- All user-facing labels
- Status names and colors
- Navigation items
- Button labels
- Empty state messages
- Error messages

**Get User Approval** on:
- "Work Requests" vs "Work Sessions" vs "Tasks"
- "Reports" vs "Results" vs "Artifacts" vs "Deliverables"
- "Context" vs "Knowledge Base" vs "Building Blocks"
- "Review" vs "Approve" (for artifacts/checkpoints)

---

## Migration Path

### Backward Compatibility

**Old Routes Redirect to New**:
```
/baskets → /projects
/baskets/[id] → /projects/[id]/overview
/baskets/[id]/overview → /projects/[id]/overview
/baskets/[id]/building-blocks → /projects/[id]/context
/baskets/[id]/change-requests → /projects/[id]/work-review
/baskets/[id]/documents → /projects/[id]/reports
```

**Preserve URLs in Database**:
- If any data stores full URLs, update or handle both formats
- Check for hardcoded routes in API responses

**Update External Links**:
- Documentation
- Email templates
- Shared links (if any)

### Feature Flags (Optional)

**For Gradual Rollout**:
```typescript
const FEATURE_FLAGS = {
  useNewProjectsUI: true,  // Enable new /projects routes
  useWorkRequests: true,   // Enable work request features
  useArtifactReview: false, // Defer artifact review to Phase 2
};
```

**Benefits**:
- Roll out incrementally
- A/B test new UX
- Quick rollback if issues

---

## Success Metrics

### Phase 1A-C (Core Foundation)

**Metrics**:
- All users successfully access `/projects` (zero 404s)
- Work request creation success rate > 95%
- Context addition works (zero substrate API errors)
- Report viewing works (zero rendering errors)

**User Feedback**:
- Users understand new terminology (survey/interviews)
- Users can complete core workflows without help

### Phase 1D-F (Complete Experience)

**Metrics**:
- Artifact approval rate > 80%
- Checkpoint resolution rate > 90%
- Project overview page load time < 2s
- Zero navigation confusion (heatmap/analytics)

**User Feedback**:
- Users prefer new UX over old (satisfaction survey)
- Reduced support tickets related to confusion

---

## Next Steps

1. **Review & Approve** this plan with stakeholder
2. **Finalize Terminology** - Get user approval on all user-facing labels
3. **Set Up Development Branch** - `feature/projects-refactor`
4. **Begin Phase 1A** - Route rename and redirects
5. **Iterate** based on user feedback

---

**Status**: ✅ Audit Complete - Ready to Begin Implementation
**Estimated Total Time**: 15-18 days for Phase 1 (Priorities 1-4)
**Recommended Start**: Phase 1A (Core Foundation)
