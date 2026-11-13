-- Associate calendar events with a lodge microsite (MarkSite.slug).
-- Run in Supabase SQL editor after schema.sql / events-rsvp.sql.

alter table public.events
  add column if not exists lodge_slug text;

create index if not exists events_lodge_slug_starts_at_idx
  on public.events (lodge_slug, starts_at);

comment on column public.events.lodge_slug is
  'Optional Mark Sites slug (e.g. gallipoli). When set, drives that lodge homepage countdown and members meeting list.';
