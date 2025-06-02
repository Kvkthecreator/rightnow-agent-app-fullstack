-- 1. events table
create table if not exists public.events (
    id           uuid primary key default gen_random_uuid(),
    topic        text     not null,
    payload      jsonb    not null,
    created_at   timestamptz default now()
);

-- 2. helper function to auto-NOTIFY on insert
create or replace function public.events_notify() returns trigger
language plpgsql as $$
begin
    perform pg_notify(NEW.topic, NEW.payload::text);
    return NEW;
end;
$$;

-- 3. trigger
drop trigger if exists events_notify_trigger on public.events;
create trigger events_notify_trigger
after insert on public.events
for each row execute procedure public.events_notify();
