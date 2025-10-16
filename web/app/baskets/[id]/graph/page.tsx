import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import BasketSubpageLayout from '@/components/layouts/BasketSubpageLayout';
import { SectionCard } from '@/components/ui/SectionCard';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Causal Graph',
    description: 'Explore causal relationships between knowledge blocks',
  };
}

const CausalGraphView = dynamic(() => import('@/components/graph/CausalGraphView'), {
  loading: () => <div className="h-64 animate-pulse bg-slate-50 rounded-lg" />,
  ssr: false,
});

export default async function GraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: basketId } = await params;

  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Verify basket exists and user has access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name, user_id, workspace_id')
      .eq('id', basketId)
      .maybeSingle();

    if (basketError || !basket) {
      console.error('Basket lookup error:', basketError);
      notFound();
    }

    // Check access permissions
    const hasAccess = basket.workspace_id === workspace.id ||
      basket.user_id === userId;

    if (!hasAccess) {
      notFound();
    }

    // V3.1: Fetch blocks and causal relationships only
    const [blocksResult, relationshipsResult] = await Promise.all([
      supabase
        .from('blocks')
        .select('id, semantic_type, content, title, confidence_score, created_at, metadata, status')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(500),

      supabase
        .from('substrate_relationships')
        .select('id, from_block_id, to_block_id, relationship_type, confidence_score, created_at, metadata')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(2000)
    ]);

    if (blocksResult.error) {
      console.error('Blocks query error:', blocksResult.error);
      throw new Error(`Blocks query failed: ${blocksResult.error.message}`);
    }

    if (relationshipsResult.error) {
      console.error('Relationships query error:', relationshipsResult.error);
      throw new Error(`Relationships query failed: ${relationshipsResult.error.message}`);
    }

    const graphData = {
      blocks: blocksResult.data || [],
      relationships: relationshipsResult.data || [],
    };

    return (
      <BasketSubpageLayout
        basketId={basketId}
        title="Causal Graph"
        description="Visual exploration of causal relationships between knowledge blocks"
      >
        <SectionCard>
          <CausalGraphView
            basketId={basketId}
            basketTitle={basket.name}
            graphData={graphData}
            canEdit={basket.user_id === userId}
          />
        </SectionCard>
      </BasketSubpageLayout>
    );
  } catch (error) {
    console.error('Graph page error:', error);
    notFound();
  }
}
