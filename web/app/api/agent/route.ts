import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy POST /api/agent to the backend FastAPI /agent endpoint,
 * forwarding headers and body.
 */
export async function POST(request: NextRequest) {
  // Read raw body
  const body = await request.text();
  // Forward auth headers and cookies
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;
  // Backend URL
  const upstream = `${process.env.BACKEND_URL}/agent`;
  const res = await fetch(upstream, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}