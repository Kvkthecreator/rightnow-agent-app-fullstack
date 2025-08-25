import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  DocumentCompositionSchema,
  type DocumentComposition,
  type SubstrateReferenceDTO,
  type SubstrateSummary
} from '@shared/contracts/documents';

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
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Get document with workspace check
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, basket_id, title, created_at, updated_at, metadata, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (docError || !document) {
      return NextResponse.json({ error: 'document not found' }, { status: 404 });
    }

    if (document.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Get all substrate references for this document
    const { data: references, error: refError } = await supabase
      .from('substrate_references')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false });

    if (refError) {
      console.error('Error fetching substrate references:', refError);
      return NextResponse.json({ error: 'Failed to fetch references' }, { status: 500 });
    }

    // Build composition with substrate summaries
    const compositionRefs: Array<{
      reference: SubstrateReferenceDTO;
      substrate: SubstrateSummary;
    }> = [];

    for (const ref of references || []) {
      let substrateSummary: SubstrateSummary;

      try {
        switch (ref.substrate_type) {
          case 'block':
            const { data: block } = await supabase
              .from('context_blocks')
              .select('title, body_md, state, version, created_at')
              .eq('id', ref.substrate_id)
              .single();
            
            substrateSummary = {
              substrate_type: 'block',
              substrate_id: ref.substrate_id,
              title: block?.title || null,
              preview: block?.body_md?.substring(0, 200) + '...' || '',
              created_at: block?.created_at || ref.created_at,
              state: block?.state,
              version: block?.version
            };
            break;

          case 'dump':
            const { data: dump } = await supabase
              .from('raw_dumps')
              .select('id, char_count, source_type, created_at, preview')
              .eq('id', ref.substrate_id)
              .single();
            
            substrateSummary = {
              substrate_type: 'dump',
              substrate_id: ref.substrate_id,
              title: null,
              preview: dump?.preview || 'Raw dump',
              created_at: dump?.created_at || ref.created_at,
              char_count: dump?.char_count,
              source_type: dump?.source_type
            };
            break;

          case 'context_item':
            const { data: contextItem } = await supabase
              .from('context_items')
              .select('content_text, context_type, is_validated, created_at')
              .eq('id', ref.substrate_id)
              .single();
            
            substrateSummary = {
              substrate_type: 'context_item',
              substrate_id: ref.substrate_id,
              title: null,
              preview: contextItem?.content_text?.substring(0, 200) + '...' || '',
              created_at: contextItem?.created_at || ref.created_at,
              context_type: contextItem?.context_type,
              is_validated: contextItem?.is_validated
            };
            break;

          case 'reflection':
            const { data: reflection } = await supabase
              .from('reflections_cache')
              .select('reflection_type, computation_timestamp, created_at')
              .eq('id', ref.substrate_id)
              .single();
            
            substrateSummary = {
              substrate_type: 'reflection',
              substrate_id: ref.substrate_id,
              title: null,
              preview: `${reflection?.reflection_type || 'Reflection'} computed`,
              created_at: reflection?.created_at || ref.created_at,
              reflection_type: reflection?.reflection_type,
              computation_timestamp: reflection?.computation_timestamp
            };
            break;

          case 'timeline_event':
            const { data: event } = await supabase
              .from('timeline_events')
              .select('kind, payload, ts, ref_id')
              .eq('id', ref.substrate_id)
              .single();
            
            substrateSummary = {
              substrate_type: 'timeline_event',
              substrate_id: ref.substrate_id,
              title: null,
              preview: event?.kind || 'Timeline event',
              created_at: event?.ts || ref.created_at,
              event_kind: event?.kind,
              actor_id: event?.ref_id
            };
            break;

          default:
            continue; // Skip unknown substrate types
        }

        compositionRefs.push({
          reference: {
            id: ref.id,
            document_id: ref.document_id,
            substrate_type: ref.substrate_type,
            substrate_id: ref.substrate_id,
            role: ref.role,
            weight: ref.weight,
            snippets: ref.snippets || [],
            metadata: ref.metadata || {},
            created_at: ref.created_at,
            created_by: ref.created_by
          },
          substrate: substrateSummary
        });
      } catch (error) {
        console.warn(`Failed to fetch substrate ${ref.substrate_type}:${ref.substrate_id}`, error);
        // Continue with other references even if one fails
      }
    }

    // Calculate composition stats
    const stats = {
      blocks_count: compositionRefs.filter(r => r.reference.substrate_type === 'block').length,
      dumps_count: compositionRefs.filter(r => r.reference.substrate_type === 'dump').length,
      context_items_count: compositionRefs.filter(r => r.reference.substrate_type === 'context_item').length,
      reflections_count: compositionRefs.filter(r => r.reference.substrate_type === 'reflection').length,
      timeline_events_count: compositionRefs.filter(r => r.reference.substrate_type === 'timeline_event').length,
      total_references: compositionRefs.length
    };

    const composition: DocumentComposition = {
      document: {
        id: document.id,
        basket_id: document.basket_id,
        title: document.title,
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