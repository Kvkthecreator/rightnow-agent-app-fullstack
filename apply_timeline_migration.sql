-- Apply just the timeline and notification migration
-- Run this with: psql -h <host> -U <user> -d <database> -f apply_timeline_migration.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean Timeline: Knowledge Evolution Story
DO $$ BEGIN
    CREATE TYPE knowledge_event_type AS ENUM (
      'memory.captured',        -- Raw input added to memory
      'knowledge.evolved',      -- Substrate approved/updated  
      'insights.discovered',    -- Reflections computed
      'document.created',       -- New narrative composed
      'document.updated',       -- Document edited/recomposed
      'relationships.mapped',   -- New connections found
      'governance.decided',     -- Important approval/rejection
      'milestone.achieved'      -- Significant knowledge growth
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_significance AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_timeline (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  basket_id uuid NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Event Classification
  event_type knowledge_event_type NOT NULL,
  significance event_significance DEFAULT 'medium',
  
  -- User-Friendly Content
  title text NOT NULL,           -- "Memory captured from upload"
  description text,              -- "3 new insights discovered"
  
  -- Context & Metadata
  metadata jsonb DEFAULT '{}',   -- Event-specific data
  related_ids jsonb DEFAULT '{}', -- Related entity IDs
  
  -- Timing
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT knowledge_timeline_title_length CHECK (length(title) BETWEEN 1 AND 200),
  CONSTRAINT knowledge_timeline_description_length CHECK (length(description) <= 1000)
);

-- Clean Notifications: Real-Time Actionable Alerts  
DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM (
      -- Actions Required
      'approval.required',      -- Review proposal
      'decision.needed',        -- User input required
      'error.attention',        -- Something failed, user can fix
      
      -- Completions (No action required, just awareness)
      'processing.completed',   -- Your request finished
      'document.ready',         -- Composition finished
      'insights.available',     -- New reflections ready
      
      -- Status Changes
      'governance.updated',     -- Settings changed
      'collaboration.update',   -- Team activity
      
      -- System  
      'system.maintenance',     -- Scheduled downtime
      'system.performance',     -- Slow responses
      'system.security',        -- Login alerts
      'system.storage'          -- Space warnings
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Alert Classification
  alert_type alert_type NOT NULL,
  severity alert_severity DEFAULT 'info',
  
  -- Content
  title text NOT NULL,
  message text NOT NULL,
  
  -- Actionability
  actionable boolean DEFAULT false,
  action_url text,               -- Where to go to act
  action_label text,             -- "Review Proposal", "Fix Error"
  
  -- Context
  related_entities jsonb DEFAULT '{}', -- basket_id, document_id, etc.
  
  -- Lifecycle
  expires_at timestamptz,        -- Auto-dismiss time
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz,
  dismissed_at timestamptz,
  
  -- Constraints
  CONSTRAINT user_alerts_title_length CHECK (length(title) BETWEEN 1 AND 150),
  CONSTRAINT user_alerts_message_length CHECK (length(message) BETWEEN 1 AND 500),
  CONSTRAINT user_alerts_action_label_length CHECK (
    (actionable = false) OR (length(action_label) BETWEEN 1 AND 50)
  )
);

-- Indexes for Performance

-- Knowledge Timeline: User browsing their knowledge journey
CREATE INDEX IF NOT EXISTS idx_knowledge_timeline_basket_time 
  ON knowledge_timeline(basket_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_knowledge_timeline_workspace_time 
  ON knowledge_timeline(workspace_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_knowledge_timeline_significance 
  ON knowledge_timeline(significance, created_at DESC);

-- User Alerts: Real-time actionable items
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_active 
  ON user_alerts(user_id, created_at DESC) 
  WHERE dismissed_at IS NULL;
  
CREATE INDEX IF NOT EXISTS idx_user_alerts_workspace_active 
  ON user_alerts(workspace_id, created_at DESC) 
  WHERE dismissed_at IS NULL;
  
CREATE INDEX IF NOT EXISTS idx_user_alerts_actionable 
  ON user_alerts(user_id, actionable, created_at DESC) 
  WHERE dismissed_at IS NULL;

-- RLS Policies (Security)

-- Knowledge Timeline: Workspace members can read
ALTER TABLE knowledge_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_timeline_workspace_read" ON knowledge_timeline;
CREATE POLICY "knowledge_timeline_workspace_read" ON knowledge_timeline
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- User Alerts: Users can only see their own alerts
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_alerts_own_read" ON user_alerts;
CREATE POLICY "user_alerts_own_read" ON user_alerts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_alerts_own_update" ON user_alerts;
CREATE POLICY "user_alerts_own_update" ON user_alerts
  FOR UPDATE USING (user_id = auth.uid());

-- Helper Functions

-- Function to create knowledge timeline event
CREATE OR REPLACE FUNCTION emit_knowledge_event(
  p_basket_id uuid,
  p_workspace_id uuid,
  p_event_type knowledge_event_type,
  p_title text,
  p_description text DEFAULT NULL,
  p_significance event_significance DEFAULT 'medium',
  p_metadata jsonb DEFAULT '{}',
  p_related_ids jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO knowledge_timeline (
    basket_id, workspace_id, event_type, title, description, 
    significance, metadata, related_ids
  ) VALUES (
    p_basket_id, p_workspace_id, p_event_type, p_title, p_description,
    p_significance, p_metadata, p_related_ids
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user alert
CREATE OR REPLACE FUNCTION emit_user_alert(
  p_user_id uuid,
  p_workspace_id uuid,
  p_alert_type alert_type,
  p_title text,
  p_message text,
  p_severity alert_severity DEFAULT 'info',
  p_actionable boolean DEFAULT false,
  p_action_url text DEFAULT NULL,
  p_action_label text DEFAULT NULL,
  p_related_entities jsonb DEFAULT '{}',
  p_expires_at timestamptz DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  alert_id uuid;
BEGIN
  INSERT INTO user_alerts (
    user_id, workspace_id, alert_type, title, message, severity,
    actionable, action_url, action_label, related_entities, expires_at
  ) VALUES (
    p_user_id, p_workspace_id, p_alert_type, p_title, p_message, p_severity,
    p_actionable, p_action_url, p_action_label, p_related_entities, p_expires_at
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to dismiss user alert
CREATE OR REPLACE FUNCTION dismiss_user_alert(p_alert_id uuid) 
RETURNS boolean AS $$
BEGIN
  UPDATE user_alerts 
  SET dismissed_at = now() 
  WHERE id = p_alert_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark alert as read
CREATE OR REPLACE FUNCTION mark_alert_read(p_alert_id uuid) 
RETURNS boolean AS $$
BEGIN
  UPDATE user_alerts 
  SET read_at = now() 
  WHERE id = p_alert_id AND user_id = auth.uid() AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for Documentation
COMMENT ON TABLE knowledge_timeline IS 'Clean timeline showing knowledge evolution story - user-meaningful milestones only';
COMMENT ON TABLE user_alerts IS 'Real-time actionable alerts requiring user attention or awareness';

COMMENT ON TYPE knowledge_event_type IS 'Simplified event types focused on knowledge evolution story';
COMMENT ON TYPE alert_type IS 'Actionable alert types for things requiring user attention';

COMMENT ON FUNCTION emit_knowledge_event IS 'Create new knowledge timeline event - use for major milestones only';
COMMENT ON FUNCTION emit_user_alert IS 'Create new user alert - use for actionable items or important status changes';