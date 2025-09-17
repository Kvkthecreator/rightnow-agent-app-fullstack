export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { GET as GetStatus } from '../../[workId]/status/route';

export async function GET(req: NextRequest, ctx: { params: { workId: string } }) {
  const { workId } = ctx.params;
  return GetStatus(req, { params: { work_id: workId } } as any);
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

