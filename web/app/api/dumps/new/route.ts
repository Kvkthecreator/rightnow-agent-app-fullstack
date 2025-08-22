export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { z } from "zod";

const BaseSchema = z.object({
  basket_id: z.string().uuid(),
  text_dump: z.string().min(1).optional(),
  file_urls: z.array(z.string().url()).optional(),
  source_meta: z.record(z.any()).optional(),
  ingest_trace_id: z.string().uuid().optional(),
  dump_request_id: z.string().uuid(),
});

const InputSchema = BaseSchema.refine(
  (d) => (d.text_dump && d.text_dump.trim().length > 0) || (d.file_urls && d.file_urls.length > 0),
  { message: "Provide text_dump or file_urls" }
);

function normalizePayload(raw: any) {
  if (raw && typeof raw === 'object') {
    if (raw.text && !raw.text_dump) raw.text_dump = raw.text;
    if (raw.fileUrl) raw.file_urls = [raw.fileUrl];
    if (raw.fileUrls && !raw.file_urls)
      raw.file_urls = Array.isArray(raw.fileUrls) ? raw.fileUrls : [raw.fileUrls];
    if (raw.dumpRequestId && !raw.dump_request_id) raw.dump_request_id = raw.dumpRequestId;
    if (raw.ingestTraceId && !raw.ingest_trace_id) raw.ingest_trace_id = raw.ingestTraceId;
  }
  return raw;
}

export async function POST(req: Request) {
  try {
    const raw = normalizePayload(await req.json().catch(() => null));
    const parsed = InputSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }
    const { basket_id, text_dump, file_urls, source_meta, ingest_trace_id, dump_request_id } = parsed.data;

    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await getAuthenticatedUser(supabase);

    const { data: basket, error: bErr } = await supabase
      .from("baskets")
      .select("id, workspace_id")
      .eq("id", basket_id)
      .maybeSingle();
    if (bErr) return Response.json({ error: `Basket lookup failed: ${bErr.message}` }, { status: 400 });
    if (!basket) return Response.json({ error: "Basket not found" }, { status: 404 });

    const { data: membership, error: mErr } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", basket.workspace_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (mErr) return Response.json({ error: `Membership check failed: ${mErr.message}` }, { status: 400 });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

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
    if (!dump_id) {
      return Response.json({ error: "Ingest returned no dump_id" }, { status: 500 });
    }

    return Response.json({ dump_id }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: "Unexpected error", details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
