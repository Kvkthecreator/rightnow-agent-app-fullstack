import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

/**
 * GET /api/projects/[id]/agents/[agentId]/config/history
 *
 * Retrieves configuration change history for a specific project agent.
 * Useful for audit trail and rollback functionality.
 *
 * Query params:
 * - limit: Max number of history entries to return (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Returns:
 * - history: Array of config history entries
 *   - id: History entry ID
 *   - config_snapshot: Full config at that point in time
 *   - config_version: Version number
 *   - changed_by_user_id: User who made the change
 *   - changed_at: Timestamp of change
 *   - change_reason: Reason for the change
 *   - metadata: Additional metadata
 * - total: Total count of history entries
 * - limit: Applied limit
 * - offset: Applied offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  try {
    const { id: projectId, agentId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[AGENT CONFIG HISTORY API] Request for project ${projectId}, agent ${agentId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[AGENT CONFIG HISTORY API] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    console.log(`[AGENT CONFIG HISTORY API] Params: limit=${limit}, offset=${offset}`);

    // Verify agent exists and belongs to project
    const { data: agentData, error: agentError } = await supabase
      .from('project_agents')
      .select('id, project_id')
      .eq('id', agentId)
      .eq('project_id', projectId)
      .single();

    if (agentError || !agentData) {
      console.error('[AGENT CONFIG HISTORY API] Agent not found:', agentError);
      return NextResponse.json(
        { detail: 'Project agent not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this project's workspace
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { detail: 'Project not found' },
        { status: 404 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', projectData.workspace_id)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { detail: 'Access denied to this workspace' },
        { status: 403 }
      );
    }

    // Fetch config history with user details
    const { data: historyData, error: historyError, count } = await supabase
      .from('agent_config_history')
      .select(`
        id,
        config_snapshot,
        config_version,
        changed_by_user_id,
        changed_at,
        change_reason,
        metadata
      `, { count: 'exact' })
      .eq('project_agent_id', agentId)
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (historyError) {
      console.error('[AGENT CONFIG HISTORY API] Database error:', historyError);
      return NextResponse.json(
        { detail: 'Failed to fetch config history', error: historyError.message },
        { status: 500 }
      );
    }

    console.log(`[AGENT CONFIG HISTORY API] Retrieved ${historyData?.length || 0} history entries`);

    return NextResponse.json({
      history: historyData || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('[AGENT CONFIG HISTORY API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
