import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = body?.document_id;
  const blockId = body?.block_id;
  if (!documentId || !blockId) return NextResponse.json({ error: "document_id and block_id required" }, { status: 400 });

  const occ = body?.occurrences ?? 0;
  const snippets = body?.snippets ?? [];

  const res = await sql/* sql */`
    select public.fn_document_attach_block(${documentId}::uuid, ${blockId}::uuid, ${occ}, ${JSON.stringify(snippets)}::jsonb) as link_id
  `;
  return NextResponse.json({ link_id: res.rows?.[0]?.link_id || res.rows?.[0]?.fn_document_attach_block });
}