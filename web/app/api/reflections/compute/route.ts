import { NextResponse } from "next/server";
import { runP3ComputeReflections } from "@/api/pipelines/p3_signals/runner";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const basketId = searchParams.get("basket_id");
  if (!basketId) return NextResponse.json({ error: "basket_id required" }, { status: 400 });
  const days = parseInt(searchParams.get("days") || "14", 10);
  const maxDumps = parseInt(searchParams.get("max") || "50", 10);
  const cache = (searchParams.get("cache") || "false") === "true";

  const out = await runP3ComputeReflections(basketId, { days, maxDumps, cache });
  return NextResponse.json(out);
}