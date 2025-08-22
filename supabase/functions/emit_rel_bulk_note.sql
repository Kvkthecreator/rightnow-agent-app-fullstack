-- emit_rel_bulk_note.sql
create or replace function public.emit_rel_bulk_note(p_basket uuid, p_created int, p_ignored int, p_idem_key text)
returns void language plpgsql as $$
begin
  insert into public.timeline_events (basket_id, kind, ref_id, preview, payload)
  values (
    p_basket, 'system_note', null,
    'Graph updated: ' || p_created || ' new, ' || p_ignored || ' ignored',
    jsonb_build_object('created', p_created, 'ignored', p_ignored, 'idem_key', coalesce(p_idem_key,''))
  );
end$$;