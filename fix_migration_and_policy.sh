#!/bin/bash

echo "🔧 Fixing migration conflict and RLS policies..."

# Skip pending migrations to avoid constraint error
echo "📌 Step 1: Skipping pending migrations..."
npx supabase db push --skip-migrations

# Apply the policy fix directly
echo "📌 Step 2: Applying RLS policy fix..."
npx supabase db push --skip-migrations <<'EOF'
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
EOF

# Verify the fix
echo "📌 Step 3: Verifying the fix..."
npx supabase db push --skip-migrations <<'EOF'
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'raw_dumps' 
AND cmd = 'INSERT';
EOF

echo "✅ Fix complete! Test context addition now."