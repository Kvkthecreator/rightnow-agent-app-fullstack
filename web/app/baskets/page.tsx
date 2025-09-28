import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { BasketsIndexClient } from './BasketsIndexClient';

export const dynamic = 'force-dynamic';

export default async function BasketsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  const { data: baskets, error } = await supabase
    .from('baskets')
    .select('id,name,status,created_at,mode')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[baskets/page] Failed to load baskets', error.message);
    throw error;
  }

  const summaries = (baskets ?? []).map((basket) => ({
    id: basket.id,
    name: basket.name,
    status: basket.status,
    created_at: basket.created_at,
    mode: basket.mode,
  }));

  return <BasketsIndexClient baskets={summaries} />;
}
