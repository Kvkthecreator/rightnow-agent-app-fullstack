import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { notFound } from 'next/navigation';
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

  // Validate document exists and user has access
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, basket_id, title, content_raw, created_at, updated_at, metadata, workspace_id')
    .eq('id', docId)
    .maybeSingle();

  if (documentError || !document) {
    notFound();
  }

  // Check workspace access and basket match
  if (document.workspace_id !== workspace.id || document.basket_id !== basketId) {
    notFound();
  }

  return <DocumentPage document={document} basketId={basketId} />;
}
