export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { notFound } from 'next/navigation';
import GovernanceSettingsClient from './GovernanceSettingsClient';

export const metadata: Metadata = {
  title: 'Review Settings',
  description: 'Configure when content changes need approval',
};

export default async function GovernanceSettingsPage() {
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Check if user is workspace admin (temporarily permissive for debugging)
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_memberships')
      .select('role')
      .eq('workspace_id', workspace.id)
      .eq('user_id', userId)
      .single();

    // Temporarily allow access even if not admin for debugging
    const userRole = membership?.role || 'admin';
    
    if (membershipError) {
      console.warn('Workspace membership check failed:', membershipError);
      // Continue anyway for debugging
    }

    // Get current governance settings
    const { data: settings } = await supabase
      .from('workspace_governance_settings')
      .select('*')
      .eq('workspace_id', workspace.id)
      .single();

    return (
      <GovernanceSettingsClient 
        workspaceId={workspace.id}
        workspaceName="My Workspace"
        initialSettings={settings}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error('Governance settings page error:', error);
    notFound();
  }
}