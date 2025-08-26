export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { OnboardingSubmitSchema, OnboardingResultSchema } from '@shared/contracts/onboarding';

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = OnboardingSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 });
    }
    const { basket_id, name, tension, aspiration, memory_paste } = parsed.data;

    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const ws = await ensureWorkspaceForUser(userId, supabase);

    const idempotencyKey = `user:${userId}:basket:${basket_id}:identity_genesis:v1`;

    // Idempotency check
    const { data: existing } = await supabase
      .from('context_items')
      .select('id, metadata')
      .eq('basket_id', basket_id)
      .eq('context_type', 'system')
      .eq('content_text', 'identity_genesis')
      .eq('metadata->>idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        dump_ids: existing.metadata?.dump_ids ?? {},
        context_item_id: existing.id,
        profile_document_id: existing.metadata?.profile_document_id ?? undefined,
      });
    }

    const dumps: { question: string; text: string }[] = [
      { question: 'name', text: `Name: ${name}` },
      { question: 'tension', text: tension },
      { question: 'aspiration', text: aspiration },
    ];
    if (memory_paste) dumps.push({ question: 'memory_paste', text: memory_paste });

    const dumpEntries = dumps.map((d) => ({
      dump_request_id: randomUUID(),
      text_dump: d.text,
      source_meta: {
        source_type: 'onboarding',
        metadata: {
          onboarding: { version: 'v1', question: d.question, is_genesis: true },
          importance: 'core_profile',
          idempotency_key: idempotencyKey,
        },
      },
    }));

    const { data: ingestData, error: ingestErr } = await supabase.rpc('fn_ingest_dumps', {
      p_workspace_id: ws.id,
      p_basket_id: basket_id,
      p_dumps: dumpEntries,
    });

    if (ingestErr) {
      const code = ingestErr.code === '23505' ? 409 : 500;
      return NextResponse.json({ error: 'Ingest failed', details: ingestErr.message }, { status: code });
    }

    const dump_ids: Record<string, string> = {};
    (ingestData || []).forEach((d: any, idx: number) => {
      dump_ids[dumps[idx].question] = d.dump_id;
    });

    const { data: marker, error: markerErr } = await supabase
      .from('context_items')
      .insert({
        basket_id,
        context_type: 'system',
        content_text: 'identity_genesis',
        is_validated: true,
        metadata: { version: 'v1', dump_ids, display_name: name, idempotency_key: idempotencyKey },
      })
      .select('id')
      .single();

    if (markerErr || !marker) {
      return NextResponse.json({ error: 'Context item creation failed', details: markerErr?.message }, { status: 500 });
    }

    const result = { dump_ids, context_item_id: marker.id } as any;
    const validated = OnboardingResultSchema.parse(result);
    return NextResponse.json(validated, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
