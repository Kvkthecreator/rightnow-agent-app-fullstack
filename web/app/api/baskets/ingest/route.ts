import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { IngestReqSchema } from '@/lib/schemas/ingest';
import { getAuthenticatedUser, ensureWorkspaceForUser } from '@/lib/server/auth';
import { ingestBasketAndDumps } from '@/lib/server/ingest';

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await getAuthenticatedUser(req);
    const workspaceId = await ensureWorkspaceForUser(userId, token);
    const body = IngestReqSchema.parse(await req.json());
    const { raw, data } = await ingestBasketAndDumps({
      workspaceId,
      userId,
      idempotency_key: body.idempotency_key,
      basket: body.basket,
      dumps: body.dumps,
      token,
    });
    // Log request and response separately per canon - no field synthesis
    console.log(JSON.stringify({
      route: '/api/baskets/ingest',
      user_id: userId,
      workspace_id: workspaceId,
      request: {
        idempotency_key: body.idempotency_key,
        basket: body.basket,
        dumps_count: body.dumps.length
      }
    }));
    console.log(JSON.stringify({
      route: '/api/baskets/ingest',
      user_id: userId,
      response: raw
    }));
    return NextResponse.json(data, { status: 200 });
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
