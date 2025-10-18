import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';
import { ensureSingleWorkspace } from '@/lib/canon/WorkspaceResolver';
import { listBasketsByWorkspace } from '@/lib/baskets/listBasketsByWorkspace';
import WorkspaceChangeRequestsClient, { type UnassignedCapture } from '@/components/workspace/ChangeRequestsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Workspace Change Requests Page
 *
 * Canon: YARNNN_GOVERNANCE_CANON_V5.md
 * Shows workspace-level change requests including:
 * - Type 1a: Basket assignment requests (unassigned captures)
 * - Type 1b: Cross-basket operations (future)
 * - Type 1c: Workspace mutations (future)
 */
export default async function WorkspaceChangeRequestsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const workspace = await ensureSingleWorkspace(user.id, supabase);

  const { data: captures } = await supabase
    .from('mcp_unassigned_captures')
    .select('id, tool, summary, payload, fingerprint, candidates, status, assigned_basket_id, created_at')
    .eq('workspace_id', workspace.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: baskets } = await listBasketsByWorkspace(workspace.id);

  return (
    <WorkspaceChangeRequestsClient
      captures={(captures ?? []) as UnassignedCapture[]}
      baskets={baskets ?? []}
    />
  );
}
