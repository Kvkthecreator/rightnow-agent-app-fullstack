import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
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
  const supabase = createServerSupabaseClient();
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
