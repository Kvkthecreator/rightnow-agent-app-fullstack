import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { notFound } from 'next/navigation';
import { BasketWrapper } from '@/components/basket/BasketWrapper';
import { DocumentPage } from '@/components/documents/DocumentPage';

interface PageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id: basketId, docId } = await params;
  
  // Authentication and workspace validation
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  // Validate document exists and user has access (Canon v3.0: use document_heads for content)
  const { data: document, error: documentError } = await supabase
    .from('document_heads')
    .select('document_id, basket_id, title, content, document_created_at, document_updated_at, document_metadata, workspace_id')
    .eq('document_id', docId)
    .maybeSingle();

  if (documentError || !document) {
    notFound();
  }

  // Check workspace access and basket match
  if (document.workspace_id !== workspace.id || document.basket_id !== basketId) {
    notFound();
  }

  // Fetch additional basket data for context
  const { data: basketDetails } = await supabase
    .from('baskets')
    .select('name, description, status, created_at, last_activity_ts, tags, origin_template')
    .eq('id', basketId)
    .maybeSingle();

  // Create basket object with safe defaults
  const basket = {
    id: basketId,
    name: basketDetails?.name || 'Basket',
    workspace_id: workspace.id,
    description: basketDetails?.description || null,
    status: basketDetails?.status || null,
    created_at: basketDetails?.created_at || new Date().toISOString(),
    last_activity_ts: basketDetails?.last_activity_ts || null,
    tags: basketDetails?.tags || null,
    origin_template: basketDetails?.origin_template || null,
  };

  // Map document_heads view fields to DocumentPage expected format
  const documentForPage = {
    id: document.document_id,
    basket_id: document.basket_id,
    workspace_id: document.workspace_id,
    title: document.title,
    content: document.content,
    created_at: document.document_created_at,
    updated_at: document.document_updated_at,
    metadata: document.document_metadata
  };

  return (
    <BasketWrapper basket={basket}>
      <DocumentPage document={documentForPage} basketId={basketId} />
    </BasketWrapper>
  );
}
