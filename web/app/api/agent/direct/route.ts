import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy POST /api/agent/direct to the backend FastAPI /agent/direct endpoint.
 */
export async function POST(request: NextRequest) {
  // Read raw body
  const body = await request.text();
  // Logging incoming proxy request
  console.log("[🔀 proxy /api/agent/direct] Incoming request body:", body);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;
  const upstream = `${process.env.NEXT_PUBLIC_API_BASE}/agent/direct`;
  const res = await fetch(upstream, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  // Log upstream response status
  console.log("[🔀 proxy /api/agent/direct] Upstream response status:", res.status);
  const data = await res.json();
  // Log upstream response body
  console.log("[🔀 proxy /api/agent/direct] Upstream response body:", data);
  return NextResponse.json(data, { status: res.status });
}