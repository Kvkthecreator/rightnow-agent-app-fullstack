-- 2025-05-28: create task_briefs table per PRD ERD
create table if not exists task_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  intent text not null,
  sub_instructions text,
  media jsonb,
  core_profile_data jsonb,
  created_at timestamp with time zone default now()
);