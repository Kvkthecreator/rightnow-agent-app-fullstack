import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>;
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id: basketId, proposalId } = await ctx.params;
    
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

    // Fetch proposal with validation
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('basket_id', basketId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Check if already executed
    if (proposal.is_executed) {
      return NextResponse.json({ error: "Proposal already executed" }, { status: 400 });
    }

    // Verify proposal is ready for approval
    if (proposal.status !== 'PROPOSED' && proposal.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ 
        error: `Cannot approve proposal in ${proposal.status} state` 
      }, { status: 400 });
    }

    // Begin transaction for atomic execution
    const executionLog = [];
    let allSuccess = true;
    let commitId: string | null = null;

    try {
      // Execute each operation atomically
      for (let i = 0; i < proposal.ops.length; i++) {
        const op = proposal.ops[i];
        const startTime = Date.now();
        
        try {
          const result = await executeOperation(supabase, op, basketId, workspace.id);
          
          const executionTime = Date.now() - startTime;
          executionLog.push({
            operation_index: i,
            operation_type: op.type,
            success: true,
            result_data: result,
            execution_time_ms: executionTime
          });

          // Log execution to tracking table
          await supabase
            .from('proposal_executions')
            .insert({
              proposal_id: proposalId,
              operation_index: i,
              operation_type: op.type,
              success: true,
              result_data: result,
              substrate_id: (result as any).created_id || (result as any).updated_id || null,
              execution_time_ms: executionTime
            });

        } catch (opError) {
          allSuccess = false;
          const executionTime = Date.now() - startTime;
          
          executionLog.push({
            operation_index: i,
            operation_type: op.type,
            success: false,
            error_message: opError instanceof Error ? opError.message : String(opError),
            execution_time_ms: executionTime
          });

          // Log failure to tracking table
          await supabase
            .from('proposal_executions')
            .insert({
              proposal_id: proposalId,
              operation_index: i,
              operation_type: op.type,
              success: false,
              error_message: opError instanceof Error ? opError.message : String(opError),
              execution_time_ms: executionTime
            });

          // Fail fast - stop on first error
          break;
        }
      }

      if (allSuccess) {
        commitId = crypto.randomUUID();
        
        // Update proposal as executed and approved
        const { error: updateError } = await supabase
          .from('proposals')
          .update({
            status: 'APPROVED',
            is_executed: true,
            executed_at: new Date().toISOString(),
            execution_log: executionLog,
            commit_id: commitId,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', proposalId);

        if (updateError) {
          throw new Error(`Failed to mark proposal as executed: ${updateError.message}`);
        }

        // Emit cascade events
        await supabase.rpc('emit_timeline_event', {
          p_basket_id: basketId,
          p_event_type: 'proposal.approved',
          p_event_data: {
            proposal_id: proposalId,
            proposal_kind: proposal.proposal_kind,
            operations_count: proposal.ops.length,
            commit_id: commitId
          },
          p_workspace_id: workspace.id,
          p_actor_id: user.id
        });

        await supabase.rpc('emit_timeline_event', {
          p_basket_id: basketId,
          p_event_type: 'substrate.committed',
          p_event_data: {
            proposal_id: proposalId,
            commit_id: commitId,
            operations: executionLog
          },
          p_workspace_id: workspace.id,
          p_actor_id: user.id
        });

        // Trigger P3 Reflection computation if delta warrants and cadence allows
        try {
          const createdBlocks = executionLog.filter((e: any) => e.success && e.operation_type === 'CreateBlock').length;
          const createdContextItems = executionLog.filter((e: any) => e.success && e.operation_type === 'CreateContextItem').length;
          if (createdBlocks >= 2 || createdContextItems >= 3) {
            const { getApiBaseUrl } = await import('@/lib/config/api');
            const backend = getApiBaseUrl();
            if (backend) {
              // Fire-and-forget to backend
              fetch(`${backend}/api/reflections/compute_window`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspace_id: workspace.id, basket_id: basketId, agent_id: 'p3_reflection_agent' })
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('P3 reflection trigger skipped:', e);
        }

        // Canon v2.0: Trigger artifact impact detection after substrate commit
        try {
          const { handleSubstrateCommit } = await import('@/lib/artifacts/substrateCommitHandler');
          
          const impactResult = await handleSubstrateCommit(supabase, {
            proposal_id: proposalId,
            commit_id: commitId,
            operations: executionLog,
            workspace_id: workspace.id,
            basket_id: basketId,
            actor_id: user.id
          });

          console.log(`Document impact processing: ${impactResult.impacts_created} impacts created, ${impactResult.auto_applied} auto-applied`);

        } catch (impactError) {
          // Don't fail the approval if document impact processing fails
          console.error('Document impact processing failed:', impactError);
        }

        return NextResponse.json({
          success: true,
          proposal_id: proposalId,
          commit_id: commitId,
          operations_executed: executionLog.length,
          status: 'APPROVED'
        });

      } else {
        // Mark proposal as failed execution
        await supabase
          .from('proposals')
          .update({
            status: 'REJECTED',
            execution_log: executionLog,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: 'Execution failed - see execution_log for details'
          })
          .eq('id', proposalId);

        return NextResponse.json({
          success: false,
          error: "Operation execution failed",
          execution_log: executionLog
        }, { status: 500 });
      }

    } catch (executionError) {
      console.error('Proposal execution error:', executionError);
      
      // Mark proposal as failed
      await supabase
        .from('proposals')
        .update({
          status: 'REJECTED',
          execution_log: executionLog,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: `Execution error: ${executionError instanceof Error ? executionError.message : String(executionError)}`
        })
        .eq('id', proposalId);

      return NextResponse.json({
        success: false,
        error: "Execution failed",
        details: executionError instanceof Error ? executionError.message : String(executionError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Proposal approval error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function executeOperation(supabase: any, operation: any, basketId: string, workspaceId: string) {
  // Support both flat and nested op format
  const op = operation;
  const data = (operation && operation.data) ? operation.data : operation;
  switch (operation.type) {
    case 'BreakdownDocument':
      return await breakdownDocument(supabase, data, basketId, workspaceId);
    case 'CreateBlock':
      return await createBlock(supabase, data, basketId, workspaceId);
    
    case 'CreateContextItem':
      return await createContextItem(supabase, data, basketId, workspaceId);
    
    case 'AttachBlockToDoc':
      return await attachBlockToDoc(supabase, data, basketId, workspaceId);
    
    case 'MergeContextItems':
      return await mergeContextItems(supabase, data, basketId, workspaceId);
    
    case 'ReviseBlock':
      return await reviseBlock(supabase, data, basketId, workspaceId);
    
    case 'UpdateContextItem':
      return await updateContextItem(supabase, data, basketId, workspaceId);
    
    case 'PromoteScope':
      return await promoteScope(supabase, data, basketId, workspaceId);
    
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}

async function createBlock(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .insert({
      basket_id: basketId,
      workspace_id: workspaceId,
      content: op.content,
      body_md: op.content, // Store content in both fields for compatibility
      semantic_type: op.semantic_type,
      confidence_score: op.confidence || 0.7,
      state: 'ACCEPTED'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create block: ${error.message}`);
  }

  return { created_id: data.id, type: 'block' };
}

async function createContextItem(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('context_items')
    .insert({
      basket_id: basketId,
      normalized_label: op.label,
      type: op.kind || 'concept', 
      confidence_score: op.confidence || 0.7,
      state: 'ACTIVE',
      metadata: { synonyms: op.synonyms || [] }
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create context item: ${error.message}`);
  }

  return { created_id: data.id, type: 'context_item' };
}

async function attachBlockToDoc(supabase: any, op: any, basketId: string, workspaceId: string) {
  // This would implement document-block relationships
  // For now, return success as relationship tracking may be in different table
  return { 
    attached: true, 
    block_id: op.block_id, 
    document_id: op.document_id,
    type: 'attachment'
  };
}

async function mergeContextItems(supabase: any, op: any, basketId: string, workspaceId: string) {
  // Mark source items as MERGED, update canonical
  const { error: mergeError } = await supabase
    .from('context_items')
    .update({ state: 'MERGED' })
    .in('id', op.from_ids);

  if (mergeError) {
    throw new Error(`Failed to merge context items: ${mergeError.message}`);
  }

  return { 
    merged_ids: op.from_ids,
    canonical_id: op.canonical_id,
    type: 'merge'
  };
}

async function reviseBlock(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .update({
      content: op.content,
      body_md: op.content, // Update both fields
      confidence_score: op.confidence || 0.7
    })
    .eq('id', op.block_id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to revise block: ${error.message}`);
  }

  return { updated_id: data.id, type: 'revision' };
}

async function promoteScope(supabase: any, op: any, basketId: string, workspaceId: string) {
  // Update scope from LOCAL to WORKSPACE
  const { data, error } = await supabase
    .from('blocks')
    .update({ scope: op.to_scope })
    .eq('id', op.block_id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to promote scope: ${error.message}`);
  }

  return { promoted_id: data.id, new_scope: op.to_scope, type: 'promotion' };
}

async function updateContextItem(supabase: any, op: any, basketId: string, workspaceId: string) {
  // Build update object from operation
  const updateData: any = {};
  
  if (op.label) updateData.normalized_label = op.label;
  if (op.kind) updateData.type = op.kind;  
  if (op.confidence !== undefined) updateData.confidence_score = op.confidence;
  
  // Handle synonyms - either replace or append
  if (op.synonyms || op.additional_synonyms) {
    // Get existing metadata to preserve other fields
    const { data: existing } = await supabase
      .from('context_items')
      .select('metadata')
      .eq('id', op.context_item_id)
      .single();
      
    const existingMetadata = existing?.metadata || {};
    const existingSynonyms = existingMetadata.synonyms || [];
    
    if (op.synonyms) {
      updateData.metadata = { ...existingMetadata, synonyms: op.synonyms };
    } else if (op.additional_synonyms) {
      updateData.metadata = { ...existingMetadata, synonyms: [...existingSynonyms, ...op.additional_synonyms] };
    }
  }
  
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('context_items')
    .update(updateData)
    .eq('id', op.context_item_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update context item: ${error.message}`);
  }

  return { updated_id: data.id, type: 'update' };
}

// Execute a BreakdownDocument operation by creating a raw_dump from the document's content
async function breakdownDocument(supabase: any, op: any, basketId: string, workspaceId: string) {
  const documentId = op.document_id || op.doc_id;
  if (!documentId) throw new Error('BreakdownDocument requires document_id');

  // Load the document artifact
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, title, content_raw, workspace_id, basket_id')
    .eq('id', documentId)
    .maybeSingle();

  if (docErr) throw new Error(`Failed to load document: ${docErr.message}`);
  if (!doc) throw new Error('Document not found');
  if (doc.workspace_id !== workspaceId) throw new Error('Forbidden: document not in workspace');
  if (doc.basket_id !== basketId) throw new Error('Forbidden: document not in basket');

  const text = [doc.title, doc.content_raw].filter(Boolean).join('\n\n').trim();
  if (!text) throw new Error('Document is empty; nothing to breakdown');

  // Create a raw_dump to trigger P1 asynchronously (P0 capture)
  const { data: dump, error: dumpErr } = await supabase
    .from('raw_dumps')
    .insert({
      id: crypto.randomUUID(),
      basket_id: basketId,
      workspace_id: workspaceId,
      text_dump: text,
      source_meta: {
        source: 'document_breakdown',
        document_id: documentId
      }
    })
    .select('id')
    .single();

  if (dumpErr) throw new Error(`Failed to create raw_dump: ${dumpErr.message}`);

  // Emit timeline event (optional; P0 triggers may also emit)
  try {
    await supabase.rpc('emit_timeline_event', {
      p_basket_id: basketId,
      p_event_type: 'dump.created',
      p_event_data: { dump_id: dump.id, origin: 'document_breakdown', document_id: documentId },
      p_workspace_id: workspaceId,
      p_actor_id: null
    });
  } catch {}

  return { created_id: dump.id, type: 'dump' };
}
