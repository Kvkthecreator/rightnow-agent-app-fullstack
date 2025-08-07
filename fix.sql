-- Drop all existing INSERT policies for raw_dumps
DROP POLICY IF EXISTS "authenticated_users_insert_raw_dumps" ON public.raw_dumps;
DROP POLICY IF EXISTS "dump_member_insert" ON public.raw_dumps;

-- Create single, clear INSERT policy for authenticated workspace members
CREATE POLICY "raw_dumps_workspace_insert" ON public.raw_dumps 
FOR INSERT 
TO authenticated 
WITH CHECK (
    workspace_id IN (
        SELECT workspace_memberships.workspace_id
        FROM public.workspace_memberships
        WHERE workspace_memberships.user_id = auth.uid()
    )
);

-- Verify the fix by checking policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'raw_dumps' 
AND cmd = 'INSERT';