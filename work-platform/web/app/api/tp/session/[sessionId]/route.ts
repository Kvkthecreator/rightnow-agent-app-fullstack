/**
 * GET /api/tp/session/[sessionId]
 *
 * Proxy to work-platform Python API for TP session details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/env';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  // Forward authorization header (JWT)
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  // Forward cookies
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

  const res = await fetch(apiUrl(`/api/tp/session/${sessionId}`), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
