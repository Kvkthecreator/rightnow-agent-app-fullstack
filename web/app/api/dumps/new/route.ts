export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { z } from "zod";

const InputSchema = z.object({
  basket_id: z.string().uuid(),
  text_dump: z.string().min(1),
  file_urls: z.array(z.string().url()).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = InputSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { basket_id, text_dump, file_urls } = parsed.data;

    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await getAuthenticatedUser(supabase);

    // 1) Fetch basket to get workspace_id
    const { data: basket, error: bErr } = await supabase
      .from("baskets")
      .select("id, workspace_id")
      .eq("id", basket_id)
      .maybeSingle();

    if (bErr) {
      return Response.json({ error: `Basket lookup failed: ${bErr.message}` }, { status: 400 });
    }
    if (!basket) {
      return Response.json({ error: "Basket not found" }, { status: 404 });
    }

    // 2) Verify user is a member of the basket's workspace
    const { data: membership, error: mErr } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", basket.workspace_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (mErr) {
      return Response.json({ error: `Workspace membership lookup failed: ${mErr.message}` }, { status: 400 });
    }
    if (!membership) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) Insert raw dump (DB trigger will emit timeline_events('dump'))
    const { data: dump, error: dumpErr } = await supabase
      .from("raw_dumps")
      .insert({
        basket_id,
        workspace_id: basket.workspace_id,
        body_md: text_dump,
        file_refs: file_urls ?? null, // jsonb column; null when absent
      })
      .select("id")
      .single();

    if (dumpErr || !dump) {
      return Response.json(
        { error: `Failed to create dump${dumpErr?.message ? `: ${dumpErr.message}` : ""}` },
        { status: 500 }
      );
    }

    // Do NOT insert into timeline_events here; trigger handles it.
    return Response.json({ dump_id: dump.id }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: "Unexpected error", details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
