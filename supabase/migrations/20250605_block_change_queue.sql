-- supabase/migrations/20250605_block_change_queue.sql

create type proposal_action_enum as enum ('create', 'update', 'delete', 'merge');

create table public.block_change_queue (
    id              uuid primary key default gen_random_uuid(),
    action          proposal_action_enum not null,
    block_id        uuid,
    proposed_data   jsonb,              -- new or merged block content
    source_event    text   not null,    -- audit_report | usage_report | …
    status          text   default 'pending',   -- pending | approved | applied | rejected
    reason          text,               -- human-readable explainer
    created_at      timestamptz default now()
);

grant select,insert on public.block_change_queue to authenticated;
-- (service_role already has full perms)
