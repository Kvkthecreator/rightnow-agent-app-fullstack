-- upgrade
alter table context_blocks
add column updated_at timestamptz not null default now();
create index if not exists idx_context_blocks_updated_at on context_blocks(updated_at desc);
-- downgrade
alter table context_blocks drop column updated_at;
