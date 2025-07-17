import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";

export async function POST(req: NextRequest) {
  let payload: { text: string; files?: string[]; name?: string | null };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { text, files = [], name } = payload;
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const workspace = await getServerWorkspace();
  if (!workspace) {
    return NextResponse.json({ error: "workspace not found" }, { status: 401 });
  }

  const { id: workspaceId, user_id: userId } = workspace;

  const { data: basket, error: basketErr } = await supabase
    .from("baskets")
    .insert({ name, workspace_id: workspaceId, user_id: userId })
    .select("id")
    .single();
  if (basketErr || !basket) {
    return NextResponse.json({ error: basketErr?.message || "insert failed" }, { status: 500 });
  }

  const { error: dumpErr } = await supabase
    .from("raw_dumps")
    .insert({ basket_id: basket.id, body_md: text, file_refs: files });
  if (dumpErr) {
    return NextResponse.json({ error: dumpErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: basket.id }, { status: 201 });
}
