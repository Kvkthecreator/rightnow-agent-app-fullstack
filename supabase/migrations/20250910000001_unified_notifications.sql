-- YARNNN Unified Notification System - Canon v1.0.0 Compliant
-- Migration: Create unified notification tables and governance settings

-- ============================================================================
-- User Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification classification
    type TEXT NOT NULL, -- NotificationType enum values
    category TEXT NOT NULL CHECK (category IN ('substrate', 'presentation', 'work', 'governance', 'system')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'success', 'warning', 'error', 'critical')),
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channels JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of channel names
    
    -- Persistence settings
    persistence_settings JSONB NOT NULL DEFAULT '{
        "cross_page": true,
        "auto_dismiss": true,
        "requires_acknowledgment": false
    }'::JSONB,
    cross_page_persist BOOLEAN GENERATED ALWAYS AS ((persistence_settings->>'cross_page')::BOOLEAN) STORED,
    
    -- Interactions and actions
    actions JSONB DEFAULT '[]'::JSONB,
    related_entities JSONB DEFAULT '{}'::JSONB,
    governance_context JSONB DEFAULT '{
        "requires_approval": false,
        "auto_approvable": true,
        "smart_review_eligible": false,
        "permission_level": "editor"
    }'::JSONB,
    
    -- State tracking
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'acknowledged')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    
    -- Performance indexes
    CONSTRAINT valid_channels CHECK (jsonb_typeof(channels) = 'array'),
    CONSTRAINT valid_actions CHECK (jsonb_typeof(actions) = 'array'),
    CONSTRAINT valid_related_entities CHECK (jsonb_typeof(related_entities) = 'object'),
    CONSTRAINT valid_governance_context CHECK (jsonb_typeof(governance_context) = 'object')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS user_notifications_workspace_user_idx 
    ON user_notifications(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS user_notifications_status_idx 
    ON user_notifications(status) WHERE status != 'dismissed';
CREATE INDEX IF NOT EXISTS user_notifications_category_idx 
    ON user_notifications(category);
CREATE INDEX IF NOT EXISTS user_notifications_severity_idx 
    ON user_notifications(severity);
CREATE INDEX IF NOT EXISTS user_notifications_cross_page_idx 
    ON user_notifications(cross_page_persist) WHERE cross_page_persist = true;
CREATE INDEX IF NOT EXISTS user_notifications_created_at_idx 
    ON user_notifications(created_at DESC);

-- Cleanup old notifications (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM user_notifications
    WHERE id IN (
        SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (
                       PARTITION BY workspace_id, user_id 
                       ORDER BY created_at DESC
                   ) as rn
            FROM user_notifications
        ) ranked
        WHERE rn > 100
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Workspace Notification Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspace_notification_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    
    settings JSONB NOT NULL DEFAULT '{
        "substrate_notifications": {
            "enabled": true,
            "filter": "all",
            "batch_low_priority": false,
            "smart_approval_integration": true
        },
        "presentation_notifications": {
            "enabled": true,
            "document_composition": true,
            "document_impacts": true,
            "cross_page_persist": true
        },
        "work_notifications": {
            "enabled": true,
            "show_all_workspace_work": false,
            "cascade_notifications": true,
            "failure_alerts": true
        },
        "ui_preferences": {
            "position": "top-right",
            "max_visible": 10,
            "auto_dismiss_delay": 5000,
            "sound_enabled": false,
            "badge_counts": true
        },
        "role_based_routing": {
            "admin_escalations": true,
            "collaborator_mentions": true,
            "governance_alerts": true
        }
    }'::JSONB,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT REFERENCES auth.users(id),
    
    CONSTRAINT valid_settings CHECK (jsonb_typeof(settings) = 'object')
);

CREATE INDEX IF NOT EXISTS workspace_notification_settings_workspace_idx 
    ON workspace_notification_settings(workspace_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_notification_settings ENABLE ROW LEVEL SECURITY;

-- User notifications policies
CREATE POLICY "Users can read own notifications"
    ON user_notifications FOR SELECT
    USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert own notifications"
    ON user_notifications FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own notifications"
    ON user_notifications FOR UPDATE
    USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete own notifications"
    ON user_notifications FOR DELETE
    USING (auth.uid()::TEXT = user_id);

-- Workspace notification settings policies
CREATE POLICY "Workspace members can read notification settings"
    ON workspace_notification_settings FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_memberships 
            WHERE user_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Workspace admins can manage notification settings"
    ON workspace_notification_settings FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_memberships 
            WHERE user_id = auth.uid()::TEXT 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to create notification for user
CREATE OR REPLACE FUNCTION create_user_notification(
    p_workspace_id TEXT,
    p_user_id TEXT,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_severity TEXT DEFAULT 'info',
    p_channels JSONB DEFAULT '["toast"]'::JSONB,
    p_persistence_settings JSONB DEFAULT NULL,
    p_actions JSONB DEFAULT '[]'::JSONB,
    p_related_entities JSONB DEFAULT '{}'::JSONB,
    p_governance_context JSONB DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    notification_id TEXT;
    category TEXT;
    default_persistence JSONB;
    default_governance JSONB;
BEGIN
    -- Determine category from type
    CASE 
        WHEN p_type LIKE 'substrate.%' THEN category := 'substrate';
        WHEN p_type LIKE 'presentation.%' THEN category := 'presentation';
        WHEN p_type LIKE 'work.%' THEN category := 'work';
        WHEN p_type LIKE 'governance.%' THEN category := 'governance';
        ELSE category := 'system';
    END CASE;
    
    -- Set default persistence if not provided
    default_persistence := COALESCE(p_persistence_settings, '{
        "cross_page": true,
        "auto_dismiss": true,
        "requires_acknowledgment": false
    }'::JSONB);
    
    -- Set default governance context if not provided
    default_governance := COALESCE(p_governance_context, '{
        "requires_approval": false,
        "auto_approvable": true,
        "smart_review_eligible": false,
        "permission_level": "editor"
    }'::JSONB);
    
    -- Insert notification
    INSERT INTO user_notifications (
        workspace_id,
        user_id,
        type,
        category,
        severity,
        title,
        message,
        channels,
        persistence_settings,
        actions,
        related_entities,
        governance_context
    ) VALUES (
        p_workspace_id,
        p_user_id,
        p_type,
        category,
        p_severity,
        p_title,
        p_message,
        p_channels,
        default_persistence,
        p_actions,
        p_related_entities,
        default_governance
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast notification to all workspace members
CREATE OR REPLACE FUNCTION broadcast_workspace_notification(
    p_workspace_id TEXT,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_severity TEXT DEFAULT 'info',
    p_channels JSONB DEFAULT '["toast"]'::JSONB,
    p_exclude_user_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    member_record RECORD;
BEGIN
    -- Create notification for each workspace member
    FOR member_record IN 
        SELECT user_id FROM workspace_memberships 
        WHERE workspace_id = p_workspace_id 
        AND (p_exclude_user_id IS NULL OR user_id != p_exclude_user_id)
    LOOP
        PERFORM create_user_notification(
            p_workspace_id,
            member_record.user_id,
            p_type,
            p_title,
            p_message,
            p_severity,
            p_channels
        );
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger for settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspace_notification_settings_updated_at
    BEFORE UPDATE ON workspace_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup trigger (run daily)
CREATE OR REPLACE FUNCTION schedule_notification_cleanup()
RETURNS void AS $$
BEGIN
    PERFORM cron.schedule('cleanup-old-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');
EXCEPTION
    WHEN undefined_table THEN
        -- pg_cron not available, ignore
        NULL;
END;
$$ LANGUAGE plpgsql;

-- Try to schedule cleanup (will fail gracefully if pg_cron not available)
SELECT schedule_notification_cleanup();

COMMENT ON TABLE user_notifications IS 'YARNNN Canon v1.0.0 - Unified notification storage with cross-page persistence';
COMMENT ON TABLE workspace_notification_settings IS 'YARNNN Canon v1.0.0 - Workspace-level notification governance settings';