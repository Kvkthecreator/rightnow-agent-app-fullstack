import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");
  if (process.env.MOCK_BASKET_API) {
    const items = [
      {
        id: "doc1",
        title: "Marketing Plan",
        updated_at: new Date().toISOString(),
        preview: "...",
      },
      {
        id: "doc2",
        title: "Design Brief",
        updated_at: new Date().toISOString(),
        preview: "...",
      },
    ];
    return NextResponse.json({ items: items.slice(0, limit ? Number(limit) : items.length) });
  }
  const supabase = createRouteHandlerClient({ cookies });
  const workspace = await ensureWorkspaceServer(supabase);
  let query = supabase
    .from("documents")
    .select("id,title,updated_at,preview")
    .eq("basket_id", id)
    .eq("workspace_id", workspace?.id)
    .order("updated_at", { ascending: false });
  if (limit) {
    query = query.limit(Number(limit));
  }
  const { data } = await query;
  return NextResponse.json({ items: data || [] });
}
