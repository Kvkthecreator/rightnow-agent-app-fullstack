-- upgrade
create table dump_artifacts (
    id uuid primary key default gen_random_uuid(),
    block_id uuid not null,
    content text,
    created_at timestamptz not null default now()
);
-- downgrade
drop table if exists dump_artifacts;
