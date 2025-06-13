-- upgrade
create table brief_configs (
    id uuid primary key default gen_random_uuid(),
    brief_id uuid not null,
    user_id uuid not null,
    config_json jsonb,
    created_at timestamptz not null default now()
);
-- downgrade
drop table if exists brief_configs;
