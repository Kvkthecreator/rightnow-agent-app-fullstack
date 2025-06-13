import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_API_BASE environment variable' },
      { status: 500 },
    );
  }

  const { id } = context.params;
  let upstream: string;
  try {
    upstream = new URL(`/baskets/${id}/blocks${req.nextUrl.search}` , baseUrl).toString();
  } catch {
    return NextResponse.json({ error: 'Invalid API base URL' }, { status: 500 });
  }

  const headers: HeadersInit = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

  let res: Response;
  try {
    res = await fetch(upstream, { headers, cache: 'no-store' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to upstream API' },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
