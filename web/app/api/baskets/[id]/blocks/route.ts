import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest, context: any) {
  const { id } = context.params;
  const upstreamPath = `/baskets/${id}/blocks`;

  const headers: HeadersInit = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

  let res: Response;
  try {
    res = await apiFetch(upstreamPath, { headers, cache: 'no-store' });
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
