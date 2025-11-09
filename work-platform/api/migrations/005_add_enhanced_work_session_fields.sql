-- Migration: Add Enhanced Work Session Fields for Phase 1 Agent Execution
-- Date: 2025-11-09
-- Purpose: Add task_configuration, task_document_id, approval_strategy, and project_agent_id
--          to support agent-specific configurations and context envelopes

-- ============================================================================
-- 1. Add new columns to work_sessions
-- ============================================================================

-- Add task_configuration (replaces task_parameters for structured config)
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS task_configuration JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN work_sessions.task_configuration IS 'Agent-specific task configuration (research_scope, content_spec, report_spec, etc.)';

-- Add task_document_id (link to context envelope P4 document in substrate)
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS task_document_id UUID;

COMMENT ON COLUMN work_sessions.task_document_id IS 'UUID of P4 document containing context envelope for agent execution';

-- Add approval_strategy (checkpoint strategy per work session)
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS approval_strategy TEXT DEFAULT 'final_only';

COMMENT ON COLUMN work_sessions.approval_strategy IS 'Approval strategy: checkpoint_required | final_only | auto_approve_low_risk';

-- Add project_agent_id (link to specific project agent)
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS project_agent_id UUID REFERENCES project_agents(id) ON DELETE SET NULL;

COMMENT ON COLUMN work_sessions.project_agent_id IS 'Link to the project_agent that executed this work session';

-- Add agent_work_request_id (link to billing/trial tracking)
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS agent_work_request_id UUID;

COMMENT ON COLUMN work_sessions.agent_work_request_id IS 'Link to agent_work_requests for billing and trial tracking';

-- ============================================================================
-- 2. Update existing rows with default values
-- ============================================================================

-- Set default approval_strategy for existing rows
UPDATE work_sessions
SET approval_strategy = 'final_only'
WHERE approval_strategy IS NULL;

-- Set default task_configuration for existing rows (copy from task_parameters if exists)
UPDATE work_sessions
SET task_configuration = task_parameters
WHERE task_configuration IS NULL OR task_configuration = '{}'::jsonb;

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_sessions_task_document_id
ON work_sessions(task_document_id)
WHERE task_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_sessions_project_agent_id
ON work_sessions(project_agent_id)
WHERE project_agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_sessions_approval_strategy
ON work_sessions(approval_strategy);

CREATE INDEX IF NOT EXISTS idx_work_sessions_agent_work_request_id
ON work_sessions(agent_work_request_id)
WHERE agent_work_request_id IS NOT NULL;

-- ============================================================================
-- 4. Add constraints
-- ============================================================================

-- Add check constraint for approval_strategy values
ALTER TABLE work_sessions
DROP CONSTRAINT IF EXISTS work_sessions_approval_strategy_check;

ALTER TABLE work_sessions
ADD CONSTRAINT work_sessions_approval_strategy_check
CHECK (approval_strategy IN ('checkpoint_required', 'final_only', 'auto_approve_low_risk'));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'work_sessions'
  AND column_name IN ('task_configuration', 'task_document_id', 'approval_strategy', 'project_agent_id', 'agent_work_request_id')
ORDER BY column_name;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'work_sessions'
  AND indexname LIKE 'idx_work_sessions_%'
ORDER BY indexname;
