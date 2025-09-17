-- Comprehensive fix for CANON VIOLATION: Multiple workspaces per user
-- This migration consolidates all workspace data before deleting redundant workspaces

-- First, let's see what data exists in each workspace
DO $$
DECLARE
  violating_user_id uuid := 'aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2';
BEGIN
  RAISE NOTICE 'Analyzing workspaces for user %', violating_user_id;
  
  -- Show workspace details
  FOR workspace_record IN 
    SELECT 
      w.id,
      w.name,
      w.created_at,
      (SELECT COUNT(*) FROM baskets WHERE workspace_id = w.id) as basket_count,
      (SELECT COUNT(*) FROM raw_dumps WHERE workspace_id = w.id) as dump_count,
      (SELECT COUNT(*) FROM agent_processing_queue WHERE workspace_id = w.id) as queue_count,
      (SELECT COUNT(*) FROM timeline_events WHERE workspace_id = w.id) as event_count,
      (SELECT COUNT(*) FROM documents WHERE workspace_id = w.id) as document_count,
      (SELECT COUNT(*) FROM proposals WHERE workspace_id = w.id) as proposal_count
    FROM workspaces w
    JOIN workspace_memberships wm ON w.id = wm.workspace_id
    WHERE wm.user_id = violating_user_id AND wm.role = 'owner'
    ORDER BY w.created_at
  LOOP
    RAISE NOTICE 'Workspace %: % baskets, % dumps, % queue items, % events, % documents, % proposals', 
      workspace_record.id, 
      workspace_record.basket_count,
      workspace_record.dump_count,
      workspace_record.queue_count,
      workspace_record.event_count,
      workspace_record.document_count,
      workspace_record.proposal_count;
  END LOOP;
END $$;

-- Now consolidate everything into the primary workspace
DO $$
DECLARE
  violating_user_id uuid := 'aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2';
  primary_workspace_id uuid;
  workspace_record record;
  total_moved record;
BEGIN
  -- The primary workspace is 99e6bf7d-513c-45ff-9b96-9362bd914d12 (has the most data)
  primary_workspace_id := '99e6bf7d-513c-45ff-9b96-9362bd914d12';
  
  RAISE NOTICE 'Consolidating all data into primary workspace: %', primary_workspace_id;
  
  -- Initialize counters
  total_moved := ROW(0, 0, 0, 0, 0, 0, 0, 0);
  
  -- Process each non-primary workspace
  FOR workspace_record IN 
    SELECT w.id
    FROM workspaces w
    JOIN workspace_memberships wm ON w.id = wm.workspace_id
    WHERE wm.user_id = violating_user_id 
      AND wm.role = 'owner'
      AND w.id != primary_workspace_id
  LOOP
    RAISE NOTICE 'Processing workspace %', workspace_record.id;
    
    -- Move all workspace-scoped tables
    UPDATE baskets SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f1 = ROW_COUNT;
    
    UPDATE raw_dumps SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f2 = ROW_COUNT;
    
    UPDATE agent_processing_queue SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f3 = ROW_COUNT;
    
    UPDATE timeline_events SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f4 = ROW_COUNT;
    
    UPDATE documents SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f5 = ROW_COUNT;
    
    UPDATE proposals SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f6 = ROW_COUNT;
    
    UPDATE share_tokens SET workspace_id = primary_workspace_id WHERE workspace_id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f7 = ROW_COUNT;
    
    -- Delete workspace settings if exists
    DELETE FROM workspace_governance_settings WHERE workspace_id = workspace_record.id;
    
    -- Delete the workspace membership
    DELETE FROM workspace_memberships WHERE workspace_id = workspace_record.id;
    
    -- Now safe to delete the workspace
    DELETE FROM workspaces WHERE id = workspace_record.id;
    GET DIAGNOSTICS total_moved.f8 = ROW_COUNT;
    
    RAISE NOTICE 'Moved: % baskets, % dumps, % queue items, % events, % documents, % proposals, % tokens. Deleted % workspace.',
      total_moved.f1, total_moved.f2, total_moved.f3, total_moved.f4, 
      total_moved.f5, total_moved.f6, total_moved.f7, total_moved.f8;
  END LOOP;
  
  RAISE NOTICE 'Consolidation complete for user %', violating_user_id;
END $$;

-- Verify the fix
DO $$
DECLARE
  workspace_count integer;
BEGIN
  SELECT COUNT(*) INTO workspace_count
  FROM workspace_memberships 
  WHERE user_id = 'aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2' 
    AND role = 'owner';
    
  IF workspace_count = 1 THEN
    RAISE NOTICE '✅ Canon compliance restored: User now has exactly 1 workspace';
  ELSE
    RAISE WARNING '❌ User still has % workspaces', workspace_count;
  END IF;
END $$;