/**
 * GET /api/tp/capabilities
 *
 * Proxy to work-platform Python API for TP capabilities.
 * This endpoint is unauthenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/env';

export async function GET(req: NextRequest) {
  const res = await fetch(apiUrl('/api/tp/capabilities'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
