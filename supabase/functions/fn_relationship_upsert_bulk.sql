-- fn_relationship_upsert_bulk.sql
-- Bulk, idempotent-ish upsert of directed, typed edges into substrate_relationships.
-- Uses the general-purpose `events` table for an emit (since timeline_events.kind is constrained).

create or replace function public.fn_relationship_upsert_bulk(
  p_basket_id uuid,
  p_edges jsonb,
  p_idem_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created int := 0;
  v_ignored int := 0;
  v_e jsonb;
  v_from_type text;
  v_from_id uuid;
  v_to_type text;
  v_to_id uuid;
  v_rel_type text;
  v_desc text;
  v_strength numeric;
begin
  if p_edges is null or jsonb_typeof(p_edges) <> 'array' then
    raise exception 'edges must be a jsonb array';
  end if;

  -- Simple idempotency guard via events: if we've already logged this idem_key for this basket, short-circuit.
  if p_idem_key is not null and exists (
    select 1 from public.events
    where basket_id = p_basket_id
      and kind = 'rel.bulk_upserted'
      and (payload->>'idem_key') = p_idem_key
  ) then
    return jsonb_build_object('created', 0, 'ignored', 0, 'idem_reused', true);
  end if;

  for v_e in select * from jsonb_array_elements(p_edges) loop
    v_from_type := v_e->>'from_type';
    v_from_id   := (v_e->>'from_id')::uuid;
    v_to_type   := v_e->>'to_type';
    v_to_id     := (v_e->>'to_id')::uuid;
    v_rel_type  := v_e->>'relationship_type';
    v_desc      := v_e->>'description';
    v_strength  := coalesce((v_e->>'strength')::numeric, 0.5);

    begin
      insert into public.substrate_relationships (id, basket_id, from_type, from_id, to_type, to_id, relationship_type, description, strength)
      values (gen_random_uuid(), p_basket_id, v_from_type, v_from_id, v_to_type, v_to_id, v_rel_type, v_desc, v_strength);
      v_created := v_created + 1;
    exception when unique_violation then
      v_ignored := v_ignored + 1;
    end;
  end loop;

  -- Emit into general events bus with small payload (timeline has constrained kinds)
  insert into public.events (id, basket_id, kind, payload, workspace_id, origin)
  values (gen_random_uuid(), p_basket_id, 'rel.bulk_upserted',
          jsonb_build_object('basket_id', p_basket_id, 'created', v_created, 'ignored', v_ignored, 'idem_key', coalesce(p_idem_key,'')),
          null, 'system');

  return jsonb_build_object('created', v_created, 'ignored', v_ignored, 'idem_reused', false);
end;
$$;