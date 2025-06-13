import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Determine API base URL from env
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_API_BASE environment variable' },
      { status: 500 }
    );
  }
  // Construct upstream URL safely
  let upstream: string;
  try {
    upstream = new URL('/task-types', baseUrl).toString();
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid API base URL' },
      { status: 500 }
    );
  }
  // Fetch from upstream
  let res: Response;
  try {
    res = await fetch(upstream, { cache: 'no-store' });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to connect to upstream API' },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch task types" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}