import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * GET /api/projects/[id]/agents/[agentId]/config
 *
 * Retrieves agent configuration for a specific project agent.
 * Includes agent_catalog config_schema for validation on client side.
 *
 * Returns:
 * - config: Current agent configuration (jsonb)
 * - config_version: Version number
 * - config_updated_at: Last update timestamp
 * - config_updated_by: User who last updated
 * - config_schema: JSON Schema from agent_catalog for validation
 * - agent_type: Agent type for context
 * - display_name: User-friendly name
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  try {
    const { id: projectId, agentId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[AGENT CONFIG API] GET request for project ${projectId}, agent ${agentId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[AGENT CONFIG API] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[AGENT CONFIG API] Auth successful, user:', session.user.id);

    // Fetch project_agent with config and related agent_catalog
    const { data: agentData, error: agentError } = await supabase
      .from('project_agents')
      .select(`
        id,
        project_id,
        agent_type,
        display_name,
        is_active,
        config,
        config_version,
        config_updated_at,
        config_updated_by,
        agent_catalog!inner(
          config_schema,
          schema_version,
          icon,
          is_beta
        )
      `)
      .eq('id', agentId)
      .eq('project_id', projectId)
      .single();

    if (agentError || !agentData) {
      console.error('[AGENT CONFIG API] Agent not found:', agentError);
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

    console.log(`[AGENT CONFIG API] Retrieved config for agent ${agentId}`);

    // Type assertion: agent_catalog is a single object, not an array (due to !inner join)
    const catalog = Array.isArray(agentData.agent_catalog)
      ? agentData.agent_catalog[0]
      : agentData.agent_catalog;

    return NextResponse.json({
      id: agentData.id,
      agent_type: agentData.agent_type,
      display_name: agentData.display_name,
      is_active: agentData.is_active,
      config: agentData.config,
      config_version: agentData.config_version,
      config_updated_at: agentData.config_updated_at,
      config_updated_by: agentData.config_updated_by,
      config_schema: catalog?.config_schema || {},
      schema_version: catalog?.schema_version || 1,
      icon: catalog?.icon,
      is_beta: catalog?.is_beta,
    });

  } catch (error) {
    console.error('[AGENT CONFIG API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/agents/[agentId]/config
 *
 * Updates agent configuration for a specific project agent.
 * Validates config against agent_catalog.config_schema.
 * Automatically creates audit trail via trigger.
 *
 * Payload (JSON):
 * - config: New configuration object (validated against schema)
 * - change_reason: Optional reason for the change (for audit)
 *
 * Returns:
 * - config: Updated configuration
 * - config_version: New version number
 * - config_updated_at: Update timestamp
 * - validation_errors: Array of validation errors (if validation failed)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  try {
    const { id: projectId, agentId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[AGENT CONFIG API] PUT request for project ${projectId}, agent ${agentId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[AGENT CONFIG API] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[AGENT CONFIG API] Auth successful, user:', session.user.id);

    // Parse request body
    const body = await request.json();
    const { config, change_reason } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { detail: 'config is required and must be an object' },
        { status: 400 }
      );
    }

    // Fetch current project_agent with schema
    const { data: agentData, error: agentError } = await supabase
      .from('project_agents')
      .select(`
        id,
        project_id,
        agent_type,
        config_version,
        agent_catalog!inner(
          config_schema,
          schema_version
        )
      `)
      .eq('id', agentId)
      .eq('project_id', projectId)
      .single();

    if (agentError || !agentData) {
      console.error('[AGENT CONFIG API] Agent not found:', agentError);
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

    // Validate config against JSON Schema
    // Type assertion: agent_catalog is a single object, not an array (due to !inner join)
    const catalog = Array.isArray(agentData.agent_catalog)
      ? agentData.agent_catalog[0]
      : agentData.agent_catalog;
    const configSchema = catalog?.config_schema || {};

    if (Object.keys(configSchema).length > 0) {
      const validate = ajv.compile(configSchema);
      const valid = validate(config);

      if (!valid) {
        console.warn('[AGENT CONFIG API] Config validation failed:', validate.errors);
        return NextResponse.json(
          {
            detail: 'Configuration validation failed',
            validation_errors: validate.errors,
          },
          { status: 400 }
        );
      }
    }

    console.log('[AGENT CONFIG API] Config validation passed');

    // Update project_agent config
    const newVersion = agentData.config_version + 1;
    const now = new Date().toISOString();

    const { data: updatedAgent, error: updateError } = await supabase
      .from('project_agents')
      .update({
        config,
        config_version: newVersion,
        config_updated_at: now,
        config_updated_by: session.user.id,
      })
      .eq('id', agentId)
      .select()
      .single();

    if (updateError || !updatedAgent) {
      console.error('[AGENT CONFIG API] Update failed:', updateError);
      return NextResponse.json(
        { detail: 'Failed to update configuration', error: updateError?.message },
        { status: 500 }
      );
    }

    // If change_reason was provided, update the auto-captured history entry
    if (change_reason) {
      // The trigger has already created the history entry, but with generic reason
      // Update the most recent entry for this agent with the user's reason
      const { error: historyUpdateError } = await supabase
        .from('agent_config_history')
        .update({
          change_reason,
        })
        .eq('project_agent_id', agentId)
        .eq('config_version', newVersion)
        .eq('changed_at', now);

      if (historyUpdateError) {
        console.warn('[AGENT CONFIG API] Failed to update history reason:', historyUpdateError);
        // Don't fail the request, history update is non-critical
      }
    }

    console.log(`[AGENT CONFIG API] Config updated successfully, version ${newVersion}`);

    return NextResponse.json({
      id: updatedAgent.id,
      config: updatedAgent.config,
      config_version: updatedAgent.config_version,
      config_updated_at: updatedAgent.config_updated_at,
      config_updated_by: updatedAgent.config_updated_by,
    });

  } catch (error) {
    console.error('[AGENT CONFIG API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
