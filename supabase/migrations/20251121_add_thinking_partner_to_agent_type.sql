-- Migration: Add 'thinking_partner' to agent_sessions agent_type check constraint
-- Date: 2025-11-21
-- Purpose: Allow TP sessions to be created in agent_sessions table

-- Drop existing constraint
ALTER TABLE agent_sessions
DROP CONSTRAINT IF EXISTS agent_sessions_agent_type_check;

-- Re-create constraint with 'thinking_partner' included
ALTER TABLE agent_sessions
ADD CONSTRAINT agent_sessions_agent_type_check
CHECK (agent_type = ANY (ARRAY['research'::text, 'content'::text, 'reporting'::text, 'thinking_partner'::text]));

COMMENT ON CONSTRAINT agent_sessions_agent_type_check ON agent_sessions IS
'Valid agent types: research, content, reporting, thinking_partner';
