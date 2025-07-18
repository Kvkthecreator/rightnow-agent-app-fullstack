import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const headers: HeadersInit = {};
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  try {
    const res = await apiFetch("/baskets/list", { headers, cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("\u274c Proxy error for /baskets/list:", err);
    return NextResponse.json(
      { error: "Failed to fetch baskets" },
      { status: 500 },
    );
  }
}
