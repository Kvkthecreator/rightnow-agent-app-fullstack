import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // ① copy incoming body
  const body = await request.text();

  // ② forward Authorization header if present
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) {
    headers["authorization"] = auth;
  }

  const res = await fetch(`${process.env.BACKEND_URL}/agent-run`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}