-- 2025-05-28: create profile_core_data table per PRD ERD
create table if not exists profile_core_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  display_name text,
  brand_or_company text,
  sns_links jsonb,
  tone_preferences text,
  logo_url text,
  locale text,
  updated_at timestamp with time zone default now()
);