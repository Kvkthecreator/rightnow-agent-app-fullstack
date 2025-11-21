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

  try {
    const res = await fetch(apiUrl('/api/tp/chat'), {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    // Check content type before parsing
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await res.text();
      console.error('[TP Chat Proxy] Non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid response from backend', detail: text.substring(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[TP Chat Proxy] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to communicate with backend',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
