import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: any
) {
  const id = context.params.id;
  const headers: HeadersInit = {};
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const upstream = `${process.env.NEXT_PUBLIC_API_BASE}/baskets/${id}`;
  const res = await fetch(upstream, { headers, cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.state });
}
