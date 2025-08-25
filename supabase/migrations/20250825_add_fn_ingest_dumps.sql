-- Add missing fn_ingest_dumps function
-- This function is called by the backend API but was never created

-- Function to ingest dumps with idempotency
-- Handles the canonical file_url field (not legacy file_refs)
CREATE OR REPLACE FUNCTION public.fn_ingest_dumps(
  p_workspace_id uuid,
  p_basket_id uuid,
  p_dumps jsonb
) RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dump jsonb;
  v_dump_id uuid;
  v_dump_created boolean;
  v_results jsonb[] := '{}';
  v_result jsonb;
BEGIN
  -- Process each dump in the array
  FOR v_dump IN SELECT * FROM jsonb_array_elements(p_dumps)
  LOOP
    -- Insert dump with idempotency on dump_request_id
    INSERT INTO public.raw_dumps (
      workspace_id, 
      basket_id,
      dump_request_id, 
      text_dump, 
      file_url,
      source_meta,
      ingest_trace_id
    )
    VALUES (
      p_workspace_id,
      p_basket_id,
      (v_dump->>'dump_request_id'),
      (v_dump->>'text_dump'),
      (v_dump->>'file_url'),
      COALESCE((v_dump->'source_meta')::jsonb, '{}'::jsonb),
      (v_dump->>'ingest_trace_id')
    )
    ON CONFLICT (workspace_id, dump_request_id) 
    DO UPDATE SET 
      text_dump = COALESCE(EXCLUDED.text_dump, public.raw_dumps.text_dump),
      file_url = COALESCE(EXCLUDED.file_url, public.raw_dumps.file_url)
    RETURNING id, (xmax = 0) INTO v_dump_id, v_dump_created;

    -- Emit timeline event for new dumps
    IF v_dump_created THEN
      -- Only emit if fn_timeline_emit exists (graceful fallback)
      BEGIN
        PERFORM public.fn_timeline_emit(
          p_basket_id,
          'dump',
          v_dump_id,
          LEFT(COALESCE((v_dump->>'text_dump'), 'File: ' || (v_dump->>'file_url'), 'Memory added'), 140),
          jsonb_build_object(
            'source', 'ingest',
            'actor_id', auth.uid(),
            'dump_request_id', (v_dump->>'dump_request_id')
          )
        );
      EXCEPTION
        WHEN undefined_function THEN
          -- Ignore if fn_timeline_emit doesn't exist yet
          NULL;
      END;
    END IF;

    -- Build result
    v_result := jsonb_build_object('dump_id', v_dump_id);
    v_results := v_results || v_result;
  END LOOP;

  RETURN v_results;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fn_ingest_dumps(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_ingest_dumps(uuid, uuid, jsonb) TO substrate_writer;