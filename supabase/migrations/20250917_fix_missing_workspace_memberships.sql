-- Fix missing workspace_memberships for workspace owners
-- This causes RLS policies to fail when users try to create work entries

-- Insert missing owner memberships
INSERT INTO public.workspace_memberships (workspace_id, user_id, role)
SELECT 
  w.id as workspace_id,
  w.owner_id as user_id,
  'owner' as role
FROM public.workspaces w
LEFT JOIN public.workspace_memberships wm ON (w.id = wm.workspace_id AND w.owner_id = wm.user_id)
WHERE wm.user_id IS NULL  -- No membership exists for owner
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Show what was fixed
DO $$
DECLARE
  fixed_count integer;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM public.workspaces w
  LEFT JOIN public.workspace_memberships wm ON (w.id = wm.workspace_id AND w.owner_id = wm.user_id)
  WHERE wm.user_id IS NOT NULL;
  
  RAISE NOTICE 'Fixed workspace memberships. Total valid memberships: %', fixed_count;
END $$;

COMMENT ON TABLE public.workspace_memberships IS 
'Canon-critical: workspace_memberships table drives all RLS policies. Every workspace owner MUST have a membership record for authentication to work.';