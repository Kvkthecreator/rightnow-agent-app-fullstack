import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { id } = params;
  return {
    title: `Graph - Basket ${id}`,
    description: 'Interactive graph visualization of memory relationships',
  };
}

const GraphView = dynamic(() => import('@/components/graph/GraphView').then(m => m.GraphView), {
  loading: () => <div className="h-64 animate-pulse" />,
});

export default async function GraphPage({ params }: PageProps) {
  const { id: basketId } = params;
  
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Verify basket exists and user has access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name, user_id, visibility, workspace_id')
      .eq('id', basketId)
      .maybeSingle();

    if (basketError || !basket) {
      console.error('Basket lookup error:', basketError);
      notFound();
    }

    // Check access permissions
    const hasAccess = basket.workspace_id === workspace.id || 
      (basket.visibility === 'public' && basket.user_id === userId) ||
      basket.user_id === userId;

    if (!hasAccess) {
      notFound();
    }

    // Fetch graph data (nodes and relationships)
    const [documentsResult, blocksResult, dumpsResult, contextItemsResult] = await Promise.all([
      supabase
        .from('documents')
        .select('id, title, created_at, updated_at, metadata')
        .eq('basket_id', basketId)
        .limit(100),
      
      supabase
        .from('context_blocks')
        .select('id, title, body_md, state, version, created_at, metadata')
        .eq('basket_id', basketId)
        .limit(100),
      
      supabase
        .from('raw_dumps')
        .select('id, char_count, source_type, created_at, preview')
        .eq('basket_id', basketId)
        .limit(50),
      
      supabase
        .from('context_items')
        .select('id, content_text, context_type, is_validated, created_at')
        .eq('basket_id', basketId)
        .limit(50)
    ]);

    // Fetch substrate references to build relationships
    const { data: references } = await supabase
      .from('substrate_references')
      .select(`
        id,
        document_id,
        substrate_type,
        substrate_id,
        role,
        weight,
        created_at
      `)
      .in('document_id', documentsResult.data?.map(d => d.id) || []);

    const graphData = {
      documents: documentsResult.data || [],
      blocks: blocksResult.data || [],
      dumps: dumpsResult.data || [],
      contextItems: contextItemsResult.data || [],
      references: references || []
    };

    return (
      <GraphView 
        basketId={basketId}
        basketTitle={basket.name}
        graphData={graphData}
        canEdit={basket.user_id === userId}
      />
    );
  } catch (error) {
    console.error('Graph page error:', error);
    notFound();
  }
}
