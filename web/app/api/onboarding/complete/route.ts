export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import {
  OnboardingSubmitSchema,
  OnboardingResultSchema,
  MEMORY_PASTE_MAX,
} from '@shared/contracts/onboarding';
import { createGenesisProfileDocument } from '@/lib/server/onboarding';

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    let wasTruncated = false;
    if (typeof raw?.memory_paste === 'string' && raw.memory_paste.length > MEMORY_PASTE_MAX) {
      wasTruncated = true;
      raw.memory_paste = raw.memory_paste.slice(0, MEMORY_PASTE_MAX);
    }
    const parsed = OnboardingSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 });
    }
    const { basket_id, name, tension, aspiration, memory_paste } = parsed.data;

    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const ws = await ensureWorkspaceForUser(userId, supabase);

    const IDEMPOTENCY = `genesis:v1:basket:${basket_id}`;

    // Guard against double genesis
    const { data: existing } = await supabase
      .from('context_items')
      .select('id')
      .eq('basket_id', basket_id)
      .eq('context_type', 'yarnnn_system')
      .eq('content_text', 'identity_genesis')
      .maybeSingle();

    if (existing) {
      const headers = new Headers();
      if (wasTruncated) headers.set('X-Memory-Paste-Truncated', '1');
      return NextResponse.json(
        { ok: true, already_exists: true, truncated_memory_paste: wasTruncated },
        { status: 200, headers }
      );
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
          onboarding: { question: d.question, is_genesis: true, version: 'v1' },
          idempotency_key: IDEMPOTENCY,
          importance: 'core_profile',
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

    const markerMetadata: any = {
      version: 'v1',
      dump_ids,
      display_name: name,
      idempotency_key: IDEMPOTENCY,
    };

    const { data: marker, error: markerErr } = await supabase
      .from('context_items')
      .insert({
        basket_id,
        context_type: 'yarnnn_system',
        content_text: 'identity_genesis',
        is_validated: true,
        metadata: markerMetadata,
      })
      .select('id')
      .single();

    if (markerErr || !marker) {
      return NextResponse.json({ error: 'Context item creation failed', details: markerErr?.message }, { status: 500 });
    }

    let profile_document_id: string | undefined;
    if (parsed.data.create_profile_document !== false) {
      profile_document_id = await createGenesisProfileDocument({
        supabase,
        basketId: basket_id,
        dumpIds: dump_ids as any,
        contextItemId: marker.id,
      });
      markerMetadata.profile_document_id = profile_document_id;
      await supabase
        .from('context_items')
        .update({ metadata: markerMetadata })
        .eq('id', marker.id);
    }

    const result = { dump_ids, context_item_id: marker.id, profile_document_id } as any;
    const validated = OnboardingResultSchema.parse(result);
    const headers = new Headers();
    if (wasTruncated) headers.set('X-Memory-Paste-Truncated', '1');
    return NextResponse.json(
      { ...validated, ok: true, truncated_memory_paste: wasTruncated },
      { status: 200, headers }
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', details: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
