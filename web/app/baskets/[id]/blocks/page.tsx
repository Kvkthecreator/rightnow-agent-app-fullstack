import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { BlocksListView } from '@/components/blocks/BlocksListView';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Blocks - Basket ${id}`,
    description: 'View and manage context blocks in this basket',
  };
}

export default async function BlocksPage({ params }: PageProps) {
  const { id: basketId } = await params;
  
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Verify basket exists and user has access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, title, user_id, visibility, workspace_id')
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

    // Fetch blocks for this basket
    const { data: blocks, error: blocksError } = await supabase
      .from('context_blocks')
      .select('id, basket_id, title, body_md, state, version, created_at, updated_at, metadata')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (blocksError) {
      console.error('Blocks fetch error:', blocksError);
    }

    return (
      <BlocksListView 
        basketId={basketId}
        basketTitle={basket.title}
        initialBlocks={blocks || []}
        canEdit={basket.user_id === userId}
      />
    );
  } catch (error) {
    console.error('Blocks page error:', error);
    notFound();
  }
}
