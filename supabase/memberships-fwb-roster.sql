-- Expand lodge member roster to FWB Excel fields and seed Freemasons Without Borders.
-- Run after supabase/memberships.sql. Safe to re-run.

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

-- Brother number is the stable unique key within a lodge (emails can duplicate).
drop index if exists lodge_member_roster_slug_email_idx;
create unique index if not exists lodge_member_roster_slug_brother_idx
  on public.lodge_member_roster (lodge_slug, brother_no)
  where brother_no <> '';
create index if not exists lodge_member_roster_slug_email_idx
  on public.lodge_member_roster (lodge_slug, lower(email));

-- Pilot flag / note on settings
alter table public.lodge_membership_settings
  add column if not exists is_pilot boolean not null default false,
  add column if not exists roster_source text not null default '';

update public.lodge_membership_settings
set
  is_pilot = true,
  roster_source = 'As of 06-06-2022.xlsx',
  active = true,
  updated_at = now()
where lodge_slug = 'freemasons-without-borders';

insert into public.lodge_membership_settings (
  lodge_slug, monthly_pence, yearly_pence, standing_order_pence, is_pilot, roster_source, active
) values (
  'freemasons-without-borders', 1500, 15000, 1500, true, 'As of 06-06-2022.xlsx', true
)
on conflict (lodge_slug) do update set
  is_pilot = excluded.is_pilot,
  roster_source = excluded.roster_source,
  active = true,
  updated_at = now();
