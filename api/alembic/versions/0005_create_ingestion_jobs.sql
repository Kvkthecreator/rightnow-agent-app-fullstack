-- upgrade
create table ingestion_jobs (
    id uuid primary key default gen_random_uuid(),
    draft_block_id uuid not null,
    created_at timestamptz not null default now()
);
-- downgrade
drop table if exists ingestion_jobs;
