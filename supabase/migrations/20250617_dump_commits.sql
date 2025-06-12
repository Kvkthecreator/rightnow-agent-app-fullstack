-- 1. Commit table
create table if not exists public.dump_commits (
  id          uuid primary key default gen_random_uuid(),
  basket_id   uuid references public.baskets,
  user_id     uuid references auth.users,
  summary     text,
  created_at  timestamptz default now()
);

-- 2. context_blocks.commit_id
alter table public.context_blocks
  add column if not exists commit_id uuid references public.dump_commits;

-- 3. block_change_queue.commit_id
alter table public.block_change_queue
  add column if not exists commit_id uuid references public.dump_commits;
