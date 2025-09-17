-- Fix CANON VIOLATION: Multiple workspaces per user
-- YARNNN Canon requires exactly one workspace per user
-- This migration consolidates multiple workspaces into the most active one

-- Create a function to determine the primary workspace for a user
CREATE OR REPLACE FUNCTION determine_primary_workspace(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  primary_workspace_id uuid;
BEGIN
  -- Select the workspace with the most activity (baskets + dumps)
  -- If tied, prefer the oldest workspace
  SELECT w.id INTO primary_workspace_id
  FROM workspaces w
  JOIN workspace_memberships wm ON w.id = wm.workspace_id
  WHERE wm.user_id = p_user_id AND wm.role = 'owner'
  ORDER BY 
    (SELECT COUNT(*) FROM baskets WHERE workspace_id = w.id) +
    (SELECT COUNT(*) FROM raw_dumps WHERE workspace_id = w.id) DESC,
    w.created_at ASC
  LIMIT 1;
  
  RETURN primary_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- Fix the specific user with multiple workspaces
DO $$
DECLARE
  violating_user_id uuid := 'aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2';
  primary_workspace_id uuid;
  workspace_record record;
  moved_baskets integer := 0;
  moved_dumps integer := 0;
  deleted_workspaces integer := 0;
  row_count integer;
BEGIN
  -- Determine the primary workspace
  primary_workspace_id := determine_primary_workspace(violating_user_id);
  
  IF primary_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found for user %', violating_user_id;
  END IF;
  
  RAISE NOTICE 'Primary workspace selected: %', primary_workspace_id;
  
  -- Process each non-primary workspace
  FOR workspace_record IN 
    SELECT w.id, w.name
    FROM workspaces w
    JOIN workspace_memberships wm ON w.id = wm.workspace_id
    WHERE wm.user_id = violating_user_id 
      AND wm.role = 'owner'
      AND w.id != primary_workspace_id
  LOOP
    RAISE NOTICE 'Processing workspace % (%)', workspace_record.id, workspace_record.name;
    
    -- Move baskets to primary workspace
    UPDATE baskets 
    SET workspace_id = primary_workspace_id
    WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    moved_baskets := moved_baskets + row_count;
    
    -- Move raw_dumps to primary workspace
    UPDATE raw_dumps
    SET workspace_id = primary_workspace_id
    WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    moved_dumps := moved_dumps + row_count;
    
    -- Move any other workspace-scoped data
    -- (blocks, context_items, etc. are basket-scoped so will follow automatically)
    
    -- Delete the workspace membership
    DELETE FROM workspace_memberships 
    WHERE workspace_id = workspace_record.id AND user_id = violating_user_id;
    
    -- Delete the empty workspace
    DELETE FROM workspaces WHERE id = workspace_record.id;
    deleted_workspaces := deleted_workspaces + 1;
  END LOOP;
  
  RAISE NOTICE 'Canon violation fixed for user %', violating_user_id;
  RAISE NOTICE '- Primary workspace: %', primary_workspace_id;
  RAISE NOTICE '- Moved % baskets', moved_baskets;
  RAISE NOTICE '- Moved % dumps', moved_dumps;
  RAISE NOTICE '- Deleted % redundant workspaces', deleted_workspaces;
END $$;

-- Verify no users have multiple workspaces
DO $$
DECLARE
  violation_count integer;
BEGIN
  SELECT COUNT(*) INTO violation_count
  FROM (
    SELECT user_id, COUNT(DISTINCT workspace_id) as workspace_count
    FROM workspace_memberships
    WHERE role = 'owner'
    GROUP BY user_id
    HAVING COUNT(DISTINCT workspace_id) > 1
  ) violations;
  
  IF violation_count > 0 THEN
    RAISE WARNING 'Still have % users with multiple workspaces', violation_count;
  ELSE
    RAISE NOTICE '✅ Canon compliance verified: All users have exactly one workspace';
  END IF;
END $$;

-- Drop the temporary function
DROP FUNCTION determine_primary_workspace(uuid);

-- Add a constraint to prevent future violations
-- (This is a soft check via trigger since we can't have a direct constraint)
CREATE OR REPLACE FUNCTION check_single_workspace_per_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'owner' THEN
    -- Check if user already owns a workspace
    IF EXISTS (
      SELECT 1 FROM workspace_memberships 
      WHERE user_id = NEW.user_id 
        AND role = 'owner' 
        AND workspace_id != NEW.workspace_id
    ) THEN
      RAISE EXCEPTION 'CANON VIOLATION: User % already owns a workspace. Each user can only own one workspace.', NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single workspace per user
DROP TRIGGER IF EXISTS enforce_single_workspace_per_user ON workspace_memberships;
CREATE TRIGGER enforce_single_workspace_per_user
BEFORE INSERT OR UPDATE ON workspace_memberships
FOR EACH ROW
EXECUTE FUNCTION check_single_workspace_per_user();

COMMENT ON FUNCTION check_single_workspace_per_user() IS 
'Canon v1.4.0 enforcement: Each authenticated user belongs to exactly one workspace. This trigger prevents users from owning multiple workspaces.';