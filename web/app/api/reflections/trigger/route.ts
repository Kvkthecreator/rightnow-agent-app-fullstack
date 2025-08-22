import { NextResponse } from "next/server";
import { runP3ComputeReflections } from "@/api/pipelines/p3_signals/runner";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const basketId = body?.basket_id;
  if (!basketId) return NextResponse.json({ error: "basket_id required" }, { status: 400 });

  const out = await runP3ComputeReflections(basketId, { cache: true });
  return NextResponse.json({ ok: true, reflection: out.reflection, cached: out.cached });
}