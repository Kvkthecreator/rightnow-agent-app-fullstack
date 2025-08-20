/**
 * Route: GET /api/baskets/:id/history
 * @contract input  : none
 * @contract output : HistoryPage
 * RLS: workspace-scoped reads on raw_dumps and reflections
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";

export const dynamic = "force-dynamic";

function decodeCursor(c?: string) {
  if (!c) return null;
  try { return JSON.parse(Buffer.from(c, "base64").toString("utf8")) as { ts: string; id: number }; }
  catch { return null; }
}
function encodeCursor(ts: string, id: number) {
  return Buffer.from(JSON.stringify({ ts, id }), "utf8").toString("base64");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerComponentClient({ cookies });
  const { id: basketId } = await params;
  const url = new URL(req.url);
  const cursor = decodeCursor(url.searchParams.get("cursor") ?? undefined);
  const pageSize = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);

  let query = supabase
    .from("basket_history")
    .select("id, ts, kind, ref_id, preview, payload")
    .eq("basket_id", basketId)
    .order("ts", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);

  if (cursor) {
    // keyset pagination: ts DESC, id DESC
    query = query.lt("ts", cursor.ts).or(`ts.eq.${cursor.ts},id.lt.${cursor.id}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).slice(0, pageSize).map(row => ({
    ts: row.ts,
    kind: row.kind,
    ref_id: row.ref_id,
    preview: row.preview,
    payload: row.payload,
  }));
  const next = (data ?? []).length > pageSize ? data![pageSize] : null;
  const next_cursor = next ? encodeCursor(next.ts as any, next.id as any) : undefined;

  return NextResponse.json({ items, next_cursor });
}