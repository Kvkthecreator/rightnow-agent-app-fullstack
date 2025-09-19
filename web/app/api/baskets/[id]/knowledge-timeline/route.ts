export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * Clean Knowledge Timeline API
 * 
 * Canon v3.0: Knowledge evolution story (artifact-like)
 * Shows user-meaningful milestones in their knowledge journey
 * NOT technical processing details
 */

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id: basketId } = await ctx.params;
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const significance = url.searchParams.get('significance') as 'low' | 'medium' | 'high' | null;
    
    const supabase = createServerSupabaseClient() as any;
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Verify basket access
    const { data: basket } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basketId)
      .eq('workspace_id', workspace.id)
      .single();
      
    if (!basket) {
      return NextResponse.json({ error: "Basket not found" }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('knowledge_timeline')
      .select(`
        id,
        event_type,
        title,
        description,
        significance,
        metadata,
        related_ids,
        created_at
      `)
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by significance if requested
    if (significance) {
      query = query.eq('significance', significance);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Knowledge timeline query error:', error);
      // Graceful handling for missing table during migration
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          timeline: [],
          total: 0,
          basket_id: basketId
        });
      }
      return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
    }

    // Transform for frontend
    const timeline = (events || []).map((event: any) => ({
      id: event.id,
      type: event.event_type,
      title: event.title,
      description: event.description,
      significance: event.significance,
      metadata: event.metadata || {},
      relatedIds: event.related_ids || {},
      timestamp: event.created_at,
      // User-friendly display
      icon: getEventIcon(event.event_type),
      color: getEventColor(event.significance)
    }));

    return NextResponse.json({
      success: true,
      timeline,
      total: timeline.length,
      basket_id: basketId
    });

  } catch (error) {
    console.error('Knowledge timeline error:', error);
    return NextResponse.json({ 
      error: "Timeline fetch failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper functions for UI display
function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    'memory.captured': '📝',
    'knowledge.evolved': '🧱', 
    'insights.discovered': '💡',
    'document.created': '📄',
    'document.updated': '✏️',
    'relationships.mapped': '🔗',
    'governance.decided': '⚖️',
    'milestone.achieved': '🎯'
  };
  return icons[eventType] || '📌';
}

function getEventColor(significance: string): string {
  const colors: Record<string, string> = {
    'low': 'text-gray-600',
    'medium': 'text-blue-600', 
    'high': 'text-green-600'
  };
  return colors[significance] || 'text-gray-600';
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}