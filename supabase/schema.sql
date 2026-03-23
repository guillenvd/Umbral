-- Umbral - Initial schema for Supabase (PostgreSQL)
-- Mobile-first residential access control + guard operations

create extension if not exists pgcrypto;

-- ==========
-- Types
-- ==========

do $$ begin
  create type app_role as enum ('resident', 'guard', 'committee', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type visit_status as enum ('pending', 'arrived', 'authorized', 'rejected', 'cancelled', 'expired');
exception
  when duplicate_object then null;
end $$;

alter type visit_status add value if not exists 'delivered_gate';
alter type visit_status add value if not exists 'sent_to_house';

do $$ begin
  create type visit_type as enum ('visitor', 'delivery');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type dropoff_location as enum ('gate', 'house');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type announcement_priority as enum ('normal', 'important', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type audit_action as enum (
    'visit_created',
    'visit_updated',
    'visit_status_changed',
    'message_sent',
    'announcement_created',
    'user_role_changed'
  );
exception
  when duplicate_object then null;
end $$;

-- ==========
-- Utility functions
-- ==========

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_role()
returns app_role
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_house_member(target_house_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.house_members hm
    where hm.user_id = auth.uid()
      and hm.house_id = target_house_id
      and hm.is_active = true
  );
$$;

-- ==========
-- Core entities
-- ==========

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role app_role not null default 'resident',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  street text,
  section text,
  building text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.house_members (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (house_id, user_id)
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete restrict,
  resident_id uuid not null references public.profiles(id) on delete restrict,
  user_id uuid generated always as (resident_id) stored,
  type visit_type not null default 'visitor',
  visitor_name text,
  eta_at timestamptz not null,
  eta timestamptz generated always as (eta_at) stored,
  vehicle_plate text,
  note text,
  delivery_company text,
  delivery_type text,
  dropoff_location dropoff_location,
  instructions text,
  contactless boolean not null default false,
  status visit_status not null default 'pending',
  arrived_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  expires_at timestamptz generated always as (eta_at + interval '6 hours') stored,
  constraint visits_delivery_fields_consistency check (
    (
      type = 'visitor'
      and visitor_name is not null
      and delivery_company is null
      and delivery_type is null
      and dropoff_location is null
      and instructions is null
      and contactless = false
    )
    or (
      type = 'delivery'
      and dropoff_location is not null
    )
  )
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete restrict,
  to_user uuid not null references public.profiles(id) on delete restrict,
  visit_id uuid references public.visits(id) on delete set null,
  content text not null check (length(content) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  peer_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, peer_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  priority announcement_priority not null default 'normal',
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_targets (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  section text,
  building text,
  street text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action audit_action not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ==========
-- Indexes
-- ==========

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_house_members_user on public.house_members(user_id) where is_active = true;
create index if not exists idx_visits_eta on public.visits(eta_at);
create index if not exists idx_visits_status on public.visits(status);
create index if not exists idx_visits_type on public.visits(type);
create index if not exists idx_visits_house_created on public.visits(house_id, created_at desc);
create index if not exists idx_messages_from_created on public.messages(from_user, created_at desc);
create index if not exists idx_messages_to_created on public.messages(to_user, created_at desc);
create index if not exists idx_messages_visit_created on public.messages(visit_id, created_at desc);
create index if not exists idx_conversation_reads_user_peer on public.conversation_reads(user_id, peer_id);
create index if not exists idx_announcements_published on public.announcements(is_published, published_at desc);
create index if not exists idx_audit_entity_created on public.audit_logs(entity, created_at desc);

-- ==========
-- Triggers
-- ==========

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_houses_updated_at on public.houses;
create trigger trg_houses_updated_at
before update on public.houses
for each row execute function public.set_updated_at();

drop trigger if exists trg_visits_updated_at on public.visits;
create trigger trg_visits_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists trg_conversation_reads_updated_at on public.conversation_reads;
create trigger trg_conversation_reads_updated_at
before update on public.conversation_reads
for each row execute function public.set_updated_at();

-- ==========
-- Audit helpers
-- ==========

create or replace function public.log_visit_change()
returns trigger
language plpgsql
security definer
as $$
declare
  action_name audit_action;
begin
  if tg_op = 'INSERT' then
    action_name := 'visit_created';
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      action_name := 'visit_status_changed';
    else
      action_name := 'visit_updated';
    end if;
  else
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values (
    auth.uid(),
    action_name,
    'visits',
    new.id,
    jsonb_build_object(
      'old_status', old.status,
      'new_status', new.status,
      'house_id', new.house_id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_visits_audit on public.visits;
create trigger trg_visits_audit
after insert or update on public.visits
for each row execute function public.log_visit_change();

create or replace function public.log_message_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values (
    auth.uid(),
    'message_sent',
    'messages',
    new.id,
    jsonb_build_object(
      'from_user', new.from_user,
      'to_user', new.to_user,
      'visit_id', new.visit_id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_messages_audit on public.messages;
create trigger trg_messages_audit
after insert on public.messages
for each row execute function public.log_message_created();

create or replace function public.log_announcement_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values (
    auth.uid(),
    'announcement_created',
    'announcements',
    new.id,
    '{}'::jsonb
  );

  return new;
end;
$$;

drop trigger if exists trg_announcements_audit on public.announcements;
create trigger trg_announcements_audit
after insert on public.announcements
for each row execute function public.log_announcement_created();

-- ==========
-- RLS
-- ==========

alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.house_members enable row level security;
alter table public.visits enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_targets enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
create policy if not exists "profiles_self_or_admin_read"
on public.profiles
for select
using (id = auth.uid() or public.current_role() = 'admin');

create policy if not exists "profiles_self_update"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- Houses
create policy if not exists "houses_member_guard_admin_read"
on public.houses
for select
using (
  public.is_house_member(id)
  or public.current_role() in ('guard', 'admin')
);

-- House members
create policy if not exists "house_members_self_guard_admin_read"
on public.house_members
for select
using (user_id = auth.uid() or public.current_role() in ('guard', 'admin'));

-- Visits
drop policy if exists "visits_resident_guard_admin_read" on public.visits;
drop policy if exists "visits_resident_insert" on public.visits;
drop policy if exists "visits_resident_update_pending" on public.visits;
drop policy if exists "visits_guard_admin_update" on public.visits;

-- Read: resident only own records; guard/admin all.
create policy "visits_resident_guard_admin_read"
on public.visits
for select
using (
  resident_id = auth.uid()
  or public.current_role() in ('guard', 'admin')
);

-- Insert: resident in own active house.
create policy "visits_resident_insert"
on public.visits
for insert
with check (
  public.current_role() = 'resident'
  and resident_id = auth.uid()
  and public.is_house_member(house_id)
);

-- Resident updates only own pending visits; may keep pending or cancel.
create policy "visits_resident_update_pending"
on public.visits
for update
using (
  public.current_role() = 'resident'
  and resident_id = auth.uid()
  and status = 'pending'
)
with check (
  resident_id = auth.uid()
  and status in ('pending', 'cancelled')
);

-- Guard operational updates: no cancel status.
create policy "visits_guard_update_operational"
on public.visits
for update
using (public.current_role() = 'guard')
with check (
  public.current_role() = 'guard'
  and status in ('pending', 'arrived', 'authorized', 'rejected', 'delivered_gate', 'sent_to_house', 'expired')
);

-- Admin update access.
create policy "visits_admin_update"
on public.visits
for update
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- Messages (chat residente <-> caseta)
drop policy if exists "messages_read" on public.messages;
drop policy if exists "messages_insert" on public.messages;

create policy "messages_read"
on public.messages
for select
using (
  from_user = auth.uid()
  or to_user = auth.uid()
  or (
    public.current_role() = 'guard'
    and exists (
      select 1
      from public.profiles p_from, public.profiles p_to
      where p_from.id = from_user
        and p_to.id = to_user
        and (p_from.role = 'resident' or p_to.role = 'resident')
    )
  )
);

create policy "messages_insert"
on public.messages
for insert
with check (
  from_user = auth.uid()
  and (
    (
      public.current_role() = 'resident'
      and exists (select 1 from public.profiles p where p.id = to_user and p.role = 'guard')
    )
    or (
      public.current_role() = 'guard'
      and exists (select 1 from public.profiles p where p.id = to_user and p.role = 'resident')
    )
  )
);

drop policy if exists "conversation_reads_self_read" on public.conversation_reads;
drop policy if exists "conversation_reads_self_write" on public.conversation_reads;

create policy "conversation_reads_self_read"
on public.conversation_reads
for select
using (user_id = auth.uid());

create policy "conversation_reads_self_write"
on public.conversation_reads
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Announcements
create policy if not exists "announcements_read"
on public.announcements
for select
using (
  is_published = true
  or public.current_role() in ('committee', 'admin')
);

create policy if not exists "announcements_committee_admin_insert"
on public.announcements
for insert
with check (public.current_role() in ('committee', 'admin'));

create policy if not exists "announcements_committee_admin_update"
on public.announcements
for update
using (public.current_role() in ('committee', 'admin'))
with check (public.current_role() in ('committee', 'admin'));

-- Announcement targets readable by all authenticated users that can read announcement
create policy if not exists "announcement_targets_read"
on public.announcement_targets
for select
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_id
      and (a.is_published = true or public.current_role() in ('committee', 'admin'))
  )
);

create policy if not exists "announcement_targets_committee_admin_write"
on public.announcement_targets
for all
using (public.current_role() in ('committee', 'admin'))
with check (public.current_role() in ('committee', 'admin'));

-- Audit logs: append-only via triggers/functions, no delete
create policy if not exists "audit_logs_guard_admin_read"
on public.audit_logs
for select
using (public.current_role() in ('guard', 'admin'));

create policy if not exists "audit_logs_no_direct_insert"
on public.audit_logs
for insert
with check (false);

create policy if not exists "audit_logs_no_update"
on public.audit_logs
for update
using (false);

create policy if not exists "audit_logs_no_delete"
on public.audit_logs
for delete
using (false);

-- ==========
-- Realtime notes
-- ==========
-- Enable realtime in Supabase dashboard for:
-- visits, messages, announcements
-- Recommended channels:
-- - visits: by day/status
-- - messages: by house_id
-- - announcements: published feed
