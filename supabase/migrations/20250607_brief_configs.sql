create table brief_configs (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid references task_briefs(id) on delete cascade,
  user_id uuid references auth.users(id),
  version int default 1,
  output_type text default 'openai_call',
  config_json jsonb not null,
  external_url text,
  created_at timestamptz default now()
);
create index on brief_configs(brief_id);
