-- upgrade
alter table context_blocks
add column is_draft boolean not null default false,
add column is_superseded boolean not null default false,
add column basket_id uuid,
add column tags text[];
-- downgrade
alter table context_blocks
  drop column tags,
  drop column basket_id,
  drop column is_superseded,
  drop column is_draft;
