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
    .select('id,name,status,created_at,updated_at,mode')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[baskets/page] Failed to load baskets', error.message);
    throw error;
  }

  const { data: pendingProposals } = await supabase
    .from('proposals')
    .select('id,basket_id,created_at,origin,metadata,source_host,source_session')
    .eq('workspace_id', workspace.id)
    .eq('status', 'PROPOSED');

  const proposalsByBasket = new Map<string, { count: number; lastCreatedAt: string | null; origin: string | null; host: string | null }>();
  (pendingProposals ?? []).forEach((proposal) => {
    const entry = proposalsByBasket.get(proposal.basket_id) ?? { count: 0, lastCreatedAt: null, origin: null, host: null };
    entry.count += 1;
    if (!entry.lastCreatedAt || (proposal.created_at && proposal.created_at > entry.lastCreatedAt)) {
      entry.lastCreatedAt = proposal.created_at ?? entry.lastCreatedAt;
      entry.origin = proposal.origin ?? entry.origin;
      entry.host = proposal.source_host ?? (proposal.metadata?.source_host ?? entry.host);
    }
    proposalsByBasket.set(proposal.basket_id, entry);
  });

  const summaries = (baskets ?? []).map((basket) => ({
    id: basket.id,
    name: basket.name,
    status: basket.status,
    created_at: basket.created_at,
    updated_at: basket.updated_at,
    mode: basket.mode,
    pendingProposals: proposalsByBasket.get(basket.id) ?? { count: 0, lastCreatedAt: null, origin: null, host: null },
  }));

  return <BasketsIndexClient baskets={summaries} />;
}
