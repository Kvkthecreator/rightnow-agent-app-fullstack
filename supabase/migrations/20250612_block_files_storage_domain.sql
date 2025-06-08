-- Ensure storage_domain enum and defaults
create type if not exists storage_domain as enum ('block-files','user-library','basket-dumps');
alter table block_files alter column storage_domain set default 'block-files';
