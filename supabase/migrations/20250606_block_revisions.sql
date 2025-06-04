-- 2025-06-06: add block_revisions and block_brief_link tables

create table if not exists public.block_revisions (
    id uuid primary key default gen_random_uuid(),
    block_id uuid references public.context_blocks(id),
    prev_content text,
    new_content text,
    changed_by text not null,
    proposal_event jsonb,
    created_at timestamptz default now()
);

grant select, insert on public.block_revisions to authenticated;

create table if not exists public.block_brief_link (
    id uuid primary key default gen_random_uuid(),
    block_id uuid references public.context_blocks(id),
    task_brief_id uuid references public.task_briefs(id),
    transformation text,
    created_at timestamptz default now()
);

grant select, insert on public.block_brief_link to authenticated;
