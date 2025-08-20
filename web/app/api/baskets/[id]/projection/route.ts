import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { computeServerReflections } from "@/app/_server/reflection/compute";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerComponentClient({ cookies });

  // 1) Auth
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: basketId } = await params;

  // 2) Fetch substrate (RLS enforces workspace access)
  const { data: dumps, error: dErr } = await supabase
    .from("raw_dumps")
    .select("id, text_dump, created_at, meta")
    .eq("basket_id", basketId)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: items, error: iErr } = await supabase
    .from("context_items")
    .select("id, type, payload, created_at")
    .eq("basket_id", basketId)
    .limit(500);

  if (dErr || iErr) {
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }

  // 3) Pull analyzer report (interpretation authority)
  const { data: reports } = await supabase
    .from("basket_intelligence_reports")
    .select("entities, relationships, themes, tensions, suggestions, created_at")
    .eq("basket_id", basketId)
    .order("created_at", { ascending: false })
    .limit(1);

  const report = reports?.[0] ?? null;

  // 4) Server reflection synthesis (projection authority)
  const { pattern, tension, question, notes } = computeServerReflections({
    dumps: dumps || [],
    items: items || [],
    report,
  });

  return NextResponse.json({
    graph: {
      dumps: dumps || [],
      items: items || [],
      entities: report?.entities ?? [],
      relationships: report?.relationships ?? []
    },
    reflections: { pattern, tension, question, notes },
    meta: { basketId, computed_at: new Date().toISOString() }
  });
}