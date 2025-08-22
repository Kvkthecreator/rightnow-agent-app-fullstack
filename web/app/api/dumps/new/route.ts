export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { z } from "zod";

function normalize(body: any) {
  const b = body ?? {};
  const n = (v: any) => (v === null || v === undefined ? undefined : v);

  return {
    basket_id:      b.basket_id ?? b.basketId,
    text_dump:      n(b.text_dump ?? b.text),
    file_urls:      n(
                      Array.isArray(b.file_urls) ? b.file_urls :
                      Array.isArray(b.fileUrls)  ? b.fileUrls  :
                      typeof b.file_url === "string" ? [b.file_url] :
                      typeof b.fileUrl === "string"  ? [b.fileUrl]  :
                      undefined
                    ),
    source_meta:    n(b.source_meta ?? b.meta),
    ingest_trace_id:n(b.ingest_trace_id ?? b.ingestTraceId),
    dump_request_id:b.dump_request_id ?? b.dumpRequestId ?? b.request_id,
  };
}

const Schema = z.object({
  basket_id: z.string().uuid(),
  text_dump: z.string().trim().min(1).optional(),        // optional but if present must be non-empty after trim
  file_urls: z.array(z.string().url()).nonempty().optional(), // optional but if present must have at least one
  source_meta: z.record(z.any()).optional(),
  ingest_trace_id: z.string().uuid().optional(),
  dump_request_id: z.string().uuid(),                     // required
}).refine(
  (d) => Boolean(d.text_dump) || Boolean(d.file_urls?.length),
  { message: "Provide non-empty text_dump or one/more file_urls" }
);

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = Schema.safeParse(normalize(raw));
    if (!parsed.success) {
      return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }
    const { basket_id, text_dump, file_urls, source_meta, ingest_trace_id, dump_request_id } = parsed.data;

    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await getAuthenticatedUser(supabase);

    // Resolve basket + workspace
    const { data: basket, error: bErr } = await supabase
      .from("baskets")
      .select("id, workspace_id")
      .eq("id", basket_id)
      .maybeSingle();
    if (bErr) return Response.json({ error: `Basket lookup failed: ${bErr.message}` }, { status: 400 });
    if (!basket) return Response.json({ error: "Basket not found" }, { status: 404 });

    // Verify membership (defense-in-depth; RLS still applies)
    const { data: membership, error: mErr } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", basket.workspace_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (mErr) return Response.json({ error: `Membership check failed: ${mErr.message}` }, { status: 400 });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

    // Idempotent RPC; DB trigger emits 'dump'
    const { data, error: rpcErr } = await supabase.rpc("fn_ingest_dumps", {
      p_workspace_id: basket.workspace_id,
      p_basket_id: basket_id,
      p_dumps: [
        {
          dump_request_id,
          text_dump: text_dump ?? null,
          file_urls: file_urls ?? null,
          source_meta: source_meta ?? null,
          ingest_trace_id: ingest_trace_id ?? null,
        },
      ],
    });

    if (rpcErr) {
      const code = rpcErr.code === "23505" ? 409 : 500;
      return Response.json({ error: "Ingest failed", details: rpcErr.message }, { status: code });
    }

    const dump_id = Array.isArray(data) && data[0]?.dump_id;
    if (!dump_id) return Response.json({ error: "Ingest returned no dump_id" }, { status: 500 });

    return Response.json({ dump_id }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: "Unexpected error", details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
