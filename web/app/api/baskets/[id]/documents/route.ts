import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { GetDocumentsResponseSchema, type DocumentDTO } from '@shared/contracts/documents';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  
  // Authentication and workspace validation
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  // Validate basket belongs to workspace
  const { data: basket, error: basketError } = await supabase
    .from('baskets')
    .select('id, workspace_id')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  if (basketError || !basket) {
    return NextResponse.json({ error: 'basket not found' }, { status: 404 });
  }

  // Query documents with proper schema
  const { data, error } = await supabase
    .from('documents')
    .select('id, basket_id, title, created_at, updated_at, metadata')
    .eq('basket_id', id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Transform to DocumentDTO format
  const documents: DocumentDTO[] = (data || []).map(doc => ({
    id: doc.id,
    basket_id: doc.basket_id,
    title: doc.title,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    metadata: doc.metadata || {},
  }));

  return withSchema(GetDocumentsResponseSchema, {
    documents,
    last_cursor: documents.length > 0 ? documents[documents.length - 1].updated_at : undefined,
  }, { status: 200 });
}
