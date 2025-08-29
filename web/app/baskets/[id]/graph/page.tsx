import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Graph - Basket ${id}`,
    description: 'Interactive graph visualization of memory relationships',
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

    // Fetch graph data - simplified for debugging
    const [documentsResult, blocksResult, dumpsResult] = await Promise.all([
      supabase
        .from('documents')
        .select('*')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .limit(100),
      
      supabase
        .from('blocks')
        .select('*')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .limit(100),
      
      supabase
        .from('raw_dumps')
        .select('id, basket_id, body_md, created_at, processing_status, file_url, source_meta')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .limit(50)
    ]);

    // Check for database errors that might cause notFound()
    if (documentsResult.error) {
      console.error('Documents query error:', documentsResult.error);
      throw new Error(`Documents query failed: ${documentsResult.error.message}`);
    }
    if (blocksResult.error) {
      console.error('Blocks query error:', blocksResult.error);
      throw new Error(`Blocks query failed: ${blocksResult.error.message}`);
    }
    if (dumpsResult.error) {
      console.error('Dumps query error:', dumpsResult.error);
      throw new Error(`Dumps query failed: ${dumpsResult.error.message}`);
    }

    // Note: Substrate references temporarily disabled to debug
    // const { data: references } = await supabase
    //   .from('substrate_references')  
    //   .select(`...`)

    const graphData = {
      documents: documentsResult.data || [],
      blocks: blocksResult.data || [],
      dumps: dumpsResult.data || [],
      references: []
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
