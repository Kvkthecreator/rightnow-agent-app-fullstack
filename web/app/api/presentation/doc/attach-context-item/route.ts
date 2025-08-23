import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

export async function POST(req: Request) {
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

  return NextResponse.json({ link_id: data });
}