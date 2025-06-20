import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: any) {
  const { id } = context.params;
  const body = await req.text();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const upstream = `${process.env.NEXT_PUBLIC_API_BASE}/baskets/${id}/work`;
  const res = await fetch(upstream, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
