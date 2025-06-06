create table user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  provider text,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  created_at timestamptz default now()
);
create unique index on user_integrations(user_id, provider);
