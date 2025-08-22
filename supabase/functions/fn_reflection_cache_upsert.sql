-- fn_reflection_cache_upsert.sql
-- Upsert a single cached reflection row for a basket if meta_derived_from differs.

create or replace function public.fn_reflection_cache_upsert(
  p_basket_id uuid,
  p_pattern text,
  p_tension text,
  p_question text,
  p_meta_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last text;
  v_changed boolean := false;
begin
  select meta_derived_from into v_last
  from public.basket_reflections
  where basket_id = p_basket_id
  order by computed_at desc
  limit 1;

  if v_last is distinct from p_meta_hash then
    insert into public.basket_reflections (id, basket_id, pattern, tension, question, meta_derived_from)
    values (gen_random_uuid(), p_basket_id, p_pattern, p_tension, p_question, p_meta_hash);

    -- Emit machine event to events table
    insert into public.events (id, basket_id, kind, payload, workspace_id, origin)
    values (gen_random_uuid(), p_basket_id, 'reflection.computed',
            jsonb_build_object('basket_id', p_basket_id, 'meta_derived_from', p_meta_hash),
            null, 'system');

    -- Optional: surface a small note to timeline
    insert into public.timeline_events (basket_id, kind, preview, payload)
    values (p_basket_id, 'system_note', 'Reflections updated', jsonb_build_object('meta_derived_from', p_meta_hash));

    v_changed := true;
  end if;

  return v_changed;
end;
$$;