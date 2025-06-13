-- upgrade
alter table context_blocks
rename column meta_context_scope to meta_scope;
-- downgrade
alter table context_blocks
rename column meta_scope to meta_context_scope;
