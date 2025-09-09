export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { POST as trigger } from '@/app/api/reflections/trigger/route';

// Alias to /api/reflections/trigger for compatibility with route registry
export async function POST(req: NextRequest) {
  return trigger(req);
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

