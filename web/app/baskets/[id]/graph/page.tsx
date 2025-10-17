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
    title: 'Neural Map',
    description: 'Visualize your thinking brain - see how memories cluster into neural patterns',
  };
}

const NeuralMapView = dynamic(() => import('@/components/neural/NeuralMapView'), {
  loading: () => (
    <div className="h-64 animate-pulse bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg flex items-center justify-center">
      <div className="text-white text-sm">Activating neural pathways...</div>
    </div>
  ),
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

    // Fetch blocks for neural map visualization
    const blocksResult = await supabase
      .from('blocks')
      .select('id, semantic_type, content, title, confidence_score, created_at, metadata, status')
      .eq('basket_id', basketId)
      .eq('workspace_id', workspace.id)
      .in('state', ['ACCEPTED', 'LOCKED', 'CONSTANT'])
      .neq('status', 'archived')
      .order('created_at', { ascending: true })
      .limit(500);

    if (blocksResult.error) {
      console.error('Blocks query error:', blocksResult.error);
      throw new Error(`Blocks query failed: ${blocksResult.error.message}`);
    }

    return (
      <BasketSubpageLayout
        basketId={basketId}
        title="Neural Map"
        description="Your thinking brain - visualize how memories cluster into neural patterns"
      >
        <SectionCard>
          <NeuralMapView
            basketId={basketId}
            basketTitle={basket.name}
            blocks={blocksResult.data || []}
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
