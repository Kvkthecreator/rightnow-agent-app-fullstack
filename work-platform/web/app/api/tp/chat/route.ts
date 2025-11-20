/**
 * POST /api/tp/chat
 *
 * Proxy to work-platform Python API for Thinking Partner chat.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/env';

export async function POST(req: NextRequest) {
  const body = await req.text();

  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  // Forward authorization header (JWT)
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  // Forward cookies
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

  const res = await fetch(apiUrl('/api/tp/chat'), {
    method: 'POST',
    headers,
    body,
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
