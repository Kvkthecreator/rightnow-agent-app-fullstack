import { NextResponse } from "next/server";
import { createNarrativeFromProjection } from "@/api/pipelines/p4_presentation/composer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const basketId = body?.basket_id;
  if (!basketId) return NextResponse.json({ error: "basket_id required" }, { status: 400 });

  const title = body?.title;
  const out = await createNarrativeFromProjection(basketId, { title });
  return NextResponse.json(out);
}