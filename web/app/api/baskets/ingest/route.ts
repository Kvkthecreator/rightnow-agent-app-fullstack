import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { IngestReqSchema } from '@shared/contracts/ingest';
import { getAuthenticatedUser, ensureWorkspaceForUser } from '@/lib/server/auth';
import { ingestBasketAndDumps } from '@/lib/server/ingest';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthenticatedUser(req);
    const workspaceId = await ensureWorkspaceForUser(userId);
    const body = IngestReqSchema.parse(await req.json());
    const res = await ingestBasketAndDumps({ workspaceId, userId, ...body });
    console.log(
      JSON.stringify({
        route: '/api/baskets/ingest',
        user_id: userId,
        workspace_id: workspaceId,
        basket: res.basket.created ? 'created' : 'replayed',
        dumps: res.dumps.map((d) => ({
          dump_request_id: d.dump_request_id,
          action: d.created ? 'created' : 'replayed',
        })),
      }),
    );
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('ingest route error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
