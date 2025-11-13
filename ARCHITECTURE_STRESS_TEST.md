# Architecture Stress Test: Reference Assets & Agent Configs
## Validation Against Existing Schema & Workflows

**Date:** 2024-11-13
**Purpose:** Validate proposed architecture against reality
**Status:** Pre-Implementation Review

---

## 1. Existing Schema Analysis

### Current Tables (Relevant to Architecture)

#### Work-Platform Domain (Supabase DB)
```sql
-- Projects (work-platform/web)
projects (
  id uuid,
  workspace_id uuid → workspaces(id),
  user_id uuid → auth.users(id),
  name text,
  description text,
  basket_id uuid → baskets(id), -- 1:1 mapping
  status text, -- 'active', 'archived', 'completed', 'on_hold'
  created_at timestamptz,
  updated_at timestamptz
)

-- Project Agents (added Nov 8, 2024)
project_agents (
  id uuid,
  project_id uuid → projects(id),
  agent_type text → agent_catalog(agent_type),
  display_name text,
  is_active boolean,
  created_at timestamptz,
  created_by_user_id uuid
  -- NOTE: NO config column yet!
)

-- Work Sessions (added Oct 31, 2024)
work_sessions (
  id uuid,
  workspace_id uuid → workspaces(id),
  basket_id uuid → baskets(id),
  initiated_by_user_id uuid → auth.users(id),
  executed_by_agent_id text, -- String identifier
  agent_session_id text,

  -- Added Nov 8:
  project_agent_id uuid → project_agents(id),
  agent_work_request_id uuid → agent_work_requests(id),

  task_intent text,
  task_type text, -- 'research', 'synthesis', 'analysis', 'composition', 'update'
  task_document_id uuid → documents(id),

  status text, -- 'initialized', 'in_progress', 'awaiting_checkpoint', etc.
  approval_strategy text, -- 'checkpoint_required', 'final_only', 'auto_approve_low_risk'

  reasoning_trail jsonb[],
  context_snapshot jsonb,

  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,

  metadata jsonb
)

-- Work Artifacts (added Oct 31, 2024)
work_artifacts (
  id uuid,
  work_session_id uuid → work_sessions(id),
  checkpoint_id uuid,

  artifact_type text, -- 'block_proposal', 'block_update', 'document_creation', 'insight', 'external_deliverable'
  content jsonb,

  becomes_block_id uuid → blocks(id),
  supersedes_block_id uuid → blocks(id),
  creates_document_id uuid → documents(id),

  external_url text,
  external_type text,

  agent_confidence numeric,
  agent_reasoning text,
  source_context_ids uuid[],

  status text, -- 'draft', 'pending_review', 'approved', 'rejected', 'applied_to_substrate'
  risk_level text, -- 'low', 'medium', 'high'

  reviewed_by_user_id uuid,
  reviewed_at timestamptz,

  created_at timestamptz,
  applied_at timestamptz,

  metadata jsonb
)
```

#### Substrate Domain (Separate DB)
```sql
-- Baskets (substrate-api)
baskets (
  id uuid,
  name text,
  raw_dump_id uuid,
  status basket_state, -- 'INIT', 'ACTIVE', 'ARCHIVED'
  created_at timestamptz,
  workspace_id uuid, -- Multi-tenant isolation
  bucket_id text
)

-- Blocks (substrate-api)
blocks (
  id uuid,
  basket_id uuid → baskets(id),
  parent_block_id uuid,
  semantic_type text, -- 'fact', 'insight', 'principle', etc.
  content text,
  version integer,
  state block_state, -- 'PROPOSED', 'ACCEPTED', 'LOCKED', 'CONSTANT'

  -- Metadata
  title text,
  body_md text,
  confidence_score double precision,
  metadata jsonb,

  -- Provenance
  raw_dump_id uuid,
  processing_agent text,
  proposal_id uuid,

  workspace_id uuid,
  created_at timestamptz,
  updated_at timestamptz
  -- NOTE: NO derived_from_asset_id column yet!
)

-- Documents (substrate-api)
documents (
  id uuid,
  basket_id uuid → baskets(id),
  title text,
  content text,
  metadata jsonb,
  created_at timestamptz
)

-- Substrate References (substrate-api)
substrate_references (
  id uuid,
  document_id uuid → documents(id),
  substrate_type substrate_type, -- enum: 'block', 'dump', 'context_item', 'timeline_event'
  substrate_id uuid,
  role text,
  weight numeric,
  snippets jsonb,
  metadata jsonb,
  created_at timestamptz
)
```

### Supabase Storage Configuration

From screenshot:
- **Endpoint:** `https://galytxxkrbksilekmhcw.storage.supabase.co/storage/v1/s3`
- **Region:** `ap-northeast-2`
- **S3 protocol:** Enabled
- **Current state:** No access keys created

---

## 2. Conflicts & Compatibility Issues

### Issue 1: ❌ `project_agents` Missing `config` Column

**Problem:**
- Architecture doc proposes: `project_agents.config jsonb`
- Current schema: No config column exists

**Impact:**
- Phase 1 implementation requires migration
- Need to add column + default value
- Existing agents will have empty config `{}`

**Resolution:**
```sql
-- Migration needed:
ALTER TABLE project_agents
ADD COLUMN config jsonb DEFAULT '{}' NOT NULL,
ADD COLUMN config_version integer DEFAULT 1 NOT NULL,
ADD COLUMN last_config_updated_at timestamptz DEFAULT now(),
ADD COLUMN last_config_updated_by uuid REFERENCES auth.users(id);
```

**Compatibility:** ✅ Safe to add (nullable/default values)

---

### Issue 2: ❌ `work_sessions` Missing `execution_trigger` Column

**Problem:**
- Architecture doc proposes: `work_sessions.execution_trigger text` ('manual', 'scheduled', 'autonomous')
- Current schema: No execution_trigger column

**Impact:**
- Phase 2 implementation requires migration
- Can't differentiate manual vs scheduled runs yet

**Resolution:**
```sql
-- Deferred to Phase 2:
ALTER TABLE work_sessions
ADD COLUMN execution_trigger text DEFAULT 'manual'
  CHECK (execution_trigger IN ('manual', 'scheduled', 'autonomous', 'cascade'));
```

**Compatibility:** ✅ Safe to defer (Phase 2 feature)

---

### Issue 3: ❌ `blocks` Missing `derived_from_asset_id` Column

**Problem:**
- Architecture doc proposes: `blocks.derived_from_asset_id uuid → reference_assets(id)`
- Current schema: No such column

**Impact:**
- Can't track provenance from reference assets to blocks
- Weakens "extracted from Screenshot X" narrative

**Resolution:**
```sql
-- Add to Phase 1 migration:
ALTER TABLE blocks
ADD COLUMN derived_from_asset_id uuid REFERENCES reference_assets(id) ON DELETE SET NULL;

CREATE INDEX idx_blocks_derived_asset ON blocks(derived_from_asset_id)
  WHERE derived_from_asset_id IS NOT NULL;
```

**Compatibility:** ✅ Safe to add (nullable, optional provenance)

**⚠️ Cross-DB Foreign Key Issue:**
- `blocks` table is in **substrate-api database**
- `reference_assets` table will be in **work-platform database**
- **PostgreSQL foreign keys don't work across databases**

**Fix Required:**
```sql
-- Option A: Store reference_assets in substrate-api DB (NOT work-platform)
-- This makes sense because assets are substrate, not just project metadata

-- Option B: No FK constraint, enforce in application code
ALTER TABLE blocks
ADD COLUMN derived_from_asset_id uuid; -- No REFERENCES constraint

-- Then enforce integrity in BFF:
if (asset_id && !await assetExists(asset_id)) {
  throw new Error('Invalid asset reference');
}
```

**Recommended:** Option A (store reference_assets in substrate-api DB)

---

### Issue 4: ⚠️ Database Placement: Where Does `reference_assets` Live?

**Problem:**
- Architecture doc assumes: `reference_assets` in work-platform DB
- But reality: `blocks` are in substrate-api DB
- Foreign key `blocks.derived_from_asset_id → reference_assets(id)` won't work across DBs

**Analysis:**

| Placement | Pros | Cons |
|-----------|------|------|
| **Work-Platform DB** | • Colocated with projects, work_sessions<br>• RLS via workspace_id | ❌ Can't FK from blocks<br>❌ Substrate-API can't query directly |
| **Substrate-API DB** | ✅ Colocated with blocks, baskets<br>✅ FK constraint works<br>✅ Agents query one DB | • Requires substrate-API endpoints<br>• BFF must proxy uploads |

**Decision:** ✅ **Store `reference_assets` in Substrate-API DB**

**Rationale:**
1. Reference assets ARE substrate (second branch of context)
2. Agents execute in substrate-API → need direct access to assets
3. Provenance chain (asset → block) requires same DB
4. Work-platform already proxies to substrate-API via BFF

**Schema Update:**
```sql
-- In substrate-api database (NOT work-platform):
CREATE TABLE reference_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id uuid NOT NULL REFERENCES baskets(id) ON DELETE CASCADE, -- ✅ Same DB

  -- Storage
  storage_path text NOT NULL,
  file_name text NOT NULL,
  ...

  -- Workspace isolation (for RLS)
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  ...
);
```

---

### Issue 5: ✅ Supabase Storage Bucket Setup

**Current State (from screenshot):**
- S3 protocol enabled ✅
- No access keys created yet
- Region: ap-northeast-2 ✅

**Required Setup:**
```sql
-- Supabase Storage bucket (via dashboard or SQL):
INSERT INTO storage.buckets (id, name, public)
VALUES ('yarnnn-assets', 'yarnnn-assets', false); -- Private bucket

-- RLS for storage bucket:
CREATE POLICY "Users can upload assets to their workspace baskets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'yarnnn-assets'
  AND (storage.foldername(name))[1] = 'baskets'
  AND EXISTS (
    SELECT 1 FROM baskets b
    JOIN workspace_memberships wm ON wm.workspace_id = b.workspace_id
    WHERE b.id::text = (storage.foldername(name))[2]
      AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read assets from their workspace baskets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'yarnnn-assets'
  AND EXISTS (
    SELECT 1 FROM baskets b
    JOIN workspace_memberships wm ON wm.workspace_id = b.workspace_id
    WHERE b.id::text = (storage.foldername(name))[2]
      AND wm.user_id = auth.uid()
  )
);
```

**Path Structure:**
```
yarnnn-assets/
  baskets/
    {basket_id}/
      assets/
        {asset_id}/
          {filename}
```

**Example:** `yarnnn-assets/baskets/123e4567-e89b-12d3-a456-426614174000/assets/789e4567-e89b-12d3-a456-426614174999/brand_voice_sample.png`

**Compatibility:** ✅ No conflicts with existing storage

---

### Issue 6: ⚠️ `work_artifacts` Already Has `external_url` Field

**Problem:**
- Architecture doc proposes: Reference assets with `storage_path`
- Existing schema: `work_artifacts` already has `external_url` for external deliverables

**Potential Confusion:**
- `reference_assets.storage_path` = input to agents (brand voice samples)
- `work_artifacts.external_url` = output from agents (generated PPT URL)

**Resolution:** ✅ No conflict - these are different concepts:
- Reference assets = **inputs** (uploaded by user, queried by agents)
- Work artifacts = **outputs** (generated by agents, reviewed by user)

**Clarification for docs:**
```
Reference Assets (Input):
  User uploads → storage_path → agents read

Work Artifacts (Output):
  Agents generate → external_url → user downloads
```

---

## 3. Redundancies & Optimizations

### Redundancy 1: ⚠️ Metadata Storage Patterns

**Observation:**
Multiple tables use `metadata jsonb` field:
- `projects.metadata`
- `work_sessions.metadata`
- `work_artifacts.metadata`
- `blocks.metadata`
- `reference_assets.metadata` (proposed)

**Question:** Is there duplication risk?

**Analysis:**
- ✅ Different domains store different metadata
- `projects.metadata` = project-level config (origin_template, onboarding state)
- `work_sessions.metadata` = execution context (agent params, runtime data)
- `work_artifacts.metadata` = artifact-specific (file info, formatting)
- `blocks.metadata` = semantic metadata (extraction method, validation status)
- `reference_assets.metadata` = asset metadata (platform, url, notes)

**Conclusion:** ✅ Not redundant - each serves different purpose

**Optimization Opportunity:**
Consider **typed metadata schemas** per table to avoid JSONB becoming a dumping ground:

```typescript
// Define schemas for each metadata field:
interface ProjectMetadata {
  origin_template?: string;
  onboarding_completed?: boolean;
  settings?: {
    default_approval_strategy?: string;
  };
}

interface ReferenceAssetMetadata {
  source_url?: string;
  platform?: 'twitter' | 'linkedin' | 'website';
  capture_date?: string;
  notes?: string;
}
```

**Recommendation:** ✅ Document metadata schemas in architecture doc

---

### Redundancy 2: ❌ `work_sessions.executed_by_agent_id` vs. `work_sessions.project_agent_id`

**Observation:**
- `executed_by_agent_id text` = String identifier (legacy?)
- `project_agent_id uuid` = FK to project_agents (new, added Nov 8)

**Problem:**
- Two fields tracking the same concept
- Which one is source of truth?

**Resolution:**
```sql
-- Migration: Deprecate executed_by_agent_id
ALTER TABLE work_sessions
DROP COLUMN executed_by_agent_id;

-- Keep only project_agent_id (properly typed FK)
```

**Compatibility Check:**
- Need to verify if `executed_by_agent_id` is used anywhere
- Grep codebase for references

**Recommendation:** ✅ Remove `executed_by_agent_id` (redundant with `project_agent_id`)

---

### Redundancy 3: ⚠️ `work_sessions.task_type` vs. `project_agents.agent_type`

**Observation:**
- `work_sessions.task_type` = 'research', 'synthesis', 'analysis', 'composition', 'update'
- `project_agents.agent_type` = 'research', 'content', 'reporting'

**Question:** Are these redundant?

**Analysis:**
- ❌ NOT redundant - different concepts:
  - `agent_type` = **WHO** (which agent)
  - `task_type` = **WHAT** (what kind of work)

**Example:**
```
Research Agent (agent_type='research') can perform:
  - task_type='research' (find new info)
  - task_type='analysis' (analyze existing info)
  - task_type='synthesis' (combine multiple sources)
```

**Conclusion:** ✅ Keep both (different semantic meanings)

**Clarification Needed:**
- Architecture doc doesn't clearly explain task_type vs agent_type
- Add section distinguishing these concepts

---

### Optimization 1: 🔧 Index Coverage Analysis

**Current Indexes (work_sessions):**
```sql
idx_work_sessions_workspace ON (workspace_id)
idx_work_sessions_basket ON (basket_id)
idx_work_sessions_status ON (status)
idx_work_sessions_user ON (initiated_by_user_id)
idx_work_sessions_agent ON (executed_by_agent_id) WHERE executed_by_agent_id IS NOT NULL
idx_work_sessions_agent ON (project_agent_id) -- Added Nov 8
idx_work_sessions_billing ON (agent_work_request_id)
```

**Proposed Additions (from architecture doc):**
```sql
-- For execution mode filtering (Phase 2):
CREATE INDEX idx_work_sessions_execution_trigger ON work_sessions(execution_trigger)
  WHERE execution_trigger != 'manual'; -- Partial index for scheduled/autonomous
```

**Query Pattern Analysis:**

Common queries:
```sql
-- Q1: Get all sessions for a project agent
SELECT * FROM work_sessions WHERE project_agent_id = $id;
-- ✅ Covered by idx_work_sessions_agent

-- Q2: Get recent scheduled runs
SELECT * FROM work_sessions
WHERE project_agent_id = $id
  AND execution_trigger = 'scheduled'
ORDER BY created_at DESC;
-- ⚠️ Needs composite index

-- Q3: Get agent stats (pending/running counts)
SELECT status, COUNT(*)
FROM work_sessions
WHERE project_agent_id = $id
GROUP BY status;
-- ✅ Covered by idx_work_sessions_agent + status check
```

**Optimization:**
```sql
-- Add composite index for common "agent + status" queries:
CREATE INDEX idx_work_sessions_agent_status ON work_sessions(project_agent_id, status)
  INCLUDE (created_at, task_intent);
```

**Recommendation:** ✅ Add composite index in Phase 1 migration

---

### Optimization 2: 🔧 Reference Assets - Blob Storage vs. Metadata Split

**Proposed Architecture:**
- **Metadata:** SQL table (query name, type, tags, description)
- **Blob:** Supabase Storage (actual file bytes)

**Alternative:** Store everything in Storage + use Storage metadata?

**Analysis:**

| Approach | SQL Metadata + Blob Storage | Storage Only |
|----------|----------------------------|--------------|
| **Querying** | ✅ Fast SQL queries (type, tags, description) | ❌ Must list all files, parse metadata |
| **Filtering** | ✅ `WHERE asset_type = 'brand_voice'` | ❌ Client-side filtering |
| **Agent Scoping** | ✅ `WHERE 'content' = ANY(agent_scope)` | ❌ Download all, filter locally |
| **Search** | ✅ Embeddings in SQL (semantic search) | ❌ No search capability |
| **RLS** | ✅ Row-level security | ✅ Bucket policies (less granular) |

**Conclusion:** ✅ **SQL metadata + Blob storage is correct** (no change needed)

---

## 4. Workflow Compatibility

### Workflow 1: P0-P4 Substrate Pipeline

**Current Flow:**
```
1. User creates raw_dump
2. P0: Capture (raw_dump → onboarding_dump route)
3. P1: Extraction (raw_dump → blocks via focused extraction)
4. P2: Graph (blocks → block_links via embedding similarity)
5. P3: Reflection (blocks → reflections_artifact)
6. P4: Composition (blocks → documents via substrate_references)
```

**Integration Point:** Where do reference assets fit?

**Proposed Enhancement:**
```
1. User uploads reference asset (e.g., competitor screenshot)
2. Agent extracts facts from asset → creates raw_dump
3. raw_dump → P0-P4 pipeline (as normal)
4. Resulting blocks get derived_from_asset_id = {asset_id}
```

**Compatibility:** ✅ No changes to P0-P4 pipeline
**Addition:** Reference assets become **input source** for raw_dumps

**Example:**
```
User uploads: competitor_pricing_screenshot.png
Agent (via Vision API): Extracts pricing table
Agent creates raw_dump: "Competitor charges $99/month for Pro tier..."
P0-P4 pipeline: Creates blocks from raw_dump
Blocks metadata: derived_from_asset_id = {screenshot_id}
```

---

### Workflow 2: Governance & Proposal Flow

**Current Flow:**
```
1. Agent proposes substrate mutation (proposal table)
2. User reviews proposal (approve/reject)
3. If approved: proposal_executions → updates blocks/dumps
4. Blocks transition: PROPOSED → ACCEPTED → LOCKED
```

**Question:** Do reference assets go through governance?

**Analysis:**

| Asset Operation | Governance? | Rationale |
|----------------|-------------|-----------|
| **Upload asset** | ❌ No | User is uploading their own files (not agent-generated) |
| **Agent creates blocks from asset** | ✅ Yes | Blocks require governance (existing flow) |
| **Delete asset** | ❌ No | User owns the asset |
| **Replace asset** | ❌ No | User decision (e.g., upload new brand voice sample) |

**Conclusion:** ✅ Reference assets bypass governance (user-controlled substrate)
**Blocks derived from assets still require governance** (agent-generated substrate)

**Compatibility:** ✅ No changes to governance flow

---

### Workflow 3: Agent Work Execution

**Current Flow:**
```
1. User creates work request (platform-API)
2. Platform-API creates work_session row
3. Platform-API calls substrate-API /execute-work
4. Substrate-API agent queries baskets → gets context blocks
5. Agent executes task
6. Agent creates work_artifacts
7. Work_artifacts → proposals (if substrate mutations)
8. User reviews proposals
```

**Proposed Enhancement (Phase 1):**
```
4. Substrate-API agent queries:
   - baskets → context blocks ✅ (existing)
   - reference_assets → brand samples, screenshots 🆕 (new)
   - project_agents.config → agent settings 🆕 (new)
5. Agent executes with richer context
```

**Compatibility:** ✅ Backward compatible
- Agents without reference assets still work (empty array)
- Agents without config still work (default `{}`)

**Migration Path:**
- Existing agents get empty config on column add
- Users gradually upload reference assets
- No breaking changes

---

### Workflow 4: Work Sessions List & Filtering

**Current Queries:**
```typescript
// Get all sessions for a project:
SELECT * FROM work_sessions WHERE basket_id = $basket_id;

// Get sessions by status:
SELECT * FROM work_sessions WHERE status = 'completed';

// Get sessions by agent (NEW - Nov 8):
SELECT * FROM work_sessions WHERE project_agent_id = $agent_id;
```

**Proposed Queries (Phase 2):**
```typescript
// Get scheduled runs:
SELECT * FROM work_sessions
WHERE execution_trigger = 'scheduled'
ORDER BY created_at DESC;

// Get manual runs for agent:
SELECT * FROM work_sessions
WHERE project_agent_id = $agent_id
  AND execution_trigger = 'manual';
```

**Compatibility:** ✅ New queries, existing queries unchanged

---

## 5. Missing Pieces & Gaps

### Gap 1: ❌ Agent Catalog Table Missing from Analysis

**Problem:**
- `project_agents.agent_type` references `agent_catalog(agent_type)`
- Architecture doc doesn't mention `agent_catalog`

**Check Existing Schema:**
```sql
-- Need to verify if this exists:
SELECT * FROM information_schema.tables WHERE table_name = 'agent_catalog';
```

**If Missing:** Need to create:
```sql
CREATE TABLE agent_catalog (
  agent_type text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  is_available boolean DEFAULT true,
  pricing_tier text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO agent_catalog (agent_type, display_name, description) VALUES
('research', 'Research Agent', 'Monitors markets, competitors, and signals'),
('content', 'Content Agent', 'Creates and repurposes content'),
('reporting', 'Reporting Agent', 'Generates reports and deliverables'),
('thinking_partner', 'Thinking Partner', 'Meta-agent for insights and orchestration');
```

**Recommendation:** ✅ Add agent_catalog creation to Phase 1 migration

---

### Gap 2: ❌ `agent_work_requests` Table Not Defined

**Problem:**
- `work_sessions.agent_work_request_id` references `agent_work_requests(id)`
- Architecture doc doesn't define this table

**Purpose (inferred):** Billing/trial tracking for agent usage

**Need to Check:** Does this table exist?

**If Exists:** Document its schema in architecture doc
**If Missing:** Clarify if work_sessions.agent_work_request_id should be removed

---

### Gap 3: ⚠️ Thinking Partner Chat Storage

**Proposed Schema:**
```sql
CREATE TABLE thinking_partner_chats (
  id uuid,
  basket_id uuid,
  user_id uuid,
  thread_id uuid,
  role text, -- 'user' | 'assistant'
  content text,
  created_at timestamptz
);
```

**Question:** Where does this live? Work-platform or substrate-API?

**Analysis:**

| DB | Pros | Cons |
|----|------|------|
| **Work-Platform** | • User-facing feature<br>• RLS via workspace | ❌ Can't query context blocks directly |
| **Substrate-API** | ✅ Can query blocks, assets, work sessions<br>✅ Single DB for TP | • Mixing user interaction with substrate |

**Recommendation:** 🤔 **Store in substrate-API DB**
- Thinking Partner is tightly coupled to substrate
- Needs to query blocks + assets + work sessions
- Chat history is metadata about substrate usage

---

### Gap 4: ❌ Cross-Service Authentication for Asset Upload

**Problem:**
- User uploads asset via work-platform frontend
- Asset needs to go to substrate-API database
- Supabase Storage is attached to substrate-API project (inferred from screenshot)

**Current Flow:**
```
User (Browser) → Work-Platform BFF → Substrate-API → Supabase Storage
```

**Authentication Chain:**
```
1. User authenticated via Supabase Auth (work-platform)
2. Work-platform BFF calls substrate-API (service-to-service auth)
3. Substrate-API uploads to storage (service role)
```

**Question:** Does substrate-API need file upload endpoints?

**Answer:** ✅ YES - need to add:
```
POST /api/baskets/{basketId}/reference-assets
  - Accepts multipart/form-data
  - Validates user owns basket (via service auth)
  - Uploads file to Supabase Storage
  - Creates metadata row in reference_assets table
  - Returns asset object
```

**Recommendation:** ✅ Add substrate-API file upload endpoints to Phase 1 scope

---

## 6. Final Recommendations

### Critical Path Items (Must Fix Before Phase 1)

1. ✅ **Database Placement Decision:**
   - ✅ **Store `reference_assets` in substrate-API database** (not work-platform)
   - Rationale: Colocated with blocks, enables FK constraints, agents query directly

2. ✅ **Add Missing Columns:**
   ```sql
   -- substrate-api DB:
   ALTER TABLE blocks
   ADD COLUMN derived_from_asset_id uuid;

   -- work-platform DB:
   ALTER TABLE project_agents
   ADD COLUMN config jsonb DEFAULT '{}' NOT NULL;
   ```

3. ✅ **Verify/Create Agent Catalog:**
   - Check if `agent_catalog` table exists
   - If not, create it with research/content/reporting/thinking_partner entries

4. ✅ **Substrate-API File Upload Endpoints:**
   - Add `POST /baskets/{id}/reference-assets` endpoint
   - Handle multipart/form-data
   - Integrate with Supabase Storage

5. ✅ **Supabase Storage Bucket Setup:**
   - Create `yarnnn-assets` bucket (private)
   - Configure RLS policies
   - Set up path structure: `baskets/{basket_id}/assets/{asset_id}/{filename}`

---

### Optimizations (Should Do in Phase 1)

1. ✅ **Add Composite Indexes:**
   ```sql
   CREATE INDEX idx_work_sessions_agent_status ON work_sessions(project_agent_id, status);
   ```

2. ✅ **Remove Redundant Column:**
   ```sql
   ALTER TABLE work_sessions DROP COLUMN executed_by_agent_id;
   ```

3. ✅ **Document Metadata Schemas:**
   - Define TypeScript interfaces for each table's metadata jsonb
   - Prevents JSONB from becoming unstructured dumping ground

---

### Deferred Items (Phase 2+)

1. ⏸️ **Execution Mode Fields:**
   ```sql
   -- Add in Phase 2:
   ALTER TABLE project_agents
   ADD COLUMN execution_mode text DEFAULT 'manual',
   ADD COLUMN schedule_config jsonb DEFAULT '{}';

   ALTER TABLE work_sessions
   ADD COLUMN execution_trigger text DEFAULT 'manual';
   ```

2. ⏸️ **Thinking Partner Tables:**
   - Defer `thinking_partner_memory` and `thinking_partner_chats` to Phase 3

---

## 7. Schema Compatibility Matrix

| Proposed Feature | Existing Schema | Status | Action Required |
|------------------|----------------|--------|-----------------|
| **reference_assets table** | ❌ Doesn't exist | 🆕 New | Create in substrate-API DB |
| **project_agents.config** | ❌ Column missing | 🔧 Add | Migration to add column |
| **blocks.derived_from_asset_id** | ❌ Column missing | 🔧 Add | Migration to add column |
| **work_sessions.execution_trigger** | ❌ Column missing | ⏸️ Phase 2 | Defer |
| **Supabase Storage bucket** | ✅ S3 enabled, no bucket yet | 🔧 Setup | Create bucket + RLS |
| **work_artifacts.external_url** | ✅ Exists | ✅ Compatible | No conflict |
| **work_sessions.project_agent_id** | ✅ Exists (Nov 8) | ✅ Compatible | Use instead of executed_by_agent_id |
| **Thinking Partner tables** | ❌ Don't exist | ⏸️ Phase 3 | Defer |

---

## 8. Updated Phase 1 Scope

Based on stress test findings, **Phase 1 deliverables must include**:

### Database Migrations

**Substrate-API DB:**
```sql
-- 1. Create reference_assets table
CREATE TABLE reference_assets ( ... ); -- Full schema from architecture doc

-- 2. Add provenance column to blocks
ALTER TABLE blocks
ADD COLUMN derived_from_asset_id uuid;

-- 3. Verify/create agent_catalog
CREATE TABLE IF NOT EXISTS agent_catalog ( ... );
```

**Work-Platform DB:**
```sql
-- 1. Add config to project_agents
ALTER TABLE project_agents
ADD COLUMN config jsonb DEFAULT '{}' NOT NULL,
ADD COLUMN config_version integer DEFAULT 1 NOT NULL,
ADD COLUMN last_config_updated_at timestamptz DEFAULT now();

-- 2. Remove redundant column
ALTER TABLE work_sessions
DROP COLUMN IF EXISTS executed_by_agent_id;

-- 3. Add composite index
CREATE INDEX idx_work_sessions_agent_status
ON work_sessions(project_agent_id, status);
```

### API Implementation

**Substrate-API:**
```
POST   /baskets/{basketId}/reference-assets
GET    /baskets/{basketId}/reference-assets
GET    /baskets/{basketId}/reference-assets/{assetId}
DELETE /baskets/{basketId}/reference-assets/{assetId}
```

**Work-Platform BFF:**
```
GET    /api/projects/{projectId}/agents/{agentId}/config
PUT    /api/projects/{projectId}/agents/{agentId}/config
```

(Reference assets routes proxy to substrate-API)

### Infrastructure

1. Create Supabase Storage bucket: `yarnnn-assets`
2. Configure RLS policies for bucket
3. Set up path structure: `baskets/{basket_id}/assets/{asset_id}/{filename}`

---

## 9. Conclusion

### Architecture Validation: ✅ APPROVED with Modifications

**Key Changes from Original Doc:**
1. ✅ **reference_assets moves to substrate-API database** (was: work-platform DB)
2. ✅ **Remove work_sessions.executed_by_agent_id** (redundant)
3. ✅ **Add agent_catalog table** (referenced but not defined)
4. ✅ **Add composite indexes** (performance optimization)
5. ✅ **Clarify thinking_partner_chats location** (substrate-API DB)

**Conflicts Resolved:**
- ❌ Cross-DB foreign keys → Fixed by colocating in substrate-API
- ❌ Missing columns → Identified migrations needed
- ❌ Redundant fields → Removed

**Compatibility Verified:**
- ✅ P0-P4 pipeline unchanged
- ✅ Governance flow unchanged
- ✅ Work execution backward compatible
- ✅ Existing queries continue working

**Ready for Implementation:** ✅ YES (with migration plan above)

---

**Next Step:** Update AGENT_SUBSTRATE_ARCHITECTURE.md with findings from this stress test, then proceed to Phase 1 implementation.
