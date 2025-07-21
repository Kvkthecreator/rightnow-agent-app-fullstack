// ❌ DEPRECATED
// This route is no longer used for SSR. Use server helpers in lib/server/baskets.ts instead.
import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: NextRequest, context: any) {
  const { id } = context.params;
  const body = await req.text();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const res = await apiFetch(`/baskets/${id}/work`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
