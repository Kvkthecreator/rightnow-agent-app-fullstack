import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

// DEPRECATED: Use /documents/[id]/references API for Canon v1.3.1 compliance
// This endpoint violates substrate canon by treating context_items as special
export async function POST(req: Request) {
  console.warn('DEPRECATED: /presentation/doc/attach-context-item API violates substrate canon. Use /documents/[id]/references instead');
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const documentId = body?.document_id;
  const contextItemId = body?.context_item_id;
  if (!documentId || !contextItemId) return NextResponse.json({ error: "document_id and context_item_id required" }, { status: 400 });

  const role = body?.role ?? null;
  const weight = body?.weight ?? null;

  const { data, error } = await supabase.rpc('fn_document_attach_context_item', {
    p_document_id: documentId,
    p_context_item_id: contextItemId,
    p_role: role,
    p_weight: weight
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ link_id: data });
  response.headers.set('X-API-Deprecated', 'true');
  response.headers.set('X-API-Replacement', `/api/documents/${documentId}/references`);
  response.headers.set('X-API-Deprecation-Reason', 'Violates substrate canon - context_items not treated as peer to other substrates');
  return response;
}