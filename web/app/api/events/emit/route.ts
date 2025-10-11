import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { apiPost } from '@/lib/server/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const response = await apiPost('/api/events/emit', body);
    const json = await response.json().catch(() => ({}));
    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    console.error('[events/emit] Failed to forward event', error);
    return NextResponse.json({ ok: false, error: 'event_forward_failed' }, { status: 500 });
  }
}
