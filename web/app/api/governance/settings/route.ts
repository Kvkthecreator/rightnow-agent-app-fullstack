/**
 * Workspace Governance Settings API
 * 
 * Allows workspace admins to configure governance policies per workspace.
 * Supports per-entry-point policies and risk management settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

// Ensure this route is treated as dynamic (requires authentication)
export const dynamic = 'force-dynamic';
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace access required" }, { status: 401 });
    }

    // Get workspace governance settings
    const { data: settings, error } = await supabase
      .from('workspace_governance_settings')
      .select('*')
      .eq('workspace_id', workspace.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      return NextResponse.json({ 
        error: "Failed to fetch governance settings" 
      }, { status: 500 });
    }

    // Return settings or defaults
    if (settings) {
      return NextResponse.json({
        workspace_id: workspace.id,
        settings: {
          governance_enabled: settings.governance_enabled,
          validator_required: settings.validator_required,
          direct_substrate_writes: settings.direct_substrate_writes,
          governance_ui_enabled: settings.governance_ui_enabled,
          
          entry_point_policies: {
            onboarding_dump: settings.ep_onboarding_dump,
            manual_edit: settings.ep_manual_edit,
            document_edit: settings.ep_document_edit,
            reflection_suggestion: settings.ep_reflection_suggestion,
            graph_action: settings.ep_graph_action,
            timeline_restore: settings.ep_timeline_restore
          },
          
          default_blast_radius: settings.default_blast_radius
        },
        created_at: settings.created_at,
        updated_at: settings.updated_at,
        source: 'workspace_database'
      });
    } else {
      // Return environment defaults
      return NextResponse.json({
        workspace_id: workspace.id,
        settings: {
          governance_enabled: false,
          validator_required: false,
          direct_substrate_writes: true,
          governance_ui_enabled: false,
          
          entry_point_policies: {
            onboarding_dump: 'proposal',
            manual_edit: 'proposal',
            document_edit: 'proposal',
            reflection_suggestion: 'proposal',
            graph_action: 'proposal',
            timeline_restore: 'proposal'
          },
          
          default_blast_radius: 'Scoped'
        },
        source: 'environment_defaults',
        note: 'No workspace-specific settings found - using environment defaults'
      });
    }

  } catch (error) {
    console.error('Governance settings fetch error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace access required" }, { status: 401 });
    }

    // Check if user is workspace admin
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_memberships')
      .select('role')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ 
        error: "Admin access required to modify governance settings" 
      }, { status: 403 });
    }

    const {
      governance_enabled,
      validator_required,
      direct_substrate_writes,
      governance_ui_enabled,
      entry_point_policies,
      default_blast_radius
    } = await req.json();

    // Validate entry point policies
    const validPolicies = ['proposal', 'direct', 'hybrid'];
    const validBlastRadius = ['Local', 'Scoped', 'Global'];
    
    if (entry_point_policies) {
      for (const [ep, policy] of Object.entries(entry_point_policies)) {
        if (!validPolicies.includes(policy as string)) {
          return NextResponse.json({
            error: `Invalid policy '${policy}' for entry point '${ep}'. Must be: ${validPolicies.join(', ')}`
          }, { status: 400 });
        }
      }
    }

    if (default_blast_radius && !validBlastRadius.includes(default_blast_radius)) {
      return NextResponse.json({
        error: `Invalid blast_radius '${default_blast_radius}'. Must be: ${validBlastRadius.join(', ')}`
      }, { status: 400 });
    }

    // Upsert workspace governance settings
    const { data: settings, error: upsertError } = await supabase
      .from('workspace_governance_settings')
      .upsert({
        workspace_id: workspace.id,
        governance_enabled: governance_enabled ?? false,
        validator_required: validator_required ?? false,
        direct_substrate_writes: direct_substrate_writes ?? true,
        governance_ui_enabled: governance_ui_enabled ?? false,
        
        // Entry point policies (with defaults)
        ep_onboarding_dump: entry_point_policies?.onboarding_dump || 'proposal',
        ep_manual_edit: entry_point_policies?.manual_edit || 'proposal',
        ep_document_edit: entry_point_policies?.document_edit || 'proposal',
        ep_reflection_suggestion: entry_point_policies?.reflection_suggestion || 'proposal',
        ep_graph_action: entry_point_policies?.graph_action || 'proposal',
        ep_timeline_restore: entry_point_policies?.timeline_restore || 'proposal',
        
        default_blast_radius: default_blast_radius || 'Scoped'
      }, {
        onConflict: 'workspace_id'
      })
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json({ 
        error: "Failed to update governance settings",
        details: upsertError.message
      }, { status: 500 });
    }

    // Emit settings change event
    await supabase.rpc('emit_timeline_event', {
      p_basket_id: null, // Workspace-level event
      p_event_type: 'governance.settings_updated',
      p_event_data: {
        workspace_id: workspace.id,
        updated_by: user.id,
        new_settings: settings
      },
      p_workspace_id: workspace.id,
      p_actor_id: user.id
    });

    return NextResponse.json({
      success: true,
      workspace_id: workspace.id,
      settings: {
        governance_enabled: settings.governance_enabled,
        validator_required: settings.validator_required,
        direct_substrate_writes: settings.direct_substrate_writes,
        governance_ui_enabled: settings.governance_ui_enabled,
        
        entry_point_policies: {
          onboarding_dump: settings.ep_onboarding_dump,
          manual_edit: settings.ep_manual_edit,
          document_edit: settings.ep_document_edit,
          reflection_suggestion: settings.ep_reflection_suggestion,
          graph_action: settings.ep_graph_action,
          timeline_restore: settings.ep_timeline_restore
        },
        
        default_blast_radius: settings.default_blast_radius
      },
      updated_at: settings.updated_at
    });

  } catch (error) {
    console.error('Governance settings update error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}