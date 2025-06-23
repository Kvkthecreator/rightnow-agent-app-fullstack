import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, ctx: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
  }
  const { name } = ctx.params;
  const body = await req.text();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  const upstream = `${base}/agents/${name}/run`;
  const res = await fetch(upstream, { method: 'POST', headers, body, cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
