create table if not exists public.block_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_url text not null,
  file_name text,
  label text not null,
  size_bytes bigint,
  storage_domain text not null,
  created_at timestamp with time zone default now()
);

alter publication supabase_realtime add table public.block_files;
