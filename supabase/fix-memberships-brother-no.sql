-- Quick fix if memberships.sql failed with:
-- ERROR: column "brother_no" does not exist
-- Run this once, then re-run memberships.sql (or continue with seed-fwb-roster.sql).

alter table public.lodge_membership_settings
  add column if not exists is_pilot boolean not null default false,
  add column if not exists roster_source text not null default '';

alter table public.lodge_member_roster
  add column if not exists brother_no text not null default '',
  add column if not exists surname text not null default '',
  add column if not exists given_names text not null default '',
  add column if not exists prefix text not null default '',
  add column if not exists initials text not null default '',
  add column if not exists title text not null default '',
  add column if not exists suffix text not null default '',
  add column if not exists home_phone text not null default '',
  add column if not exists mobile text not null default '',
  add column if not exists postcode text not null default '',
  add column if not exists address text not null default '',
  add column if not exists address2 text not null default '',
  add column if not exists address3 text not null default '',
  add column if not exists city text not null default '',
  add column if not exists county text not null default '',
  add column if not exists country text not null default '',
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists grand_rank text not null default '',
  add column if not exists prov_rank text not null default '',
  add column if not exists unit_rank text not null default '',
  add column if not exists grand_rank_id text not null default '',
  add column if not exists prov_rank_id text not null default '',
  add column if not exists unit_rank_id text not null default '',
  add column if not exists unit_rank_start date,
  add column if not exists prov_rank_start date,
  add column if not exists grand_rank_start date,
  add column if not exists unit_prefix text not null default '',
  add column if not exists prov_prefix text not null default '',
  add column if not exists grand_prefix text not null default '',
  add column if not exists activity text not null default '';

alter table public.lodge_member_roster
  alter column email set default '';

drop index if exists lodge_member_roster_slug_email_idx;
create unique index if not exists lodge_member_roster_slug_brother_idx
  on public.lodge_member_roster (lodge_slug, brother_no)
  where brother_no <> '';
create index if not exists lodge_member_roster_slug_email_idx
  on public.lodge_member_roster (lodge_slug, lower(email));
