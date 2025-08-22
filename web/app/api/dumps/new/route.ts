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
  const raw = await req.json();
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { basket_id, text_dump, file_urls } = parsed.data;

  const supabase = createRouteHandlerClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);

  // Ensure basket belongs to user's workspace
  const { data: basket } = await supabase
    .from("baskets")
    .select(
      `id, workspace_id, workspace_memberships!inner(user_id)`
    )
    .eq("id", basket_id)
    .eq("workspace_memberships.user_id", userId)
    .single();

  if (!basket) {
    return Response.json({ error: "Basket not found" }, { status: 404 });
  }

  const { data: dump, error: dumpErr } = await supabase
    .from("raw_dumps")
    .insert({
      basket_id,
      workspace_id: basket.workspace_id,
      body_md: text_dump,
      file_refs: file_urls ? file_urls : null,
    })
    .select("id")
    .single();

  if (dumpErr || !dump) {
    return Response.json({ error: "Failed to insert dump" }, { status: 500 });
  }

  const { data: event, error: eventErr } = await supabase
    .from("timeline_events")
    .insert({
      basket_id,
      kind: "dump",
      ref_id: dump.id,
      preview: text_dump.slice(0, 280),
      payload: { source: "dump_bar" },
    })
    .select("id")
    .single();

  if (eventErr || !event) {
    return Response.json({ error: "Failed to insert timeline event" }, { status: 500 });
  }

  return Response.json({ dump_id: dump.id, event_id: event.id });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
