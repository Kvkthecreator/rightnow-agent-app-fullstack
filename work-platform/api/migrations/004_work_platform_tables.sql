-- Work Platform tables for Phase 1: Projects & Work Sessions
-- Created: 2025-11-06
-- Purpose: Enable project-based work sessions with agent execution and artifact collection

-- ============================================================================
-- Projects Table
-- ============================================================================
-- Projects are work domain containers that link 1:1 with context baskets
-- They encapsulate all work sessions and artifacts related to a specific context

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    basket_id UUID NOT NULL UNIQUE,  -- 1:1 relationship with baskets

    -- Project metadata
    name TEXT NOT NULL,
    description TEXT,

    -- User tracking
    created_by_user_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_basket_per_project UNIQUE (basket_id)
);

-- ============================================================================
-- Work Sessions Table
-- ============================================================================
-- Work sessions represent individual work requests within a project
-- Each session executes an agent with context (from basket) + task parameters

CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    basket_id UUID NOT NULL,  -- Denormalized from project for query performance
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    initiated_by_user_id UUID NOT NULL,

    -- Task definition (from user input)
    task_type TEXT NOT NULL,  -- 'research' | 'content_creation' | 'analysis'
    task_intent TEXT NOT NULL,  -- User's natural language description
    task_parameters JSONB NOT NULL DEFAULT '{}',  -- Task-specific params (platform, tone, etc.)

    -- Execution state
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'running' | 'paused' | 'completed' | 'failed'
    executed_by_agent_id TEXT,  -- Which agent type was used (e.g., 'research_agent')

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Execution metadata (step progress, errors, etc.)
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- Work Artifacts Table
-- ============================================================================
-- Artifacts are outputs produced by agents during work session execution
-- Phase 1: Store artifacts with review status (NO substrate application yet)

CREATE TABLE IF NOT EXISTS work_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,

    -- Artifact classification
    artifact_type TEXT NOT NULL,  -- 'research_plan' | 'web_findings' | 'analysis' | 'content_draft' | etc.
    content JSONB NOT NULL,  -- Actual artifact data (flexible structure per type)

    -- Agent metadata
    agent_confidence NUMERIC(3,2),  -- 0.00-1.00 confidence score
    agent_reasoning TEXT,  -- Agent's explanation for this artifact

    -- Review status (Phase 1: just track, don't apply to substrate)
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
    reviewed_by_user_id UUID,
    reviewed_at TIMESTAMPTZ,
    review_feedback TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Work Checkpoints Table
-- ============================================================================
-- Checkpoints are pause points during work session execution for user review
-- Enables multi-checkpoint workflow (e.g., review plan, review findings, etc.)

CREATE TABLE IF NOT EXISTS work_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,

    -- Checkpoint metadata
    checkpoint_type TEXT NOT NULL,  -- 'agent_offered' | 'user_requested'
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'resolved'
    reason TEXT,  -- Why this checkpoint was created

    -- User decision
    user_decision TEXT,  -- 'continue' | 'reject' | 'modify'
    resolved_by_user_id UUID,
    resolved_at TIMESTAMPTZ,

    -- Additional metadata (step context, etc.)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_basket ON projects(basket_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by_user_id);

-- Work sessions indexes
CREATE INDEX IF NOT EXISTS idx_work_sessions_project ON work_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_basket ON work_sessions(basket_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_workspace ON work_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions(initiated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions(status);
CREATE INDEX IF NOT EXISTS idx_work_sessions_task_type ON work_sessions(task_type);

-- Work artifacts indexes
CREATE INDEX IF NOT EXISTS idx_work_artifacts_session ON work_artifacts(work_session_id);
CREATE INDEX IF NOT EXISTS idx_work_artifacts_status ON work_artifacts(status);
CREATE INDEX IF NOT EXISTS idx_work_artifacts_type ON work_artifacts(artifact_type);

-- Work checkpoints indexes
CREATE INDEX IF NOT EXISTS idx_work_checkpoints_session ON work_checkpoints(work_session_id);
CREATE INDEX IF NOT EXISTS idx_work_checkpoints_status ON work_checkpoints(status);

-- ============================================================================
-- Update Triggers
-- ============================================================================

-- Trigger for projects.updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: work_sessions, work_artifacts, and work_checkpoints don't have updated_at columns
-- (they're append-only or status-update-only tables)

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE projects IS 'Work domain containers linking 1:1 with context baskets';
COMMENT ON TABLE work_sessions IS 'Individual work requests with agent execution tracking';
COMMENT ON TABLE work_artifacts IS 'Agent-produced outputs during work session execution';
COMMENT ON TABLE work_checkpoints IS 'Pause points for user review during agent execution';

COMMENT ON COLUMN projects.basket_id IS '1:1 link to substrate basket (context source)';
COMMENT ON COLUMN work_sessions.task_parameters IS 'JSONB: Flexible task-specific parameters validated by API layer';
COMMENT ON COLUMN work_artifacts.content IS 'JSONB: Artifact data with flexible structure per artifact_type';
COMMENT ON COLUMN work_checkpoints.user_decision IS 'User choice: continue execution, reject session, or modify approach';
