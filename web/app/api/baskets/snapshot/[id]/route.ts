import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, ctx: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_API_BASE' }, { status: 500 });
  }
  const { id } = ctx.params;
  const upstream = `${baseUrl}/baskets/snapshot/${id}`;
  const headers: HeadersInit = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  const res = await fetch(upstream, { headers, cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
