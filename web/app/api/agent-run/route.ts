import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_API_BASE_URL environment variable" },
      { status: 500 }
    );
  }

  // ① copy incoming body
  const body = await request.text();

  // ② Forward BOTH the Authorization header and the Supabase cookie.
  //    FastAPI validates either one, and RSC/Route Handlers strip auth headers automatically.
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth; // capital-A
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie; // pass Supabase session cookie

  // ③ proxy to backend
  const upstream = `${baseUrl}/agent-run`;
  const res = await fetch(upstream, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}