import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = body?.document_id;
  const contextItemId = body?.context_item_id;
  if (!documentId || !contextItemId) return NextResponse.json({ error: "document_id and context_item_id required" }, { status: 400 });

  const role = body?.role ?? null;
  const weight = body?.weight ?? null;

  const res = await sql/* sql */`
    select public.fn_document_attach_context_item(${documentId}::uuid, ${contextItemId}::uuid, ${role}, ${weight}) as link_id
  `;
  return NextResponse.json({ link_id: res.rows?.[0]?.link_id || res.rows?.[0]?.fn_document_attach_context_item });
}