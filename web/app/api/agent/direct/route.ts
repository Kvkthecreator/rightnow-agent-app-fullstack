import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy POST /api/agent/direct to the backend FastAPI /agent/direct endpoint.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;
  const upstream = `${process.env.BACKEND_URL}/agent/direct`;
  const res = await fetch(upstream, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}