import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';
import { ensureSingleWorkspace } from '@/lib/canon/WorkspaceResolver';
import { listBasketsByWorkspace } from '@/lib/baskets/listBasketsByWorkspace';
import UnassignedQueueClient, { type UnassignedCapture } from '@/components/memory/UnassignedQueueClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UnassignedQueuePage() {
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
    <UnassignedQueueClient
      captures={(captures ?? []) as UnassignedCapture[]}
      baskets={baskets ?? []}
    />
  );
}
