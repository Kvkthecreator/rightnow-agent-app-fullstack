import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const upstream = `${process.env.BACKEND_URL}/task-types`;
  const res = await fetch(upstream, { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch task types" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}