import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  DocumentCompositionSchema,
  type DocumentComposition
} from '@/shared/contracts/documents';
import {
  type SubstrateReferenceDTO,
  type SubstrateSummary
} from '@/shared/contracts/substrate_references';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    // Get document with workspace check
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, basket_id, title, content_raw, created_at, updated_at, metadata, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (docError || !document) {
      return NextResponse.json({ error: 'document not found' }, { status: 404 });
    }

    if (document.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Get all substrate references using Canon v1.3.1 generic system
    const { data: substrateRefs, error: refsError } = await supabase
      .from('substrate_references')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false });

    if (refsError) {
      console.error('Error fetching substrate references:', refsError);
      return NextResponse.json({ error: 'Failed to fetch document composition' }, { status: 500 });
    }

    // Fetch substrate details for each reference type
    const compositionRefs: Array<{
      reference: SubstrateReferenceDTO;
      substrate: SubstrateSummary;
    }> = [];

    for (const ref of substrateRefs || []) {
      try {
        let substrateData: any = null;
        let substrateSummary: SubstrateSummary;

        // Query the appropriate table based on substrate type
        switch (ref.substrate_type) {
          case 'block':
            const { data: blockData } = await supabase
              .from('blocks')
              .select('id, title, body_md, state, version, created_at')
              .eq('id', ref.substrate_id)
              .maybeSingle();
            substrateData = blockData;
            if (substrateData) {
              substrateSummary = {
                substrate_type: 'block',
                substrate_id: substrateData.id,
                title: substrateData.title || null,
                preview: substrateData.body_md?.substring(0, 200) + '...' || '',
                created_at: substrateData.created_at,
                state: substrateData.state,
                version: substrateData.version
              };
            }
            break;

          case 'dump':
            const { data: dumpData } = await supabase
              .from('raw_dumps')
              .select('id, content, char_count, source_type, created_at')
              .eq('id', ref.substrate_id)
              .maybeSingle();
            substrateData = dumpData;
            if (substrateData) {
              substrateSummary = {
                substrate_type: 'dump',
                substrate_id: substrateData.id,
                title: null,
                preview: substrateData.content?.substring(0, 200) + '...' || '',
                created_at: substrateData.created_at,
                char_count: substrateData.char_count,
                source_type: substrateData.source_type
              };
            }
            break;

          case 'context_item':
            const { data: contextData } = await supabase
              .from('context_items')
              .select('id, content, type, title, description, created_at')
              .eq('id', ref.substrate_id)
              .maybeSingle();
            substrateData = contextData;
            if (substrateData) {
              substrateSummary = {
                substrate_type: 'context_item',
                substrate_id: substrateData.id,
                title: substrateData.title || null,
                preview: substrateData.content?.substring(0, 200) + '...' || substrateData.description || '',
                created_at: substrateData.created_at,
                context_type: substrateData.type,
                is_validated: true
              };
            }
            break;

          // Note: reflections removed from substrate_type enum
          // Reflections are now artifacts in reflections_artifact table

          case 'timeline_event':
            const { data: eventData } = await supabase
              .from('timeline_events')
              .select('id, kind, payload, ts, actor_id, created_at')
              .eq('id', ref.substrate_id)
              .maybeSingle();
            substrateData = eventData;
            if (substrateData) {
              substrateSummary = {
                substrate_type: 'timeline_event',
                substrate_id: substrateData.id,
                title: null,
                preview: `${substrateData.kind}: ${JSON.stringify(substrateData.payload).substring(0, 150)}...`,
                created_at: substrateData.created_at,
                event_kind: substrateData.kind,
                actor_id: substrateData.actor_id
              };
            }
            break;

          default:
            console.warn(`Unknown substrate type: ${ref.substrate_type}`);
            continue;
        }

        // Add to composition if substrate was found
        if (substrateData && substrateSummary!) {
          compositionRefs.push({
            reference: {
              id: ref.id,
              document_id: ref.document_id,
              substrate_type: ref.substrate_type,
              substrate_id: ref.substrate_id,
              role: ref.role || undefined,
              weight: ref.weight || undefined,
              snippets: Array.isArray(ref.snippets) ? ref.snippets : [],
              metadata: ref.metadata || {},
              created_at: ref.created_at,
              created_by: ref.created_by || undefined
            },
            substrate: substrateSummary
          });
        }
      } catch (error) {
        console.warn(`Failed to process substrate reference ${ref.id}:`, error);
      }
    }

    // Calculate composition stats
    const stats = {
      blocks_count: compositionRefs.filter(r => r.reference.substrate_type === 'block').length,
      dumps_count: compositionRefs.filter(r => r.reference.substrate_type === 'dump').length,
      context_items_count: compositionRefs.filter(r => r.reference.substrate_type === 'context_item').length,
      // reflections_count removed - reflections are artifacts not substrates
      timeline_events_count: compositionRefs.filter(r => r.reference.substrate_type === 'timeline_event').length,
      total_references: compositionRefs.length
    };

    const composition: DocumentComposition = {
      document: {
        id: document.id,
        basket_id: document.basket_id,
        title: document.title,
        content_raw: document.content_raw || '',
        created_at: document.created_at,
        updated_at: document.updated_at,
        metadata: document.metadata || {}
      },
      references: compositionRefs,
      composition_stats: stats
    };

    return withSchema(DocumentCompositionSchema, composition, { status: 200 });

  } catch (error) {
    console.error('Document composition error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}