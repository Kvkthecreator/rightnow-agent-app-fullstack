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
    description: 'Visual exploration of connections between your knowledge',
  };
}

const GraphView = dynamic(() => import('@/components/graph/GraphView').then(m => m.GraphView), {
  loading: () => <div className="h-64 animate-pulse" />,
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

    // Fetch substrate data only (Canon-compliant graph)
    const [blocksResult, dumpsResult, contextItemsResult, relationshipsResult] = await Promise.all([
      supabase
        .from('blocks')
        .select('id, semantic_type, content, title, body_md, confidence_score, created_at, meta_agent_notes, state, status')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .in('state', ['ACCEPTED', 'LOCKED', 'CONSTANT']) // Only approved substrate
        .limit(100),
      
      supabase
        .from('raw_dumps')
        .select('id, basket_id, body_md, created_at, processing_status, file_url, source_meta')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .neq('processing_status', 'redacted')
        .limit(50),
        
      supabase
        .from('context_items')
        .select('id, title, content, semantic_meaning, semantic_category, type, metadata, created_at, state, status')
        .eq('basket_id', basketId)
        .in('state', ['ACTIVE', 'DEPRECATED'])
        .limit(100),
        
      // Canon-aligned relationships table
      supabase
        .from('substrate_relationships')
        .select('id, basket_id, from_id, to_id, relationship_type, from_type, to_type, strength, description')
        .eq('basket_id', basketId)
        .limit(500)
    ]);

    // Check for database errors that might cause notFound()
    if (blocksResult.error) {
      console.error('Blocks query error:', blocksResult.error);
      throw new Error(`Blocks query failed: ${blocksResult.error.message}`);
    }
    if (dumpsResult.error) {
      console.error('Dumps query error:', dumpsResult.error);
      throw new Error(`Dumps query failed: ${dumpsResult.error.message}`);
    }
    if (contextItemsResult.error) {
      console.error('Context items query error:', contextItemsResult.error);
      throw new Error(`Context items query failed: ${contextItemsResult.error.message}`);
    }
    if (relationshipsResult.error) {
      console.error('Relationships query error:', relationshipsResult.error);
      throw new Error(`Relationships query failed: ${relationshipsResult.error.message}`);
    }

    const relationships = (relationshipsResult.data || []).map((r: any) => ({
      ...r,
      // Normalize field name for GraphView expectations
      strength: typeof r.strength === 'number' ? r.strength : r.weight ?? 0.7,
      description: r.description ?? null,
    }));

    const graphData = {
      blocks: blocksResult.data || [],
      dumps: dumpsResult.data || [],
      context_items: contextItemsResult.data || [],
      relationships,
    };

    return (
      <BasketSubpageLayout
        basketId={basketId}
        title="Knowledge Connections"
        description="Visual exploration of connections between your knowledge blocks and meanings"
      >
        <SectionCard>
          <GraphView 
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
