-- Migration: Add 'thinking_partner' to agent_type constraint
-- Purpose: Enable Thinking Partner agent sessions
-- Date: 2025-11-20
-- Issue: Phase 2e migration only allowed ('research', 'content', 'reporting')
--        but TP needs to create agent_sessions with agent_type='thinking_partner'

-- ============================================================================
-- Update agent_sessions table constraint
-- ============================================================================

-- Drop existing constraint
ALTER TABLE agent_sessions
  DROP CONSTRAINT IF EXISTS agent_sessions_agent_type_check;

-- Add new constraint with thinking_partner included
ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_agent_type_check
  CHECK (agent_type IN ('research', 'content', 'reporting', 'thinking_partner'));

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON CONSTRAINT agent_sessions_agent_type_check ON agent_sessions IS
  'Allowed agent types: research, content, reporting, thinking_partner (meta-agent)';

-- Verify constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'agent_sessions_agent_type_check';
