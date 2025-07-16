import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest, ctx: any) {
  const { id } = ctx.params;
  const headers: HeadersInit = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  const res = await apiFetch(`/baskets/snapshot/${id}`, { headers, cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
