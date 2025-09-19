export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createTestAwareClient, getTestAwareAuth } from "@/lib/auth/testHelpers";
import { createServiceRoleClient } from "@/lib/supabase/clients";
import { ensureWorkspaceForUser } from "@/lib/workspaces/ensureWorkspaceForUser";
import { z } from "zod";

/**
 * Canon-Pure Document Composition API
 * 
 * Direct artifact operations - NO governance required per YARNNN Canon v2.3
 * Creates new documents from memory substrate without governance overhead
 */

const ComposeRequestSchema = z.object({
  title: z.string().min(1),
  intent: z.string().optional(),
  basket_id: z.string().uuid(),
  window_days: z.number().min(1).max(365).default(30),
  pinned_ids: z.array(z.string().uuid()).optional()
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = ComposeRequestSchema.safeParse(raw);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid compose request", 
        details: parsed.error.flatten() 
      }, { status: 422 });
    }

    const { title, intent, basket_id, window_days, pinned_ids } = parsed.data;
    const supabase = createTestAwareClient({ cookies });
    const serviceSupabase = createServiceRoleClient();
    const { userId, isTest } = await getTestAwareAuth(supabase);

    // Get workspace (required for all operations)
    const workspace = isTest 
      ? { id: '00000000-0000-0000-0000-000000000002' }
      : await ensureWorkspaceForUser(userId, supabase);

    // Verify basket access
    const { data: basket } = await supabase
      .from('baskets')
      .select('id')
      .eq('id', basket_id)
      .eq('workspace_id', workspace.id)
      .single();
      
    if (!basket) {
      return NextResponse.json({ error: "Basket not found or access denied" }, { status: 404 });
    }

    // Canon-Pure: Direct document creation (artifact operation)
    const document_id = crypto.randomUUID();
    
    // Create document record directly (no governance)
    const { data: document, error: docError } = await serviceSupabase
      .from('documents')
      .insert({
        id: document_id,
        basket_id,
        workspace_id: workspace.id,
        title,
        content_raw: intent ? `# ${title}\n\n${intent}\n\n_Composing from your memory..._` : `# ${title}\n\n_Composing from your memory..._`,
        content_rendered: `<h1>${title}</h1>${intent ? `<p>${intent}</p>` : ''}<p><em>Composing from your memory...</em></p>`,
        status: 'composing',
        metadata: {
          composition_intent: intent,
          composition_source: 'memory',
          creation_method: 'compose_new',
          window_days,
          pinned_ids: pinned_ids || []
        }
      })
      .select()
      .single();

    if (docError || !document) {
      return NextResponse.json({ 
        error: "Failed to create document", 
        details: docError?.message 
      }, { status: 500 });
    }

    // Trigger P4 composition asynchronously (direct agent call, not governance)
    try {
      const compositionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/agents/p4-composition`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          document_id,
          basket_id,
          workspace_id: workspace.id,
          intent: intent || '',
          window: { days: window_days },
          pinned_ids: pinned_ids || []
        })
      });

      if (!compositionResponse.ok) {
        console.warn('P4 composition trigger failed, but document created successfully');
      }
    } catch (e) {
      console.warn('P4 composition async trigger failed:', e);
      // Don't fail the request - document was created successfully
    }

    return NextResponse.json({
      success: true,
      document_id,
      title,
      status: 'composing',
      composition_started: true,
      message: 'Document created and composition started'
    }, { status: 201 });

  } catch (error) {
    console.error('Document composition error:', error);
    return NextResponse.json({ 
      error: "Document composition failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}