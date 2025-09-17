-- Add fn_archive_context_item for canon-compliant context item deletion
-- Matches fn_archive_block pattern with tombstones and retention policy
-- Canon v1.0: Context items → Delete/Deprecate (soft), or ArchiveContextItem when available

BEGIN;

-- Create fn_archive_context_item function
CREATE OR REPLACE FUNCTION public.fn_archive_context_item(
  p_basket_id uuid, 
  p_context_item_id uuid, 
  p_actor_id uuid DEFAULT NULL::uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id uuid;
  v_preview jsonb;
  v_event_ids uuid[] := '{}';
  v_tomb_id uuid;
  v_refs_count int := 0;
  v_rels_count int := 0;
  v_docs_count int := 0;
BEGIN
  -- Get workspace_id from basket
  SELECT workspace_id INTO v_workspace_id FROM baskets WHERE id = p_basket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Basket % not found', p_basket_id;
  END IF;

  -- Verify context item exists in basket
  IF NOT EXISTS (
    SELECT 1 FROM context_items 
    WHERE id = p_context_item_id AND basket_id = p_basket_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Context item % not found in basket % or already archived', p_context_item_id, p_basket_id;
  END IF;

  -- Get cascade preview for tombstone counts
  SELECT fn_cascade_preview(p_basket_id, 'context_item', p_context_item_id) INTO v_preview;
  
  -- Extract counts from preview
  v_refs_count := COALESCE((v_preview->'substrate_references_detached')::int, 0);
  v_rels_count := COALESCE((v_preview->'relationships_pruned')::int, 0);
  v_docs_count := COALESCE((v_preview->'affected_documents')::int, 0);

  -- Archive context item (soft delete)
  UPDATE context_items
    SET status = 'archived', updated_at = now()
    WHERE id = p_context_item_id AND basket_id = p_basket_id;

  -- Detach from documents (substrate_references)
  DELETE FROM substrate_references
    WHERE substrate_id = p_context_item_id AND substrate_type = 'context_item';

  -- Prune relationships involving this context item
  DELETE FROM substrate_relationships
    WHERE (from_id = p_context_item_id AND from_type = 'context_item')
       OR (to_id = p_context_item_id AND to_type = 'context_item');

  -- Create tombstone for retention tracking
  INSERT INTO substrate_tombstones (
    workspace_id, basket_id, substrate_type, substrate_id,
    deletion_mode, redaction_scope, redaction_reason,
    refs_detached_count, relationships_pruned_count, affected_documents_count,
    created_by
  ) VALUES (
    v_workspace_id, p_basket_id, 'context_item', p_context_item_id,
    'archived', NULL, 'user_archive',
    v_refs_count, v_rels_count, v_docs_count,
    p_actor_id
  ) RETURNING id INTO v_tomb_id;

  -- Set earliest_physical_delete_at from retention policy if enabled
  BEGIN
    DECLARE
      v_flags jsonb;
      v_retention_days text;
    BEGIN
      SELECT public.get_workspace_governance_flags(v_workspace_id) INTO v_flags;
      
      IF COALESCE((v_flags->>'retention_enabled')::boolean, false) THEN
        v_retention_days := v_flags->'retention_policy'->'context_item'->>'days';
        
        IF v_retention_days IS NOT NULL THEN
          UPDATE substrate_tombstones
            SET earliest_physical_delete_at = now() + (v_retention_days::int || ' days')::interval
            WHERE id = v_tomb_id;
        END IF;
      END IF;
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore retention policy errors, tombstone still created
    NULL;
  END;

  -- Emit timeline event
  PERFORM emit_timeline_event(
    p_basket_id, 
    'context_item.archived',
    jsonb_build_object(
      'context_item_id', p_context_item_id,
      'tomb_id', v_tomb_id,
      'refs_detached', v_refs_count,
      'relationships_pruned', v_rels_count,
      'affected_documents', v_docs_count
    ),
    v_workspace_id,
    p_actor_id
  );

  RETURN v_tomb_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fn_archive_context_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_archive_context_item TO service_role;

-- Add context_item.archived to timeline events constraint
ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_kind_check;

ALTER TABLE timeline_events ADD CONSTRAINT timeline_events_kind_check 
CHECK ((kind = ANY (ARRAY[
    -- Legacy events (preserved for compatibility)
    'dump'::text, 'reflection'::text, 'narrative'::text, 'system_note'::text, 'block'::text,
    
    -- P0 Capture events
    'dump.created'::text, 'dump.queued'::text,
    
    -- P1 Substrate events
    'block.created'::text, 'block.updated'::text, 'block.state_changed'::text,
    'context_item.created'::text, 'context_item.updated'::text, 'context_item.archived'::text,
    
    -- P2 Graph events
    'relationship.created'::text, 'relationship.deleted'::text,
    
    -- P3 Reflection events
    'reflection.computed'::text, 'reflection.cached'::text,
    
    -- P4 Presentation events
    'document.created'::text, 'document.updated'::text, 'document.composed'::text,
    'narrative.authored'::text,
    
    -- Document attachment events (legacy)
    'document.block.attached'::text, 'document.block.detached'::text,
    'document.dump.attached'::text, 'document.dump.detached'::text,
    'document.context_item.attached'::text, 'document.context_item.detached'::text,
    'document.reflection.attached'::text, 'document.reflection.detached'::text,
    'document.timeline_event.attached'::text, 'document.timeline_event.detached'::text,
    
    -- Governance events
    'proposal.submitted'::text, 'proposal.approved'::text, 'proposal.rejected'::text,
    'substrate.committed'::text,
    
    -- System events
    'basket.created'::text, 'workspace.member_added'::text,
    'delta.applied'::text, 'delta.rejected'::text,
    'cascade.completed'::text,
    
    -- Universal Work Orchestration events (Canon v2.1)
    'work.initiated'::text, 'work.routed'::text,
    
    -- Queue processing events
    'queue.entry_created'::text, 'queue.processing_started'::text,
    'queue.processing_completed'::text, 'queue.processing_failed'::text
])));

COMMIT;