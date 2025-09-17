-- Notifications persistence schema (Option A)
-- Creates user_notifications and workspace_notification_settings with RLS policies.

-- Tables
create table if not exists public.user_notifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null,
  type text not null,
  category text not null,
  severity text not null default 'info',
  title text not null,
  message text not null,
  channels jsonb not null default '[]'::jsonb,
  persistence_settings jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  related_entities jsonb not null default '{}'::jsonb,
  governance_context jsonb not null default '{}'::jsonb,
  status text not null default 'unread',
  cross_page_persist boolean not null default true,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  acknowledged_at timestamptz
);

create index if not exists idx_un_ws_user on public.user_notifications (workspace_id, user_id, created_at desc);
create index if not exists idx_un_status on public.user_notifications (status);
create index if not exists idx_un_cross on public.user_notifications (cross_page_persist) where cross_page_persist;

alter table public.user_notifications enable row level security;

-- Workspace-level notification settings
create table if not exists public.workspace_notification_settings (
  workspace_id uuid primary key references public.workspaces(id),
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.workspace_notification_settings enable row level security;

-- Policies for user_notifications
do $$ begin
  begin
    create policy "Users can view their notifications"
    on public.user_notifications for select to authenticated
    using (
      user_id = auth.uid()
      and workspace_id in (
        select workspace_memberships.workspace_id
        from public.workspace_memberships
        where workspace_memberships.user_id = auth.uid()
      )
    );
  exception when duplicate_object then null; end;

  begin
    create policy "Users can insert their notifications"
    on public.user_notifications for insert to authenticated
    with check (
      user_id = auth.uid()
      and workspace_id in (
        select workspace_memberships.workspace_id
        from public.workspace_memberships
        where workspace_memberships.user_id = auth.uid()
      )
    );
  exception when duplicate_object then null; end;

  begin
    create policy "Users can update their notifications"
    on public.user_notifications for update to authenticated
    using (
      user_id = auth.uid()
      and workspace_id in (
        select workspace_memberships.workspace_id
        from public.workspace_memberships
        where workspace_memberships.user_id = auth.uid()
      )
    )
    with check (user_id = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "Service role can manage notifications"
    on public.user_notifications to service_role
    using (true) with check (true);
  exception when duplicate_object then null; end;
end $$;

-- Policies for workspace_notification_settings
do $$ begin
  begin
    create policy "Members can read settings"
    on public.workspace_notification_settings for select to authenticated
    using (
      workspace_id in (
        select workspace_memberships.workspace_id
        from public.workspace_memberships
        where workspace_memberships.user_id = auth.uid()
      )
    );
  exception when duplicate_object then null; end;

  begin
    create policy "Members can upsert settings"
    on public.workspace_notification_settings for insert to authenticated
    with check (
      workspace_id in (
        select workspace_memberships.workspace_id
        from public.workspace_memberships
        where workspace_memberships.user_id = auth.uid()
      )
    );
  exception when duplicate_object then null; end;

  begin
    create policy "Members can update settings"
    on public.workspace_notification_settings for update to authenticated
    using (
      workspace_id in (
        select workspace_memberships.workspace_id
        from public.workspace_memberships
        where workspace_memberships.user_id = auth.uid()
      )
    )
    with check (true);
  exception when duplicate_object then null; end;
end $$;

-- Done
