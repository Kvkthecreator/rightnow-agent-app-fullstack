-- Create timeline_events as a view over events table for schema consistency
-- This aligns with Canon v1.3.1 where timeline_events is the canonical interface

-- The events table should already have workspace_id from 20250817_add_events_table.sql
-- But let's ensure it's backfilled and properly constrained

-- Backfill any missing workspace_id in events table from baskets
UPDATE public.events e
SET workspace_id = b.workspace_id
FROM public.baskets b
WHERE e.workspace_id IS NULL
  AND e.basket_id = b.id;

-- Create timeline_events as a materialized view over events
-- This provides the canonical timeline interface expected by Canon v1.3.1
DROP VIEW IF EXISTS public.timeline_events;
CREATE VIEW public.timeline_events AS
SELECT
  id::bigint AS id,
  basket_id,
  workspace_id,
  ts,
  kind,
  id AS ref_id,  -- Use event id as ref_id for now
  CASE 
    WHEN payload ? 'preview' THEN payload->>'preview'
    WHEN kind = 'dump' AND payload ? 'char_count' THEN 'Added ' || (payload->>'char_count') || ' characters'
    WHEN kind = 'reflection.computed' THEN 'Computed reflection'
    ELSE kind
  END AS preview,
  payload
FROM public.events;

-- Create indexes on the underlying events table for timeline queries
CREATE INDEX IF NOT EXISTS idx_events_timeline_basket_ts_id
  ON public.events (basket_id, ts DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_events_timeline_workspace_ts_id
  ON public.events (workspace_id, ts DESC, id DESC);

-- Update emit functions to work with events table
CREATE OR REPLACE FUNCTION public.fn_timeline_emit(
  p_basket_id uuid,
  p_kind      text,
  p_ref_id    uuid,
  p_preview   text,
  p_payload   jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_ws uuid;
BEGIN
  -- Get workspace_id from basket
  SELECT workspace_id INTO v_ws FROM public.baskets WHERE id = p_basket_id;
  
  IF v_ws IS NULL THEN
    RAISE EXCEPTION 'Basket % not found or has no workspace_id', p_basket_id;
  END IF;

  -- Check for existing dump event (idempotency)
  IF p_kind = 'dump.created' AND EXISTS (
    SELECT 1 FROM public.events WHERE kind='dump.created' AND id=p_ref_id
  ) THEN
    SELECT id INTO v_id
    FROM public.events
    WHERE kind='dump.created' AND id=p_ref_id
    ORDER BY ts DESC LIMIT 1;
    RETURN v_id::bigint;
  END IF;

  -- Add preview to payload for compatibility
  p_payload = p_payload || jsonb_build_object('preview', p_preview);

  -- Insert into events table
  INSERT INTO public.events (basket_id, workspace_id, ts, kind, payload, origin)
  VALUES (p_basket_id, v_ws, now(), p_kind, p_payload, 'system')
  RETURNING id INTO v_id;

  RETURN v_id::bigint;
END;
$$;