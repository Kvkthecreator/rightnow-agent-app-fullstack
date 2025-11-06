-- Add RLS policies for work platform tables (Phase 1)
-- Created: 2025-11-06
-- Purpose: Enable Row Level Security on projects, work_sessions, work_artifacts, work_checkpoints
--
-- Security Model: Workspace-scoped access via workspace_memberships
-- - Users can only access data in workspaces they're members of
-- - Service role has full access for backend operations

BEGIN;

-- =====================================================
-- 1. Projects Table - RLS Policies
-- =====================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view projects in their workspace
CREATE POLICY "Users can view projects in their workspace"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can create projects in their workspace
CREATE POLICY "Users can create projects in their workspace"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can update projects they created in their workspace
CREATE POLICY "Users can update projects in their workspace"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can delete projects in their workspace
CREATE POLICY "Users can delete projects in their workspace"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to projects"
  ON projects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. Work Sessions Table - RLS Policies
-- =====================================================

ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view work sessions in their workspace
CREATE POLICY "Users can view work_sessions in their workspace"
  ON work_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = work_sessions.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can create work sessions in their workspace
CREATE POLICY "Users can create work_sessions in their workspace"
  ON work_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = work_sessions.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can update work sessions in their workspace
CREATE POLICY "Users can update work_sessions in their workspace"
  ON work_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = work_sessions.workspace_id
        AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = work_sessions.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can delete work sessions in their workspace
CREATE POLICY "Users can delete work_sessions in their workspace"
  ON work_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = work_sessions.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to work_sessions"
  ON work_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. Work Artifacts Table - RLS Policies
-- =====================================================

ALTER TABLE work_artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view artifacts for sessions in their workspace
CREATE POLICY "Users can view work_artifacts in their workspace"
  ON work_artifacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_artifacts.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can create artifacts for sessions in their workspace
CREATE POLICY "Users can create work_artifacts in their workspace"
  ON work_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_artifacts.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can update artifacts for sessions in their workspace
CREATE POLICY "Users can update work_artifacts in their workspace"
  ON work_artifacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_artifacts.work_session_id
        AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_artifacts.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can delete artifacts for sessions in their workspace
CREATE POLICY "Users can delete work_artifacts in their workspace"
  ON work_artifacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_artifacts.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to work_artifacts"
  ON work_artifacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. Work Checkpoints Table - RLS Policies
-- =====================================================

ALTER TABLE work_checkpoints ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view checkpoints for sessions in their workspace
CREATE POLICY "Users can view work_checkpoints in their workspace"
  ON work_checkpoints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_checkpoints.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can create checkpoints for sessions in their workspace
CREATE POLICY "Users can create work_checkpoints in their workspace"
  ON work_checkpoints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_checkpoints.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can update checkpoints for sessions in their workspace
CREATE POLICY "Users can update work_checkpoints in their workspace"
  ON work_checkpoints
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_checkpoints.work_session_id
        AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_checkpoints.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can delete checkpoints for sessions in their workspace
CREATE POLICY "Users can delete work_checkpoints in their workspace"
  ON work_checkpoints
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_sessions ws
      JOIN workspace_memberships wm ON wm.workspace_id = ws.workspace_id
      WHERE ws.id = work_checkpoints.work_session_id
        AND wm.user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to work_checkpoints"
  ON work_checkpoints
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- =====================================================
-- Summary
-- =====================================================
-- Enabled RLS and added workspace-scoped policies for:
-- 1. projects - Direct workspace_id check
-- 2. work_sessions - Direct workspace_id check
-- 3. work_artifacts - Via work_sessions join
-- 4. work_checkpoints - Via work_sessions join
--
-- All tables have:
-- - SELECT/INSERT/UPDATE/DELETE policies for authenticated users
-- - Full access for service_role
-- - Workspace membership validation via workspace_memberships table
