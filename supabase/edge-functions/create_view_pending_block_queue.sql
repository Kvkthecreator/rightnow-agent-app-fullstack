create or replace function pending_block_queue_with_block_label()
returns table (
  id uuid,
  action text,
  block_id uuid,
  proposed_data jsonb,
  created_at timestamptz,
  label text
) language sql stable as $$
  select q.id, q.action, q.block_id, q.proposed_data, q.created_at, cb.label
  from block_change_queue q
  join context_blocks cb on cb.id = q.block_id
  where q.status = 'pending'
  order by q.created_at;
$$;
