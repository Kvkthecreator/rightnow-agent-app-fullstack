-- upgrade
create table baskets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    created_at timestamptz not null default now()
);
create table basket_inputs (
    id uuid primary key default gen_random_uuid(),
    basket_id uuid not null references baskets(id),
    content text,
    created_at timestamptz not null default now()
);
create table basket_threads (
    id uuid primary key default gen_random_uuid(),
    basket_id uuid not null references baskets(id),
    thread_id text
);
create table basket_configs (
    id uuid primary key default gen_random_uuid(),
    basket_id uuid not null references baskets(id),
    config_json jsonb
);
create table dump_commits (
    id uuid primary key default gen_random_uuid(),
    basket_id uuid not null references baskets(id),
    created_at timestamptz not null default now()
);
-- downgrade
drop table if exists dump_commits;
drop table if exists basket_configs;
drop table if exists basket_threads;
drop table if exists basket_inputs;
drop table if exists baskets;
