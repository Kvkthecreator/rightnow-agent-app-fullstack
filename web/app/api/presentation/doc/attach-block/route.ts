import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const documentId = body?.document_id;
  const blockId = body?.block_id;
  if (!documentId || !blockId) return NextResponse.json({ error: "document_id and block_id required" }, { status: 400 });

  const occ = body?.occurrences ?? 0;
  const snippets = body?.snippets ?? [];

  const { data, error } = await supabase.rpc('fn_document_attach_block', {
    p_document_id: documentId,
    p_block_id: blockId,
    p_occurrences: occ,
    p_snippets: snippets
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link_id: data });
}