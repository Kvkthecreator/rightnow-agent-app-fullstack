import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
) {
  const { id } = await ctx.params;
  if (process.env.MOCK_BASKET_API) {
    return NextResponse.json({
      basket_id: id,
      name: "Mock Basket",
      counts: { documents: 3, blocks: 4, context_items: 1 },
      last_updated: new Date().toISOString(),
      current_focus: "Prototype + marketing plan",
    });
  }
  const supabase = createRouteHandlerClient({ cookies });
  const workspace = await ensureWorkspaceServer(supabase);
  const { data, error } = await supabase
    .from("baskets")
    .select("id,name,updated_at")
    .eq("id", id)
    .eq("workspace_id", workspace?.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    basket_id: data.id,
    name: data.name,
    counts: { documents: 0, blocks: 0, context_items: 0 },
    last_updated: data.updated_at,
    current_focus: "",
  });
}
