-- Fix substrate reference functions to use correct timeline event emission
-- The functions were calling emit_timeline_event with wrong parameters,
-- they should use fn_timeline_emit instead

-- Fix attachment function
CREATE OR REPLACE FUNCTION fn_document_attach_substrate(
  p_document_id uuid,
  p_substrate_type substrate_type,
  p_substrate_id uuid,
  p_role text DEFAULT NULL,
  p_weight numeric DEFAULT NULL,
  p_snippets jsonb DEFAULT '[]'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_basket uuid;
  v_event_kind text;
BEGIN
  -- Validate substrate exists based on type (using actual table names)
  CASE p_substrate_type
    WHEN 'block' THEN
      IF NOT EXISTS (SELECT 1 FROM blocks WHERE id = p_substrate_id) THEN
        RAISE EXCEPTION 'Block % not found', p_substrate_id;
      END IF;
    WHEN 'dump' THEN
      IF NOT EXISTS (SELECT 1 FROM raw_dumps WHERE id = p_substrate_id) THEN
        RAISE EXCEPTION 'Dump % not found', p_substrate_id;
      END IF;
    WHEN 'context_item' THEN
      IF NOT EXISTS (SELECT 1 FROM context_items WHERE id = p_substrate_id) THEN
        RAISE EXCEPTION 'Context item % not found', p_substrate_id;
      END IF;
    WHEN 'reflection' THEN
      IF NOT EXISTS (SELECT 1 FROM reflection_cache WHERE id = p_substrate_id) THEN
        RAISE EXCEPTION 'Reflection % not found', p_substrate_id;
      END IF;
    WHEN 'timeline_event' THEN
      IF NOT EXISTS (SELECT 1 FROM timeline_events WHERE id = p_substrate_id) THEN
        RAISE EXCEPTION 'Timeline event % not found', p_substrate_id;
      END IF;
  END CASE;

  -- Check if reference already exists
  SELECT id INTO v_id FROM substrate_references
  WHERE document_id = p_document_id 
    AND substrate_type = p_substrate_type 
    AND substrate_id = p_substrate_id;

  IF v_id IS NULL THEN
    -- Insert new reference
    INSERT INTO substrate_references (
      document_id, substrate_type, substrate_id, role, weight, snippets, metadata, created_by
    )
    VALUES (
      p_document_id, p_substrate_type, p_substrate_id, p_role, p_weight, p_snippets, p_metadata, auth.uid()
    )
    RETURNING id INTO v_id;
  ELSE
    -- Update existing reference
    UPDATE substrate_references
    SET 
      role = COALESCE(p_role, role),
      weight = COALESCE(p_weight, weight),
      snippets = p_snippets,
      metadata = p_metadata || metadata  -- Merge metadata
    WHERE id = v_id;
  END IF;

  -- Emit timeline event using correct function
  SELECT basket_id INTO v_basket FROM documents WHERE id = p_document_id;
  v_event_kind := 'document.' || p_substrate_type || '.attached';
  
  PERFORM fn_timeline_emit(
    v_basket,
    v_event_kind,
    p_document_id,
    'Substrate ' || p_substrate_type || ' attached to document',
    jsonb_build_object(
      'document_id', p_document_id,
      'substrate_type', p_substrate_type,
      'substrate_id', p_substrate_id,
      'reference_id', v_id
    )
  );

  RETURN v_id;
END;
$$;

-- Fix detachment function
CREATE OR REPLACE FUNCTION fn_document_detach_substrate(
  p_document_id uuid,
  p_substrate_type substrate_type,
  p_substrate_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_basket uuid;
  v_event_kind text;
BEGIN
  -- Delete the reference
  DELETE FROM substrate_references
  WHERE document_id = p_document_id 
    AND substrate_type = p_substrate_type 
    AND substrate_id = p_substrate_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Emit timeline event using correct function
  SELECT basket_id INTO v_basket FROM documents WHERE id = p_document_id;
  v_event_kind := 'document.' || p_substrate_type || '.detached';
  
  PERFORM fn_timeline_emit(
    v_basket,
    v_event_kind,
    p_document_id,
    'Substrate ' || p_substrate_type || ' detached from document',
    jsonb_build_object(
      'document_id', p_document_id,
      'substrate_type', p_substrate_type,
      'substrate_id', p_substrate_id
    )
  );

  RETURN true;
END;
$$;