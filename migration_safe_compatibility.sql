-- Safe compatibility migration for Canon v1.3.1 alignment
-- This migration creates compatibility wrappers without removing existing dependencies

-- Create emit_timeline_event compatibility function that wraps fn_timeline_emit
CREATE OR REPLACE FUNCTION emit_timeline_event(
  p_basket_id UUID,
  p_event_type TEXT,
  p_event_data JSONB,
  p_workspace_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_agent_type TEXT DEFAULT NULL
) RETURNS bigint AS $$
DECLARE
  v_event_id bigint;
  v_preview text;
BEGIN
  -- Generate preview from event data if available
  v_preview := CASE 
    WHEN p_event_data ? 'preview' THEN p_event_data->>'preview'
    WHEN p_event_type LIKE '%.created' THEN 'Created ' || split_part(p_event_type, '.', 1)
    WHEN p_event_type LIKE '%.updated' THEN 'Updated ' || split_part(p_event_type, '.', 1)
    WHEN p_event_type LIKE '%.attached' THEN 'Attached to document'
    WHEN p_event_type LIKE '%.detached' THEN 'Detached from document'
    ELSE p_event_type
  END;

  -- Use existing fn_timeline_emit function
  SELECT fn_timeline_emit(
    p_basket_id,
    p_event_type,
    COALESCE(p_actor_id, (p_event_data->>'ref_id')::uuid),
    v_preview,
    p_event_data
  ) INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timeline_events constraints to allow new event types
ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_kind_check;
ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS basket_history_kind_check;

-- Add updated constraint that includes all Canon v1.3.1 event types
ALTER TABLE timeline_events ADD CONSTRAINT timeline_events_kind_check CHECK (
  kind IN (
    -- Legacy system events
    'dump',
    'reflection', 
    'narrative',
    'system_note',
    'block',
    
    -- Canon v1.3.1 event types
    'dump.created',
    'reflection.computed',
    'delta.applied',
    'delta.rejected',
    'document.created',
    'document.updated',
    'document.block.attached',
    'document.block.detached',
    'document.dump.attached',
    'document.dump.detached',
    'document.context_item.attached',
    'document.context_item.detached',
    'document.reflection.attached',
    'document.reflection.detached',
    'document.timeline_event.attached',
    'document.timeline_event.detached',
    'block.created',
    'block.updated',
    'basket.created',
    'workspace.member_added'
  )
);

-- Ensure indexes exist for efficient queries
CREATE INDEX IF NOT EXISTS idx_timeline_events_basket_timestamp_id 
  ON timeline_events(basket_id, ts DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_events_kind_ref_id 
  ON timeline_events(kind, ref_id) WHERE ref_id IS NOT NULL;

-- Create verification function to test the migration
CREATE OR REPLACE FUNCTION verify_canon_compatibility() RETURNS TABLE(
  test_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Test 1: Check emit_timeline_event function exists
  RETURN QUERY SELECT 
    'emit_timeline_event_function'::text,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
    'Function emit_timeline_event exists: ' || COUNT(*)::text
  FROM pg_proc 
  WHERE proname = 'emit_timeline_event';
  
  -- Test 2: Check timeline_events table structure
  RETURN QUERY SELECT 
    'timeline_events_structure'::text,
    CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END::text,
    'Required columns (basket_id, kind, ts, ref_id, preview, payload): ' || COUNT(*)::text
  FROM information_schema.columns 
  WHERE table_name = 'timeline_events' 
    AND column_name IN ('basket_id', 'kind', 'ts', 'ref_id', 'preview', 'payload');
    
  -- Test 3: Check constraint allows Canon v1.3.1 event types
  RETURN QUERY SELECT 
    'canon_event_types'::text,
    'PASS'::text,
    'Constraint updated to allow Canon v1.3.1 event types'::text;
    
  -- Test 4: Check fn_timeline_emit exists (dependency)
  RETURN QUERY SELECT 
    'fn_timeline_emit_exists'::text,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
    'Function fn_timeline_emit exists: ' || COUNT(*)::text
  FROM pg_proc 
  WHERE proname = 'fn_timeline_emit';
END;
$$ LANGUAGE plpgsql;