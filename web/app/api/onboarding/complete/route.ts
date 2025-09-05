import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OnboardingSubmitSchema, OnboardingResultSchema } from '@/shared/contracts/onboarding';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { createGenesisProfileDocument } from '@/lib/server/onboarding';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    console.log('🔄 Onboarding API: Starting request processing');
    const raw = await req.json();
    console.log('📝 Onboarding API: Raw payload received:', JSON.stringify(raw, null, 2));
    
    const payload = OnboardingSubmitSchema.parse(raw);
    console.log('✅ Onboarding API: Payload validated');
    
    const supabase = createRouteHandlerClient({ cookies });
    console.log('🔧 Onboarding API: Route handler client created');
    
    // Handle auth in API route (don't use redirect)
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data?.user) {
      console.error('🚫 Onboarding API: Authentication failed:', authError);
      return NextResponse.json({ error: 'unauthorized', detail: 'Authentication required' }, { status: 401 });
    }
    const userId = data.user.id;
    console.log('🔐 Onboarding API: User authenticated:', userId);
    
    const { id: workspaceId } = await ensureWorkspaceForUser(userId, supabase);
    console.log('🏢 Onboarding API: Workspace resolved:', workspaceId);

    // Ensure basket exists
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id')
      .eq('id', payload.basket_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (basketError) {
      return NextResponse.json({ error: 'basket_lookup_failed', detail: basketError.message }, { status: 500 });
    }

    if (!basket) {
      // Create the basket if it doesn't exist
      const { data: newBasket, error: createError } = await supabase
        .from('baskets')
        .insert({
          id: payload.basket_id,
          workspace_id: workspaceId,
          name: 'Onboarding Session',
          status: 'INIT',
          tags: []
        })
        .select('id')
        .single();

      if (createError || !newBasket) {
        return NextResponse.json({ error: 'basket_creation_failed', detail: createError?.message }, { status: 500 });
      }
    }

    // Check if identity genesis already exists to prevent duplicates
    const { data: existingGenesis } = await supabase
      .from('context_items')
      .select('id')
      .eq('basket_id', payload.basket_id)
      .eq('type', 'task')
      .eq('content', 'identity_genesis')
      .maybeSingle();

    if (existingGenesis) {
      return NextResponse.json({ error: 'identity_genesis_exists', detail: 'User has already completed onboarding' }, { status: 409 });
    }

    // Prepare dumps for bulk creation
    const dumps = [
      {
        dump_request_id: randomUUID(),
        text_dump: `Name: ${payload.name}`,
        source_meta: { genesis_role: 'name', origin: 'onboarding', context: 'identity' }
      },
      {
        dump_request_id: randomUUID(),
        text_dump: `Current tension: ${payload.tension}`,
        source_meta: { genesis_role: 'tension', origin: 'onboarding', context: 'identity' }
      },
      {
        dump_request_id: randomUUID(),
        text_dump: `Aspiration: ${payload.aspiration}`,
        source_meta: { genesis_role: 'aspiration', origin: 'onboarding', context: 'identity' }
      }
    ];

    // Add memory paste if provided
    if (payload.memory_paste) {
      dumps.push({
        dump_request_id: randomUUID(),
        text_dump: payload.memory_paste,
        source_meta: { genesis_role: 'memory_paste', origin: 'onboarding', context: 'memory' }
      });
    }

    // Create all dumps in bulk using the RPC
    console.log('📦 Onboarding API: Calling fn_ingest_dumps RPC with:', {
      p_workspace_id: workspaceId,
      p_basket_id: payload.basket_id,
      dumps_count: dumps.length,
      dumps: dumps
    });
    
    const { data: dumpResults, error: dumpError } = await supabase.rpc('fn_ingest_dumps', {
      p_workspace_id: workspaceId,
      p_basket_id: payload.basket_id,
      p_dumps: dumps
    });

    console.log('📊 Onboarding API: RPC response:', { 
      dumpResults, 
      dumpError,
      hasResults: !!dumpResults,
      resultCount: dumpResults?.length 
    });

    if (dumpError || !dumpResults) {
      console.error('❌ Onboarding API: Dump creation failed:', dumpError);
      return NextResponse.json({ error: 'dump_creation_failed', detail: dumpError?.message }, { status: 500 });
    }

    // Extract dump IDs from results
    const dumpIds = {
      name: dumpResults[0]?.dump_id,
      tension: dumpResults[1]?.dump_id,
      aspiration: dumpResults[2]?.dump_id,
      memory_paste: payload.memory_paste ? dumpResults[3]?.dump_id : undefined
    };

    // Create identity_genesis context item
    const { data: contextItem, error: contextError } = await supabase
      .from('context_items')
      .insert({
        basket_id: payload.basket_id,
        type: 'task',
        content: 'identity_genesis',
        title: 'Identity Genesis Marker',
        metadata: {
          genesis_created_at: new Date().toISOString(),
          dump_ids: dumpIds,
          onboarding_version: 'v1.3.1'
        }
      })
      .select('id')
      .single();

    if (contextError || !contextItem) {
      return NextResponse.json({ error: 'context_item_creation_failed', detail: contextError?.message }, { status: 500 });
    }

    // Create profile document if requested
    let profileDocumentId: string | undefined;
    if (payload.create_profile_document) {
      try {
        profileDocumentId = await createGenesisProfileDocument({
          basketId: payload.basket_id,
          title: `${payload.name}'s Profile`,
          dumpIds,
          contextItemId: contextItem.id,
          supabase
        });
      } catch (profileError: any) {
        // Profile document creation is optional - log but don't fail
        console.warn('Failed to create profile document:', profileError.message);
      }
    }

    // Validate and return response
    const result = OnboardingResultSchema.parse({
      dump_ids: dumpIds,
      context_item_id: contextItem.id,
      profile_document_id: profileDocumentId
    });

    return NextResponse.json(result, { status: 201 });

  } catch (err: any) {
    // Handle Zod validation errors
    if (err?.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'validation_error', 
        detail: err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') 
      }, { status: 422 });
    }

    // Handle auth errors
    if (err?.status === 401 || err?.message === 'NO_TOKEN') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    console.error('💥 Onboarding API: Fatal error occurred:', {
      error: err,
      message: err?.message,
      stack: err?.stack,
      name: err?.name
    });
    return NextResponse.json({ 
      error: 'internal_error', 
      detail: String(err?.message ?? err),
      debug_info: process.env.NODE_ENV === 'development' ? {
        stack: err?.stack,
        name: err?.name
      } : undefined
    }, { status: 500 });
  }
}
