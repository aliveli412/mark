-- Run in Supabase SQL Editor after schema.sql (safe to re-run).
-- Adds single-event fields + public RSVP table.

alter table public.events add column if not exists slug text;
alter table public.events add column if not exists address text not null default '';
alter table public.events add column if not exists contact_name text not null default '';
alter table public.events add column if not exists contact_phone text not null default '';
alter table public.events add column if not exists contact_email text not null default '';
alter table public.events add column if not exists category text not null default '';
alter table public.events add column if not exists rsvp_enabled boolean not null default true;

update public.events
set slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
where slug is null or slug = '';

update public.events
set slug = id::text
where slug is null or slug = '';

create unique index if not exists events_slug_uidx on public.events (slug);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  email text not null,
  guests integer not null default 1 check (guests > 0 and guests <= 20),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists event_rsvps_event_id_idx on public.event_rsvps (event_id);

alter table public.event_rsvps enable row level security;

drop policy if exists "Public can RSVP to open events" on public.event_rsvps;
create policy "Public can RSVP to open events" on public.event_rsvps
  for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.published = true and e.rsvp_enabled = true
    )
  );

drop policy if exists "Admins read RSVPs" on public.event_rsvps;
create policy "Admins read RSVPs" on public.event_rsvps
  for select using (public.is_admin());

drop policy if exists "Admins manage RSVPs" on public.event_rsvps;
create policy "Admins manage RSVPs" on public.event_rsvps
  for all using (public.is_admin()) with check (public.is_admin());
