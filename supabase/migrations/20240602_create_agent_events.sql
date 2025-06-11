create table if not exists agent_events (
  id           uuid primary key default gen_random_uuid(),
  basket_id    uuid,
  agent        text,
  phase        text,
  payload      jsonb,
  created_at   timestamp with time zone default now()
);

-- Helpful composite index for traces
create index if not exists idx_agent_events_basket_phase
  on agent_events (basket_id, phase, created_at desc);
