-- upgrade
create table block_change_queue (
    id uuid primary key default gen_random_uuid(),
    action text not null,
    block_id uuid not null,
    proposed_data jsonb,
    status text not null default 'pending',
    source_scope text,
    created_at timestamptz not null default now()
);
-- downgrade
drop table if exists block_change_queue;
