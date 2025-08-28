export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { cookies } from "next/headers";
import { createTestAwareClient, getTestAwareAuth, checkMembershipUnlessTest } from "@/lib/auth/testHelpers";
import { z } from "zod";
import { createTimelineEmitter } from "@/lib/canon/TimelineEventEmitter";
import { PipelineBoundaryGuard } from "@/lib/canon/PipelineBoundaryGuard";

function normalize(body: any) {
  const b = body ?? {};
  const n = (v: any) => (v === null || v === undefined ? undefined : v);

  return {
    basket_id: b.basket_id ?? b.basketId,
    text_dump: n(b.text_dump ?? b.text),
    file_url: n(b.file_url ?? b.fileUrl),
    meta: n(b.meta ?? b.source_meta),
    dump_request_id: b.dump_request_id ?? b.dumpRequestId ?? b.request_id,
  };
}

const Schema = z
  .object({
    basket_id: z.string().uuid(),
    dump_request_id: z.string().uuid(),
    text_dump: z.string().trim().min(1).optional(),
    file_url: z.string().url().optional(),
    meta: z
      .object({
        client_ts: z.string().optional(),
        ingest_trace_id: z.string().uuid().optional(),
      })
      .catchall(z.unknown())
      .optional(),
  })
  .strict()
  .refine(
    (d) => Boolean(d.text_dump) || Boolean(d.file_url),
    { message: "Provide non-empty text_dump or file_url" }
  );

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = Schema.safeParse(normalize(raw));
    if (!parsed.success) {
      return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }
    const { basket_id, text_dump, file_url, meta, dump_request_id } = parsed.data;
    
    const supabase = createTestAwareClient({ cookies });
    
    // Pipeline boundary enforcement: P0 Capture
    // This route should only create dumps, no interpretation or processing
    // Agent processing happens asynchronously via queue trigger
    PipelineBoundaryGuard.enforceP0Capture({
      type: 'dump.create',
      payload: { text_dump, file_url },
      context: { basket_id }
    });
    const { userId, isTest } = await getTestAwareAuth(supabase);

    // Resolve basket + workspace
    const { data: basket, error: bErr } = await supabase
      .from("baskets")
      .select("id, workspace_id")
      .eq("id", basket_id)
      .maybeSingle();
    if (bErr) return Response.json({ error: `Basket lookup failed: ${bErr.message}` }, { status: 400 });
    if (!basket) return Response.json({ error: "Basket not found" }, { status: 404 });

    // Verify membership (defense-in-depth; RLS still applies)
    try {
      await checkMembershipUnlessTest(supabase, basket.workspace_id, userId, isTest);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Forbidden') {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      return Response.json({ error: `Membership check failed: ${message}` }, { status: 400 });
    }

    // Idempotent RPC; DB trigger emits 'dump'
    const { data, error: rpcErr } = await supabase.rpc("fn_ingest_dumps", {
      p_workspace_id: basket.workspace_id,
      p_basket_id: basket_id,
      p_dumps: [
        {
          dump_request_id,
          text_dump: text_dump ?? null,
          file_url: file_url ?? null,
          source_meta: meta ?? null,
          ingest_trace_id: meta?.ingest_trace_id ?? null,
        },
      ],
    });

    if (rpcErr) {
      const code = rpcErr.code === "23505" ? 409 : 500;
      return Response.json({ error: "Ingest failed", details: rpcErr.message }, { status: code });
    }

    const dump_id = Array.isArray(data) && data[0]?.dump_id;
    if (!dump_id) return Response.json({ error: "Ingest returned no dump_id" }, { status: 500 });

    // Emit timeline events for dump creation (P0 Capture pipeline)
    const timelineEmitter = createTimelineEmitter(supabase);
    await timelineEmitter.emitDumpCreated({
      basket_id,
      workspace_id: basket.workspace_id,
      dump_id,
      source_type: file_url ? 'file' : 'text'
    });

    return Response.json({ dump_id }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: "Unexpected error", details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
